"use server";

import { prisma } from "@/lib/prisma";
import {  currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function cancelMyRequest(memberId: string) {
    const user = await currentUser();
    const userId = user?.id
    if (!userId) throw new Error("Not authenticated");

    return prisma.$transaction(async (tx) => {
        const member = await tx.rideMember.findUnique({
            where: { id: memberId },
            include: { ride: true, user: true },
        });
        if (!member) throw new Error("Request not found");

        const me = await tx.user.findUnique({ where: { id: member.userId } });
        if (!me || me.clerkId !== userId) throw new Error("Not your request");

        if (member.status === "PENDING") {
            await tx.rideMember.update({ where: { id: memberId }, data: { status: "CANCELLED" } });
        } else if (member.status === "ACCEPTED") {
            await tx.ride.update({
                where: { id: member.rideId },
                data: { seatsAvailable: { increment: 1 } },
            });
            await tx.rideMember.update({ where: { id: memberId }, data: { status: "CANCELLED" } });
        } else {
            throw new Error("Cannot cancel this request");
        }

        revalidatePath(`/ride/${member.rideId}`);
        return { ok: true };
    });
}
