"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cancelMyRequest } from "@/actions/rides/cancel";
import { Spinner } from "../ui/spinner";
import { useSWRConfig } from "swr";

type RideMemberRow = {
    id: string;
    status: "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED";
};

type MyRequestsData = {
    rows: RideMemberRow[];
    message?: string;
};

export default function CancelRequestButton({
    memberId,
    swrKey,
}: {
    memberId: string;
    swrKey: string; // `/api/my-requests?filter=...`
}) {
    const [pending, start] = useTransition();
    const { mutate } = useSWRConfig();

    return (
        <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
                start(async () => {
                    // Optimistic remove
                    await mutate<MyRequestsData>(
                        swrKey,
                        async (current) => {
                    // perform server-side cancel first (or after optimistic diff if you prefer)
                            await cancelMyRequest(memberId);
                            if (!current) return current;
                            return {
                                ...current,
                                rows: current.rows.map((r): RideMemberRow =>
                                    r.id === memberId ? { ...r, status: "CANCELLED" } : r
                                ),
                            };
                        },
                        { revalidate: true, rollbackOnError: true }
                    );
                })
            }
        >
            {pending ? (
                <>
                    <Spinner />
                    <span>Cancelling</span>
                </>
            ) : (
                <span>Cancel</span>
            )}
        </Button>
    );
}
