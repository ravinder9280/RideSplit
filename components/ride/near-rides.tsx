import { headers } from "next/headers";
import RideCard from "./ride-card";
import { Button } from "@/components/ui/button";
import { Ride } from "@/lib/types/Ride";

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
    const h = headers();
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
    const proto = h.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "development" ? "http" : "https");
    const base = `${proto}://${host}`;

    const qs = new URLSearchParams({
        fromLat: String(lat),
        fromLng: String(lng),
        radiusKm: String(radiusKm),
        pageSize: String(pageSize),
        sort: "time",
    });

    const res = await fetch(`${base}/api/rides/search?${qs.toString()}`, { cache: "no-store" });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Nearby fetch ${res.status}: ${text}`);
    }
    const { items = [] } = await res.json();

    if (items.length === 0) return null;


    return (
        <section className="space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Nearby Rides</h2>
                {
                    items.length>pageSize?
                    <Button variant="ghost">See all</Button>:null
                }
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.map((r: Ride) => <RideCard key={r.id} r={r} />)}
            </div>
        </section>
    );
}
