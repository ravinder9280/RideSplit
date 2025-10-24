import RideSearchClient from "@/components/ride/ride-search-client";
import RideList from "@/components/ride/ride-list";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/common/ListSkeleton";
export default async function RidesPage({
    searchParams,
}: {
    searchParams: Record<string, string | string[] | undefined>;
}) {
    // pass-through; client will control URL updates
    return (
        <main className="min-h-screen py-4 max-w-[1400px] mx-auto md:p-0 ">
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

