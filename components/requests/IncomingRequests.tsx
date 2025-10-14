// components/requests/IncomingRequests.tsx
import { prisma } from "@/lib/prisma";
import {currentUser } from "@clerk/nextjs/server";
import AcceptDeclineButtons from "./OwnerAcceptDeclineButtons";
import Image from "next/image";
import Link from "next/link";
import RidePin from "../common/RidePin";
import UserCard from "../user-card";

export default async function IncomingRequests() {
    const user = await currentUser();
    const userId = user?.id
    if (!userId) return <div className="text-sm text-muted-foreground">Please sign in.</div>;

    // All pending requests across rides you own
    const rows = await prisma.rideMember.findMany({
        where: {
            status: "PENDING",
            ride: { owner: { clerkId: userId } },
        },
        select: {
            id: true,
            seatsRequested: true, 
            createdAt: true,
            ride: { select: { id: true, fromText: true, toText: true } },
            user: { select: { name: true, imageUrl: true, email: true ,id:true} },
        },
        orderBy: { createdAt: "desc" },
    });


    if (rows.length === 0) {
        return <div className="rounded-md border p-4 text-sm text-muted-foreground">No pending requests.</div>;
    }

    return (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg::grid-cols-3">
            {rows.map((m) => (
                <li key={m.id} className="rounded-md border p-3 flex flex-col gap-2 ">
                    <UserCard userName={m.user?.name || "user"} userEmail={m.user?.email || "email"} userId={m.user?.id} userImage={m.user.imageUrl||"userimage"} />    

                        <Link href={`/ride/${m.ride.id}`}>
                            <RidePin fromText={m.ride.fromText} toText={m.ride.toText} lineClampClass={"line-clamp-1"} />
                        
                        </Link>
                        
                    <div className="flex items-center gap-2 justify-between">
                        <div className="text-sm">
                            <span className="text-muted-foreground">Seats Requested: </span>
                            <span className="">{m.seatsRequested}x</span>
                        </div>
                    <AcceptDeclineButtons memberId={m.id}  />
                        </div>
                </li>
            ))}
        </ul>
    );
}
