import RideSearchClient from "@/components/ride/ride-search-client";
import RideList from "@/components/ride/ride-list";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default async function RidesPage({
    searchParams,
}: {
    searchParams: Record<string, string | string[] | undefined>;
}) {
    // pass-through; client will control URL updates
    return (
        <main className="min-h-screen py-4 md:p-0 ">
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
                <div className="w-full space-y-2  p-4 bg-secondary rounded-md" key={i}>

                    <Skeleton className="h-4 " />
                    <Skeleton className="h-4 w-1/2 " />
                    <Skeleton className="h-4 w-1/4 " />
                    <div className="flex gap-4 w-full items-center">

                    <Skeleton  className="h-16 w-16 rounded-full " />
                    <Skeleton className="h-4 w-1/2  " />
                    </div>
                    <div className="flex gap-4">
                        <Skeleton className="h-8 w-16  " />
                        <Skeleton className="h-8 w-24  " />



                    </div>
                </div>
            ))}
        </div>
    );
}
