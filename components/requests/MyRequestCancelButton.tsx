"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cancelMyRequest } from "@/actions/rides/cancel";
import { useRouter } from "next/navigation";

export default function CancelRequestButton({ memberId}: { memberId: string; }) {
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
