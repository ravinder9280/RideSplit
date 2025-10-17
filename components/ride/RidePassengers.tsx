import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type Props = { rideId: string };

export default async function RidePassengers({ rideId }: Props) {
    const members = await prisma.rideMember.findMany({
        where: { rideId,status:"ACCEPTED" },
        select: {
            id: true,
            status: true,
            seatsRequested: true,
            user: { select: { name: true, imageUrl: true, id: true } },
        },
        orderBy: { createdAt: "asc" },
    });

    if (members.length === 0) {
        return (
            <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                No passengers yet.
            </div>
        );
    }

    return (
        <div className="rounded-lg border overflow-y-auto">
            <div className="px-4 py-3 border-b font-medium">Passengers</div>
            <ul className="divide-y">
                {members.map((m) => (
                    <li key={m.id} className="flex items-center gap-2 px-4 py-3">
                        
                        <Avatar className="h-8 w-8 rounded-full hover:ring-1 hover:ring-primary" >
                        <Link href={`/user/${m.user?.id}`}>

                            <AvatarImage src={m.user?.imageUrl || undefined} />
                                <AvatarFallback>{m.user?.name?.[0] ?? "U"}</AvatarFallback>
                            </Link>
                            </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="truncate text-sm font-medium">{m.user?.name ?? "User"}</div>
                            <div className="text-xs text-muted-foreground">Seats: {m.seatsRequested}</div>
                        </div>
                        <Badge size="sm" variant={m.status === 'ACCEPTED' ? 'green-subtle' : m.status === 'PENDING' ? 'blue' : 'gray-subtle'}>
                            {m.status}
                        </Badge>
                    </li>
                ))}
            </ul>
        </div>
    );
}


