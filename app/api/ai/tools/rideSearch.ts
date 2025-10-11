import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { RideStatus, RideService } from "@prisma/client";

export const RideSearchInput = z.object({
    fromLat: z.number().optional(),
    fromLng: z.number().optional(),
    toLat: z.number().optional(),
    toLng: z.number().optional(),
    fromPlace: z.string().optional(),                 // "near me", "Gurgaon", "Delhi"
    toPlace: z.string().optional(),                   // "Noida", "Airport", "near office"
    date: z.string().optional(),                      // YYYY-MM-DD or "tomorrow", "today"
    window: z.enum(["any", "morning", "afternoon", "evening"]).default("any"),
    seats: z.number().int().min(1).max(8).default(1),
    service: z.enum(["UBER", "OLA", "OWNER"]).optional(),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(10).default(6)
});

export async function rideSearchTool(input: unknown) {
    const q = RideSearchInput.parse(input);

    // Build WHERE clause with proper typing
    const where: {
        status: RideStatus;
        seatsAvailable: { gte: number };
        departureAt?: { gte?: Date; lte?: Date };
        fromLat?: { gte?: number; lte?: number };
        fromLng?: { gte?: number; lte?: number };
        toLat?: { gte?: number; lte?: number };
        toLng?: { gte?: number; lte?: number };
        fromText?: { contains: string; mode: "insensitive" };
        toText?: { contains: string; mode: "insensitive" };
        service?: RideService;
    } = {
        status: RideStatus.ACTIVE,
        seatsAvailable: { gte: q.seats }
    };

    // Add service filtering if specified
    if (q.service) {
        where.service = q.service as RideService;
    }

    // Add time window filtering if date is provided
    if (q.date) {
        let targetDate: Date;

        if (q.date === "today") {
            targetDate = new Date();
        } else if (q.date === "tomorrow") {
            targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + 1);
        } else {
            targetDate = new Date(q.date);
        }

        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        where.departureAt = { gte: startOfDay, lte: endOfDay };
    }

    // Add location filtering - prioritize coordinates, fallback to text search
    if (q.fromLat && q.fromLng) {
        const radius = 0.01; // ~1km radius
        where.fromLat = { gte: q.fromLat - radius, lte: q.fromLat + radius };
        where.fromLng = { gte: q.fromLng - radius, lte: q.fromLng + radius };
    } else if (q.fromPlace) {
        where.fromText = { contains: q.fromPlace, mode: "insensitive" };
    }

    if (q.toLat && q.toLng) {
        const radius = 0.01; // ~1km radius
        where.toLat = { gte: q.toLat - radius, lte: q.toLat + radius };
        where.toLng = { gte: q.toLng - radius, lte: q.toLng + radius };
    } else if (q.toPlace) {
        where.toText = { contains: q.toPlace, mode: "insensitive" };
    }

    const items = await prisma.ride.findMany({
        where,
        orderBy: [{ departureAt: "asc" }],
        take: q.pageSize,
        include: { owner: { select: { name: true, imageUrl: true, rating: true } } },
    });

    return items.map(r => ({
        id: r.id,
        fromText: r.fromText,
        toText: r.toText,
        when: r.departureAt,
        service: r.service,
        perSeat: Math.round(r.perSeatPrice / 100),
        seatsLeft: r.seatsAvailable,
        owner: r.owner?.name ?? "Owner",
        perSeatPrice:r.perSeatPrice
    }));
}
