// components/ride/MyRequestsList.tsx
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import CancelRequestButton from "./MyRequestCancelButton";
import RidePin from "../common/RidePin";
import { Badge } from "../ui/badge";

export default async function MyRequestsList({
    filter, // "ALL" | "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED"
}: {
    filter: "ALL" | "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED";
}) {
    const user = await currentUser();
    const userId = user?.id
    if (!userId) return <div className="text-sm text-muted-foreground">Please sign in.</div>;

    const me = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!me) return <div className="text-sm text-muted-foreground">Profile not found.</div>;

    const where: any = { userId: me.id };
    if (filter !== "ALL") where.status = filter;

    const rows = await prisma.rideMember.findMany({
        where,
        include: { ride: { include: { owner: true } } },
        orderBy: { createdAt: "desc" },
    });

    if (rows.length === 0) {
        return <div className="rounded-md border p-4 text-sm text-muted-foreground">No requests.</div>;
    }

    return (
        <ul className="space-y-3">
            {rows.map((m) => (
                <li key={m.id} className="rounded-md border p-3">
                    <div className="">
                        <div>
                            <Badge variant={m.status=="PENDING"?"amber-subtle":"red-subtle"}
                         size="sm" >{ m.status}</Badge>
                            <div className="font-medium">
                                <RidePin fromText={ m.ride.fromText} toText={m.ride.toText} isLineClamp />
                            </div>
                            
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                                Owner:{" "}
                                {m.ride.owner?.name ?? "Owner"}
                            </div>

                        {(m.status === "PENDING" || m.status === "ACCEPTED") ? (
                            <CancelRequestButton memberId={m.id}  />
                        ) : null}
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}
