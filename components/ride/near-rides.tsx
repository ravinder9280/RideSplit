// app/(home)/near-rides.tsx
import { headers } from "next/headers";

import NearRidesClient from "./near-rides-client";

export default async function NearRides({
    lat,
    lng,
    radiusKm = 10,
    pageSize = 6,
}: {
    lat: number;
    lng: number;
    radiusKm?: number;
    pageSize?: number;
}) {
    try {
        const h = headers();
        const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
        const proto =
            h.get("x-forwarded-proto") ??
            (process.env.NODE_ENV === "development" ? "http" : "https");
        const base = `${proto}://${host}`;

        const qs = new URLSearchParams({
            fromLat: String(lat),
            fromLng: String(lng),
            radiusKm: String(radiusKm),
            pageSize: String(pageSize),
            sort: "time",
        });

        const res = await fetch(`${base}/api/rides/search?${qs}`, {
            cache: "no-store",
        });

        if (!res.ok) {
            const text = await res.text().catch(() => "");
            return <NearRidesClient error={`Nearby fetch ${res.status}: ${text}`} />;
        }

        const { items = [] } = await res.json();
        if (items.length === 0) return null;

        return (
            <NearRidesClient rides={items} pageSize={pageSize} />
        );
    } catch (e: any) {
        return <NearRidesClient error={e.message ?? "Failed to load rides"} />;
    }
}
