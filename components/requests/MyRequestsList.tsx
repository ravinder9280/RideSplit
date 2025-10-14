"use client";

import useSWR from "swr";
import Link from "next/link";
import CancelRequestButton from "./MyRequestCancelButton";
import RidePin from "../common/RidePin";
import { Badge } from "../ui/badge";
import { ListSkeleton } from "../common/ListSkeleton";

const fetcher = (url: string) => fetch(url).then(r => {
    if (!r.ok) throw new Error("failed To Load");
    
    return r.json();
});

export default function MyRequestsListClient({
    filter,
    fallback, // optional initial data from server (for fast first paint)
}: {
    filter: "ALL" | "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED";
    fallback?: any;
}) {
    const swrKey = `/api/requests/my-requests?filter=${filter}`;
    const { data, error, isLoading } = useSWR(swrKey, fetcher, {
        fallbackData: fallback, // enables SSR + hydrate
        revalidateOnFocus: true,
    });
    const rows = data?.rows ?? [];
   
    if (isLoading && !fallback) return <ListSkeleton />
    

    if (error) return <div className="text-sm text-red-600">{ error.message}</div>;
    if (rows.length === 0) {
        return <div className="rounded-md border p-4 text-sm text-muted-foreground">No requests.</div>;
    }

    const badgeVariant = (s: string) =>
        s === "PENDING" ? "amber-subtle" :
            s === "ACCEPTED" ? "green-subtle" :
                s === "DECLINED" ? "red-subtle" :
                    s === "CANCELLED" ? "gray-subtle" : "outline";

    return (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((m: any) => (
                <li key={m.id} className="rounded-md border flex flex-col gap-2 p-3">
                    <div>
                        <Badge variant={badgeVariant(m.status)||"pink"} size="sm">{m.status}</Badge>
                    </div>

                    <Link href={`/ride/${m.rideId}`} className="font-medium">
                        <RidePin
                            fromText={m.ride.fromText}
                            toText={m.ride.toText}
                            lineClampClass="line-clamp-1"
                        />
                    </Link>

                    <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                            Owner: {m.ride.owner?.name ?? "Owner"}
                        </div>

                        {(m.status === "PENDING" || m.status === "ACCEPTED") && (
                            <CancelRequestButton memberId={m.id} swrKey={swrKey} />
                        )}
                    </div>
                </li>
            ))}
        </ul>
    );
}
