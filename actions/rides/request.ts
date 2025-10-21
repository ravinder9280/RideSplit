"use server";

import {  currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendEmail } from "@/lib/email/email";
import { NewRequestOwnerEmail } from "@/lib/email/NewRequestOwner";
import { render } from "@react-email/render";
const schema = z.object({
    rideId: z.string().min(1),
    seats: z.coerce.number().int().min(1).max(8),
});

export async function requestRide(formData: FormData) {
    const clerkUser = await currentUser();
    const userId=clerkUser?.id
    if (!userId) return { ok: false, message: "Not signed in" };

    const parsed = schema.safeParse({
        rideId: formData.get("rideId"),
        seats: formData.get("seats"),
    });
    if (!parsed.success) return { ok: false, message: "Invalid input" };

    const { rideId, seats } = parsed.data;

    const ride = await prisma.ride.findUnique({
        where: { id: rideId },
        select: {
            id: true,
            status: true,
            perSeatPrice: true,
            seatsAvailable: true,
            owner: { select: { clerkId: true } },
        },
    });
    if (!ride) return { ok: false, message: "Ride not found" };
    if (ride.status !== "ACTIVE") return { ok: false, message: "Ride not active" };
    if (ride.seatsAvailable < seats) return { ok: false, message: "Not enough seats" };
    if (ride.owner.clerkId === userId) return { ok: false, message: "Cannot request own ride" };

    const user = await prisma.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
    if (!user) return { ok: false, message: "User missing in DB" };

    // Upsert: if user already requested this ride, update seatsRequested/fareShare
    const fareShare = ride.perSeatPrice * seats; // paise total for all seats

    const member = await prisma.rideMember.upsert({
        where: { rideId_userId: { rideId, userId: user.id } },
        update: { seatsRequested: seats, fareShare },
        create: {
            rideId,
            userId: user.id,
            seatsRequested: seats,
            fareShare,
            status: "PENDING",
        },
    });
    console.log(member)
    const owner = await prisma.user.findUnique({
        where: { clerkId: ride.owner.clerkId },
        select: { email: true, name: true },
    });
    const rider = await prisma.user.findUnique({
        where: { id: user.id },
        select: { name: true },
    });

    if (owner?.email) {
        const rideUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/requests`;
        void sendEmail({
            to: owner.email,
            subject: "New ride request",
            html: await render (NewRequestOwnerEmail({
                ownerName: owner.name,
                riderName: rider?.name,
                seats,
                rideUrl,
            })),
        });
    }


    return { ok: true, member,message:"Request Sent Successfully" };
}
