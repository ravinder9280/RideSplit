export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';


const optionalNumber = z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number()
).optional();

const qSchema = z.object({
    fromLat: optionalNumber,
    fromLng: optionalNumber,
    toLat: optionalNumber,
    toLng: optionalNumber,
    date: z.string().optional(),
    window: z.enum(["any", "morning", "afternoon", "evening"]).default("any"),
    seats: z.coerce.number().int().min(1).default(1),
    service: z.enum(["UBER", "OLA"]).optional(),
    verifiedOnly: z.coerce.boolean().optional(),
    sort: z.enum(["time", "price", "distance"]).default("time"),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(10),
});


function windowBounds(date?: string, win?: 'any' | 'morning' | 'afternoon' | 'evening') {
    if (!date || win === 'any') return {};
    const base = new Date(`${date}T00:00:00Z`);
    const start = new Date(base);
    const end = new Date(base);
    if (win === 'morning') { start.setUTCHours(5); end.setUTCHours(11, 59, 59, 999); }
    if (win === 'afternoon') { start.setUTCHours(12); end.setUTCHours(16, 59, 59, 999); }
    if (win === 'evening') { start.setUTCHours(17); end.setUTCHours(22, 59, 59, 999); }
    return { start, end };
}

// simple bbox helper (km)
function bboxAround(lat: number, lng: number, km: number) {
    const dLat = km / 110.574;
    const dLng = km / (111.320 * Math.cos((lat * Math.PI) / 180));
    return { minLat: lat - dLat, maxLat: lat + dLat, minLng: lng - dLng, maxLng: lng + dLng };
}

export async function GET(req: NextRequest) {
    const parsed = qSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { fromLat, fromLng, toLat, toLng, date, window, seats, service, verifiedOnly, sort, page, pageSize } = parsed.data;

    const where: any = {
        status: 'ACTIVE',
        seatsAvailable: { gte: seats },
    };

    // time window
    const { start, end } = windowBounds(date, window);
    if (start && end) where.departureAt = { gte: start, lte: end };
    else if (date) { // whole day
        const d0 = new Date(`${date}T00:00:00Z`);
        const d1 = new Date(`${date}T23:59:59Z`);
        where.departureAt = { gte: d0, lte: d1 };
    }

    if (service) where.service = service;
    if (verifiedOnly) where.isVerified = true;

    // geo (coarse bbox: ~10km radius)
    const filters: any[] = [];
    if (fromLat != null && fromLng != null) {
        const b = bboxAround(fromLat, fromLng, 10);
        filters.push({ fromLat: { gte: b.minLat, lte: b.maxLat }, fromLng: { gte: b.minLng, lte: b.maxLng } });
    }
    if (toLat != null && toLng != null) {
        const b = bboxAround(toLat, toLng, 10);
        filters.push({ toLat: { gte: b.minLat, lte: b.maxLat }, toLng: { gte: b.minLng, lte: b.maxLng } });
    }
    if (filters.length) where.AND = filters;

    // sorting
    let orderBy: any = [{ departureAt: 'asc' }];
    if (sort === 'price') orderBy = [{ perSeatPrice: 'asc' }, { departureAt: 'asc' }];

    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
        prisma.ride.findMany({
            where, orderBy, skip, take: pageSize,
            include: { owner: { select: { name: true, imageUrl: true, rating: true } } },
        }),
        prisma.ride.count({ where }),
    ]);

    return NextResponse.json({
        items,
        total,
        page,
        pageSize,
        pages: Math.ceil(total / pageSize),
    });
}
