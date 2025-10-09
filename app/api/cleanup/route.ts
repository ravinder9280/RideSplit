// app/api/cron/cleanup/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    // (Optional) header-based auth
    const secret = process.env.CRON_SECRET;
    if (secret && req.headers.get("x-vercel-cron-secret") !== secret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // 1) Mark past-departure active rides as completed
    await prisma.ride.updateMany({
        where: { status: "ACTIVE", departureAt: { lt: now } },
        data: { status: "COMPLETED" },
    });

    // 2) Cancel pending requests for rides that already departed
    await prisma.rideMember.updateMany({
        where: { status: "PENDING", ride: { departureAt: { lt: now } } },
        data: { status: "CANCELLED" },
    });

    return NextResponse.json({ ok: true, runAt: now.toISOString() });
}
