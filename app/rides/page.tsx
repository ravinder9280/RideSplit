import RideSearchClient from "@/components/ride/ride-search-client";
import RideList from "@/components/ride/ride-list";
import { Suspense } from "react";

export default async function RidesPage({
    searchParams,
}: {
    searchParams: Record<string, string | string[] | undefined>;
}) {
    // pass-through; client will control URL updates
    return (
        <main className="min-h-screen p-6">
            <RideSearchClient initialQuery={searchParams} />
            <section className="mt-6">
                <Suspense fallback={<ListSkeleton />}>
                    {/* fetch on the server for SEO; key on search params to refetch */}
                    {/* Alternatively: fetch on client if you prefer */}
                    <RideList searchParams={searchParams} />
                </Suspense>
            </section>
        </main>
    );
}

function ListSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="h-36 animate-pulse rounded-xl bg-muted" />
            ))}
        </div>
    );
}
