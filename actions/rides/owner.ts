"use server";

import { prisma } from "@/lib/prisma";
import {  currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function acceptRequest(memberId: string) {
    const user = await currentUser();
    const userId=user?.id
    if (!userId) throw new Error("Not authenticated");

    return prisma.$transaction(async (tx) => {
        const member = await tx.rideMember.findUnique({
            where: { id: memberId },
            include: { ride: true, user: true },
        });
        if (!member) throw new Error("Request not found");

        const ride = await tx.ride.findUnique({ where: { id: member.rideId } });
        if (!ride) throw new Error("Ride missing");
        const owner = await tx.user.findUnique({ where: { id: ride.ownerId } });
        if (!owner || owner.clerkId !== userId) throw new Error("Not your ride");

        if (ride.status !== "ACTIVE") throw new Error("Ride not active");
        if (ride.departureAt < new Date()) throw new Error("Ride already departed");
        if (member.status !== "PENDING") throw new Error("Request not pending");
        if (ride.seatsAvailable < 1) throw new Error("No seats left");

        await tx.ride.update({
            where: { id: ride.id },
            data: { seatsAvailable: { decrement: 1 } },
        });
        await tx.rideMember.update({
            where: { id: memberId },
            data: { status: "ACCEPTED" },
        });

        revalidatePath(`/ride/${ride.id}`);
        return { ok: true };
    });
}

export async function declineRequest(memberId: string) {
    const user = await currentUser();
    const userId = user?.id
    if (!userId) throw new Error("Not authenticated");

    return prisma.$transaction(async (tx) => {
        const member = await tx.rideMember.findUnique({
            where: { id: memberId },
            include: { ride: true },
        });
        if (!member) throw new Error("Request not found");

        const ride = await tx.ride.findUnique({ where: { id: member.rideId } });
        if (!ride) throw new Error("Ride missing");
        const owner = await tx.user.findUnique({ where: { id: ride.ownerId } });
        if (!owner || owner.clerkId !== userId) throw new Error("Not your ride");

        if (member.status !== "PENDING") throw new Error("Request not pending");

        await tx.rideMember.update({
            where: { id: memberId },
            data: { status: "DECLINED" },
        });

        revalidatePath(`/ride/${ride.id}`);
        return { ok: true };
    });
}
