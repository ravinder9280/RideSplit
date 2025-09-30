import Image from "next/image";
import { headers } from "next/headers";
import ClearFiltersButton from "../common/ClearFiltersButton";

export default async function RideList({
    searchParams,
}: {
    searchParams: Record<string, string | string[] | undefined>;
}) {
    const qs = new URLSearchParams(searchParams as any).toString();

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

    const { items = [], total = 0 } = (await res.json()) as any;

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
            {items.map((r: any) => (
                <article
                    key={r.id}
                    className="rounded-xl  bg-card/50 p-4 hover:shadow-md transition-shadow"
                >
                    <div className="flex items-start justify-between">
                        <div className="min-h-24">
                            <h3 className="text-lg line-clamp-3  font-semibold">
                                {r.fromText} → {r.toText}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {new Date(r.departureAt).toLocaleString()} • {r.service}
                            </p>
                        </div>
                        <span className="rounded bg-primary/5 px-2 py-1 text-sm  text-primary font-medium">
                            ₹{Math.round(r.perSeatPrice / 100)}
                        </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <div className="size-8 overflow-hidden rounded-full bg-muted">
                                {r.owner?.imageUrl ? (
                                    <Image
                                        src={r.owner.imageUrl}
                                        alt={r.owner?.name ?? "owner"}
                                        width={32}
                                        height={32}
                                        />
                                    ) : null}
                            </div>
                            <span>{r.owner?.name ?? "Owner"}</span>
                            <span className="text-muted-foreground">• ⭐ {r.owner?.rating ?? 5}</span>
                        </div>
                    </div>
                    <div className="flex  items-center justify-between">
                        
                    <div className="mt-4 flex items-center justify-center gap-2">
                        <a href={`/ride/${r.id}`} className="rounded-md border px-3 py-1.5 text-sm">
                            View
                        </a>
                        <a
                            href={`/ride/${r.id}#request`}
                            className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"
                            >
                            Request seat
                        </a>
                        </div>
                        <div className="text-muted-foreground text-sm">Seats left: {r.seatsAvailable}</div>

                                </div>
                </article>
            ))}
        </div>:            <div className="rounded-xl border p-8 text-center text-muted-foreground">
                No rides match your search. Try widening the time window or clearing filters.
            </div>
        }
            </div>
    );
}
