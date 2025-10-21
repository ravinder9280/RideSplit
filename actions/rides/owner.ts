// app/actions/requests/owner.ts
"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendEmail } from "@/lib/email/email";
import { RequestDecisionRiderEmail } from "@/lib/email/RequestDecisionRider";
import { render } from "@react-email/render";

const idSchema = z.object({ memberId: z.string().min(1) });

export async function acceptRequest(memberID: string) {
    const user = await currentUser();
    const userId = user?.id
    if (!userId) return { ok: false, message: "Not signed in" };

    const parsed = idSchema.safeParse({ memberId: memberID});
    if (!parsed.success) return { ok: false, message: "Invalid input" };
    const { memberId } = parsed.data;

    const member = await prisma.rideMember.findUnique({
        where: { id: memberId },
        include: { ride: { include: { owner: true } } },
    });
    if (!member) return { ok: false, message: "Not found" };
    if (member.ride.owner.clerkId !== userId) return { ok: false, message: "Not your ride" };
    if (member.status !== "PENDING") return { ok: false, message: "Not pending" };

    // ensure enough seats still available
    if (member.ride.seatsAvailable < member.seatsRequested) {
        return { ok: false, message: "Seats no longer available" };
    }

    const updated = await prisma.$transaction(async (tx) => {
        await tx.ride.update({
            where: { id: member.rideId },
            data: { seatsAvailable: { decrement: member.seatsRequested } },
        });
        return tx.rideMember.update({
            where: { id: member.id },
            data: { status: "ACCEPTED" },
        });
    });
    const rider = await prisma.user.findUnique({
        where: { id: member.userId },
        select: { email: true, name: true },
    });

    if (rider?.email) {
        const rideUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/ride/${member.rideId}`;
        void sendEmail({
            to: rider.email,
            subject: "Your ride request was accepted",
            html: await render(RequestDecisionRiderEmail({
                riderName: rider.name,
                status: "ACCEPTED",
                rideUrl,
            })),
        });
    }


    return { ok: true, member: updated };
}

export async function declineRequest(memberID:string) {
    const user = await currentUser();
    const userId = user?.id
    if (!userId) return { ok: false, message: "Not signed in" };

    const parsed = idSchema.safeParse({ memberId: memberID });
    if (!parsed.success) return { ok: false, message: "Invalid input" };
    const { memberId } = parsed.data;

    const member = await prisma.rideMember.findUnique({
        where: { id: memberId },
        include: { ride: { include: { owner: true } } },
    });
    if (!member) return { ok: false, message: "Not found" };
    if (member.ride.owner.clerkId !== userId) return { ok: false, message: "Not your ride" };
    if (member.status !== "PENDING") return { ok: false, message: "Not pending" };

    const updated = await prisma.rideMember.update({
        where: { id: member.id },
        data: { status: "DECLINED" },
    });
    //send email
    const rider = await prisma.user.findUnique({
        where: { id: member.userId },
        select: { email: true, name: true },
    });
    if (rider?.email) {
        const rideUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/ride/${member.rideId}`;
        void sendEmail({
            to: rider.email,
            subject: "Your ride request was declined",
            html: await render(RequestDecisionRiderEmail({
                riderName: rider.name,
                status: "DECLINED",
                rideUrl,
            })),
        });
    }


    return { ok: true, member: updated };
}
