import Image from "next/image";
import { Button } from "../ui/button";
import Link from "next/link";
import { Ride } from "@/lib/types/Ride";

export default function RideCard({ r }: { r: Ride }) {
    return (
        <article
            className="rounded-xl  bg-card/50 p-4 hover:shadow-md transition-shadow"
        >
            <div className="flex items-start justify-between">
                <div className="min-h-24">
                    <h3 className="text-lg line-clamp-3  font-semibold">
                        {r.fromText} → {r.toText}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {new Date(r.departureAt).toLocaleString()} • {r.service}
                    </p>
                </div>
                <span className="rounded bg-primary/5 px-2 py-1 text-sm  text-primary font-medium">
                    ₹{r.perSeatPrice}
                </span>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                    <div className="size-8 overflow-hidden rounded-full bg-muted">
                        {r.owner?.imageUrl ? (
                            <Image
                                src={r.owner.imageUrl}
                                alt={r.owner?.name ?? "owner"}
                                width={32}
                                height={32}
                            />
                        ) : null}
                    </div>
                    <span>{r.owner?.name ?? "Owner"}</span>
                    <span className="text-muted-foreground">• ⭐ {r.owner?.rating ?? 5}</span>
                </div>
            </div>
            <div className="flex  items-center justify-between">

                <div className="mt-4 flex items-center justify-center gap-2">
                    <Button asChild>

                        <Link href={`/ride/${r.id}`} >
                            View
                        </Link>
                    </Button>
                    {/* <a
                            href={`/ride/${r.id}#request`}
                            className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"
                            >
                            Request seat
                        </a> */}
                    <Button variant={"outline"} asChild>
                        <Link
                            href={`/ride/${r.id}#request`}

                        >
                            Request Seat
                        </Link>
                    </Button>
                </div>
                <div className="text-muted-foreground text-sm">Seats left: {r.seatsAvailable}</div>

            </div>
        </article>
    );
}
