import { headers } from "next/headers";
import ClearFiltersButton from "../common/ClearFiltersButton";
import RideCard from "./ride-card";
import { Ride } from "@/lib/types/Ride";

export default async function RideList({
    searchParams,
}: {
    searchParams: Record<string, string | string[] | undefined>;
}) {
    const qs = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined) {
            qs.set(key, Array.isArray(value) ? value[0] : value);
        }
    });

    // Build absolute base URL from request headers (supports local + Vercel)
    const h = headers();
    const host =
        h.get("x-forwarded-host") ?? // Vercel/Proxies
        h.get("host") ?? "localhost:3000";
    const proto = h.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "development" ? "http" : "https");
    const base = `${proto}://${host}`;

    const url = `${base}${qs ? `/api/rides/search?${qs}` : "/api/rides/search"}`;

    const res = await fetch(url, {
        cache: "no-store",
        // next: { revalidate: 0 } // optional, same effect as no-store
    });

    if (!res.ok) {
        // helpful error for debugging
        const text = await res.text().catch(() => "");
        throw new Error(`Search API ${res.status}: ${text || url}`);
    }

    const response = await res.json() as { items?: Ride[] };
    const items = response.items || [];

    // if (!items.length) {
    //     return (
    //         <div className="rounded-xl border p-8 text-center text-muted-foreground">
    //             No rides match your search. Try widening the time window or clearing filters.
    //         </div>
    //     );
    // }
    const get = (k: string) => {
        const v = searchParams[k];
        return Array.isArray(v) ? v[0] : v;
    };

    // Decide if user applied *any* filters beyond defaults
    const hasFilters =
        !!(
            get("fromLat") ||
            get("fromLng") ||
            get("toLat") ||
            get("toLng") ||
            get("date") ||
            get("service") ||
            get("verifiedOnly")
        ) ||
        (get("window") && get("window") !== "any") ||
        (get("seats") && get("seats") !== "1");



    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                {

                    
                    <h3 className="font-medium">
                        {hasFilters ? "Search results" : "Suggestions"}
                    </h3>}
                {hasFilters && <ClearFiltersButton basePath="/rides" />}
            </div>
            {items.length&&items.length?

                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((r: Ride,i:number) => (
                <RideCard r={r} key={i}/>
            ))}
        </div>:            <div className="rounded-xl border p-8 text-center text-muted-foreground">
                No rides match your search. Try widening the time window or clearing filters.
            </div>
        }
            </div>
    );
}
