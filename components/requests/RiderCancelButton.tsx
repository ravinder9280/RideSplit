// components/requests/RiderCancelButton.tsx
"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cancelMyRequest } from "@/actions/rides/cancel";

export default function CancelRequestButton({
    memberId,
    rideId,
}: {
    memberId: string;
    rideId: string;
}) {
    const [pending, start] = useTransition();
    const router = useRouter();

    return (
        <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
                start(async () => {
                    await cancelMyRequest(memberId);
                    router.refresh();
                })
            }
        >
            Cancel
        </Button>
    );
}
