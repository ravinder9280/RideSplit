import Image from "next/image";
import Link from "next/link";
import { Ride } from "@/lib/types/Ride";
import RidePin from "../common/RidePin";
import { Separator } from "../ui/separator";
import { Car } from "lucide-react";

export default function RideCard({ r }: { r: Ride }) {
    return (
        <Link href={`/ride/${r.id}`}
            className="rounded-xl hover:bg-card/70 bg-card/50 p-4 hover:shadow-md space-y-2  transition-shadow"
        >
            <div className="flex items-start h-32 justify-between">
                <div className="min-h-24">
                    <RidePin isLineClamp={true} fromText={ r.fromText} toText={r.toText} />
                    
                </div>
                <div className="flex flex-col items-center gap-1 justify-center">

                <span className='text-[10px] text-center text-nowrap text-muted-foreground'>Per Seat Price</span>
                <span className="rounded bg-primary/5 px-2 py-1 text-sm  text-primary font-medium">
                    ₹{r.perSeatPrice}
                </span>
                </div>
                
            </div>
            <Separator/>
            
            <div className="mt-3 text-muted-foreground flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                    <Car className="" height={ 20} width={20} />

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
                        <div className="flex flex-col  ">

                    <span className="">{r.owner?.name ?? "Owner"}</span>
                    <span className="text-sm">⭐ {r.owner?.rating ?? 5}</span>
                        </div>
                </div>
                </div>
                <div className="flex flex-col items-center text-[10px] text-muted-foreground justify-center">

                <p className=" ">
                    {r.service}
                </p>
                <p className=" ">
                        {new Date(r.departureAt).toLocaleString()}                 </p>
                </div>
            </div>
            
        </Link>
    );
}
