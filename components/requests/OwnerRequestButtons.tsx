"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { acceptRequest, declineRequest } from "@/actions/rides/owner";
import { useRouter } from "next/navigation";

export default function AcceptDeclineButtons({ memberId}: { memberId: string;}) {
    const [pending, start] = useTransition();
    const router = useRouter();

    return (
        <div className="flex gap-2">
            <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                    start(async () => {
                        await acceptRequest(memberId);
                        router.refresh();
                    })
                }
            >
                Accept
            </Button>
            <Button
                size="sm"
                variant="destructive"
                disabled={pending}
                onClick={() =>
                    start(async () => {
                        await declineRequest(memberId);
                        router.refresh();
                    })
                }
            >
                Decline
            </Button>
        </div>
    );
}
