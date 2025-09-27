// app/api/webhook/clerk/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import type { WebhookEvent, UserJSON, DeletedObjectJSON } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

function primaryEmail(d: Pick<UserJSON, 'email_addresses' | 'primary_email_address_id'>) {
    const arr = (d?.email_addresses ?? []) as Array<{ id: string; email_address: string }>;
    if (!arr.length) return null;
    const pid = d?.primary_email_address_id as string | undefined;
    return arr.find(e => e.id === pid)?.email_address ?? arr[0]?.email_address ?? null;
}

export async function GET() {
    return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}

export async function POST(req: NextRequest) {
    const h = headers();
    const id = h.get('svix-id');
    const ts = h.get('svix-timestamp');
    const sig = h.get('svix-signature');

    if (!id || !ts || !sig) {
        // Don’t expose details; still 2xx to avoid retries loop on client mistakes
        return NextResponse.json({ ok: true, persisted: false, error: 'missing_svix_headers' });
    }

    const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
    if (!secret) {
        return NextResponse.json({ ok: true, persisted: false, error: 'missing_signing_secret' });
    }

    // IMPORTANT: raw body for verification
    const body = await req.text();

    let evt: WebhookEvent;
    try {
        evt = new Webhook(secret).verify(body, {
            'svix-id': id,
            'svix-timestamp': ts,
            'svix-signature': sig,
        }) as WebhookEvent;
    } catch (e) {
        return NextResponse.json({ ok: true, persisted: false, error: 'invalid_signature' });
    }

    try {
        // Idempotency: ignore if we’ve already processed this svix-id
        // Create a small row keyed by svix message id
        await prisma.webhookEvent.create({ data: { id } });
    } catch {
        // duplicate svix-id -> already processed
        return NextResponse.json({ ok: true, deduped: true });
    }

    const { type, data } = evt;

    // CREATE / UPDATE
    if (type === 'user.created' || type === 'user.updated') {
        const clerkId = (data as UserJSON).id;
        const email = primaryEmail(data);
        const firstName = (data as UserJSON).first_name ?? null;
        const lastName = (data as UserJSON).last_name ?? null;
        const imageUrl = (data as UserJSON).image_url ?? null;
        const name = [firstName, lastName].filter(Boolean).join(' ') || email || 'User';

        try {
            await prisma.$transaction(async (tx) => {
                const byClerk = await tx.user.findUnique({ where: { clerkId } });
                if (byClerk) {
                    await tx.user.update({
                        where: { clerkId },
                        data: { email: email ?? undefined, firstName, lastName, imageUrl, name },
                    });
                    return;
                }
                if (email) {
                    const byEmail = await tx.user.findUnique({ where: { email } });
                    if (byEmail) {
                        await tx.user.update({
                            where: { email },
                            data: { clerkId, firstName, lastName, imageUrl, name },
                        });
                        return;
                    }
                }
                await tx.user.create({
                    data: { clerkId, email: email ?? null, firstName, lastName, imageUrl, name, rating: 5 },
                });
            });

            return NextResponse.json({ ok: true, persisted: true });
        } catch (e: any) {
            // Ack but tell yourself what failed
            return NextResponse.json({
                ok: true,
                persisted: false,
                error: e?.code ? `${e.code}:${e?.meta?.target ?? ''}` : (e?.message ?? 'db_error'),
            });
        }
    }

    // DELETE
    if (type === 'user.deleted') {
        try {
            await prisma.user.deleteMany({ where: { clerkId: (data as DeletedObjectJSON).id } });
            return NextResponse.json({ ok: true, persisted: true });
        } catch {
            return NextResponse.json({ ok: true, persisted: false, error: 'db_delete_failed' });
        }
    }

    // Unhandled event types -> ok
    return NextResponse.json({ ok: true, skipped: type });
}
