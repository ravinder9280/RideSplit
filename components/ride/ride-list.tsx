import { headers } from "next/headers";
import ClearFiltersButton from "../common/ClearFiltersButton";
import RideCard from "./ride-card";
import { Ride } from "@/lib/types/Ride";
import { Suspense } from "react";
import { ListSkeleton } from "../common/ListSkeleton";

async function RideListContent({
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

    const url = `${base}${qs.toString() ? `/api/rides/search?${qs}` : "/api/rides/search"}`;

    let items: Ride[] = [];
    let error: string | null = null;
    let hasFilters: boolean = false;

    try {
        const res = await fetch(url, {
            cache: "no-store",
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            error = errorData.message || `Search failed (${res.status})`;
            console.error('Search API error:', error);
        } else {
            const response = await res.json() as {
                ok: boolean;
                items?: Ride[];
                message?: string;
                total?: number;
            };

            if (response.ok) {
                items = response.items || [];
            } else {
                error = response.message || "Failed to fetch rides";
            }
        }
    } catch (fetchError) {
        error = "Network error. Please check your connection and try again.";
        console.error('Fetch error:', fetchError);
    }

    // Helper function to get search params
    const get = (k: string) => {
        const v = searchParams[k];
        return Array.isArray(v) ? v[0] : v;
    };

    // Determine if user applied any filters beyond defaults
    hasFilters =
        Boolean(
            get("fromLat") ||
            get("fromLng") ||
            get("toLat") ||
            get("toLng") ||
            get("fromText") ||
            get("toText") ||
            get("date") ||
            get("service") ||
            get("verifiedOnly") ||
            get("sort")
        ) ||
        Boolean(get("window") && get("window") !== "any") ||
        Boolean(get("seats") && get("seats") !== "1");

    // Handle error state
    if (error) {
        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h3 className="font-medium text-destructive">Search Error</h3>
                    {hasFilters && <ClearFiltersButton basePath="/rides" />}
                </div>
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
                    <p className="text-destructive font-medium mb-2">Unable to load rides</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                    {hasFilters && (
                        <p className="text-sm text-muted-foreground mt-2">
                            Try clearing your filters or check your search parameters.
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // Handle empty results
    if (items.length === 0) {
        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h3 className="font-medium">
                        {hasFilters ? "Search results" : "Available rides"}
                    </h3>
                    {hasFilters && <ClearFiltersButton basePath="/rides" />}
                </div>
                <div className="rounded-xl border p-8 text-center text-muted-foreground">
                    {hasFilters ? (
                        <>
                            <p className="font-medium mb-2">No rides match your search</p>
                            <p className="text-sm">
                                Try widening the time window, adjusting your location, or clearing some filters.
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="font-medium mb-2">No rides available right now</p>
                            <p className="text-sm">
                                Check back later or consider publishing your own ride.
                            </p>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // Render results
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h3 className="font-medium">
                    {hasFilters ? `Search results (${items.length})` : `Available rides (${items.length})`}
                </h3>
                {hasFilters && <ClearFiltersButton basePath="/rides" />}
            </div>
            <div className="grid gap-4 sm:gap-5 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
                {items.map((r: Ride, i: number) => (
                    <RideCard r={r} key={`${r.id}-${i}`} />
                ))}
            </div>
        </div>
    );
}

export default function RideList({
    searchParams,
}: {
    searchParams: Record<string, string | string[] | undefined>;
}) {
    return (
        <Suspense fallback={<ListSkeleton />}>
            <RideListContent searchParams={searchParams} />
        </Suspense>
    );
}
