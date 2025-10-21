"use server";

import {  currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendEmail } from "@/lib/email/email";
import { NewRequestOwnerEmail } from "@/lib/email/NewRequestOwner";
import { render } from "@react-email/render";
import { revalidatePath } from "next/cache";
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
const alreadyRequested = await prisma.rideMember.findFirst({
    where: {
        rideId,
        userId,
    },
});
if (alreadyRequested) return { ok: false, message: "You Have Already requested for this ride" };
    const ride = await prisma.ride.findUnique({
        where: { id: rideId },
        select: {
            id: true,
            status: true,
            perSeatPrice: true,
            seatsAvailable: true,
            owner: { select: { id: true, clerkId: true, email: true, name: true } },
            // include everything you need here
        },
    });
    if (!ride) return { ok: false, message: "Ride not found" };
    if (ride.status !== "ACTIVE") return { ok: false, message: "Ride not active" };
    if (ride.seatsAvailable < seats) return { ok: false, message: "Not enough seats" };
    if (ride.owner.clerkId === userId) return { ok: false, message: "Cannot request own ride" };

    const user = await prisma.user.findUnique({ where: { clerkId: userId }, select: { id: true, name: true } });
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



    try {
        if (ride.owner.email) {
            const rideUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/requests`;
            await sendEmail({
                to: ride.owner.email,
                subject: "You Have a New ride request",
                html: await render(NewRequestOwnerEmail({
                    ownerName: ride.owner.name,
                    riderName: user.name || "",
                    seats: seats,
                    rideUrl,
                })),
            });

        }
    } catch (error) {
        console.error(error instanceof Error ? error.message : "Unknown error");
    }

    // Revalidate the ride details page and related pages
    revalidatePath(`/ride/${rideId}`);
    revalidatePath('/requests');
    revalidatePath('/rides');

    console.log('Request Sent Successfully', member.status)
    return { ok: true, message: "Request Sent Successfully" };
}
