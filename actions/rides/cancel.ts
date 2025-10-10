// app/actions/requests/cancel.ts
"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const idSchema = z.object({ memberId: z.string().min(1) });

export async function cancelMyRequest(formData: FormData) {
    const user = await currentUser();
    const userId = user?.id
    if (!userId) return { ok: false, message: "Not signed in" };

    const parsed = idSchema.safeParse({ memberId: formData.get("memberId") });
    if (!parsed.success) return { ok: false, message: "Invalid input" };
    const { memberId } = parsed.data;

    const member = await prisma.rideMember.findUnique({
        where: { id: memberId },
        include: { ride: true, user: true },
    });
    if (!member) return { ok: false, message: "Not found" };

    const me = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!me || me.id !== member.userId) return { ok: false, message: "Not your request" };

    if (member.status === "ACCEPTED") {
        await prisma.$transaction(async (tx) => {
            await tx.ride.update({
                where: { id: member.rideId },
                data: { seatsAvailable: { increment: member.seatsRequested } },
            });
            await tx.rideMember.update({
                where: { id: member.id },
                data: { status: "CANCELLED" },
            });
        });
    } else {
        await prisma.rideMember.update({
            where: { id: member.id },
            data: { status: "CANCELLED" },
        });
    }

    return { ok: true };
}
