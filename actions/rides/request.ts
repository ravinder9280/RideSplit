"use server";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function requestRide(formData: FormData) {
    const user = await currentUser();
    
    
    if (!user) throw new Error("Not authenticated");

    const rideId = formData.get("rideId") as string;
    const seatsRequested = Number(formData.get("seatsRequested") || 1);
    console.log(rideId)

    if (!rideId) throw new Error("Missing rideId");
    if (seatsRequested < 1) throw new Error("Invalid seat request");

    return await prisma.$transaction(async (tx) => {
        const ride = await tx.ride.findUnique({
            where: { id: rideId },
            include: { owner: true },
        });
        if (!ride) throw new Error("Ride not found");
        if (ride.owner.clerkId === user.id) throw new Error("Cannot request own ride");
        if (ride.status !== "ACTIVE") throw new Error("Ride not active");
        if (ride.departureAt < new Date()) throw new Error("Ride already departed");

        try {
            const member = await tx.rideMember.create({
                data: {
                    rideId,
                    userId: (await tx.user.findUniqueOrThrow({ where: { clerkId: user.id } })).id,
                    status: "PENDING",
                    fareShare: ride.perSeatPrice * seatsRequested,
                },
            });
            // trigger revalidation if needed
            revalidatePath(`/ride/${rideId}`);
            return { ok: true, member };
        } catch (err: any) {
            if (err.code === "P2002") {
                // unique constraint (already requested)
                return { ok: false, message: "You already requested this ride" };
            }
            throw err;
        }
    });
}
