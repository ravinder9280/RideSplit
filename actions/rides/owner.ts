// app/actions/requests/owner.ts
"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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

    return { ok: true, member: updated };
}
