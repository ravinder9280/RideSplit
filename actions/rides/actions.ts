// app/(rides)/publish/actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { rideSchema } from "@/lib/validations/ride";
import { revalidatePath } from "next/cache";

export async function publishRide(formData: FormData) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const values = Object.fromEntries(formData.entries());
    const parsed = rideSchema.safeParse(values);
    if (!parsed.success) {
        return { ok: false, errors: parsed.error.flatten().fieldErrors };
    }

    const {
        fromText, fromLat, fromLng,
        toText, toLat, toLng,
        departureDate, departureTime,
        seatsTotal, estTotalFare, service
    } = parsed.data;

    const departureAt = new Date(`${departureDate}T${departureTime}`);
try {
    
    await prisma.ride.create({
        data: {
            owner: { connect: { clerkId: userId } },
            fromText, toText,
            fromLat, fromLng, toLat, toLng,
            departureAt,
            seatsTotal,
            seatsAvailable: seatsTotal,
            estTotalFare,
            perSeatPrice: Math.floor(estTotalFare / seatsTotal),
            service,
        },
    });
    revalidatePath("/rides");
    return { ok: true };
} catch (error: any) {
    return {
        ok: false,
        message:error.message
    }

    
}

}
