// components/requests/IncomingRequests.tsx
import { prisma } from "@/lib/prisma";
import {currentUser } from "@clerk/nextjs/server";
import AcceptDeclineButtons from "./OwnerAcceptDeclineButtons";
import Image from "next/image";
import Link from "next/link";
import RidePin from "../common/RidePin";

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
        include: {
            ride: { select:{id:true,fromText:true,toText:true}},
            user: { select: { name: true, imageUrl: true ,email:true} },
        },
        orderBy: { createdAt: "desc" },
    });

    if (rows.length === 0) {
        return <div className="rounded-md border p-4 text-sm text-muted-foreground">No pending requests.</div>;
    }

    return (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg::grid-cols-3">
            {rows.map((m) => (
                <li key={m.id} className="rounded-md border p-3 space-y-2 ">
                    <div className="space-y-2">
                        <div className='flex items-center gap-2'>
                            <div>
                                <Image height={20} width={20} className='w-10 rounded-full h-10' alt='' src={m.user.imageUrl || ''} />
                            </div>
                            <div className='flex items-start flex-col'>
                                <h3 className='font-bold'>{m.user.name}</h3>
                                <span className='text-muted-foreground text-start text-xs'>{m.user.email}</span>

                            </div>

                        </div>
                        

                        <Link href={`/ride/${m.rideId}`}>
                            <RidePin fromText={m.ride.fromText} toText={m.ride.toText} lineClampClass={"line-clamp-1"} />
                        
                        </Link>
                        
                    </div>
                        <div className="flex items-center justify-end">

                    <AcceptDeclineButtons memberId={m.id}  />
                        </div>
                </li>
            ))}
        </ul>
    );
}
