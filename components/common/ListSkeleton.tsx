import { Skeleton } from "../ui/skeleton";

export function ListSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
                <div className="w-full space-y-2  p-4 bg-secondary rounded-md" key={i}>

                    <Skeleton className="h-4 " />
                    <Skeleton className="h-4 w-1/2 " />
                    <Skeleton className="h-4 w-1/4 " />
                    <div className="flex gap-4 w-full items-center">

                        <Skeleton className="h-16 w-16 rounded-full " />
                        <Skeleton className="h-4 w-1/2  " />
                    </div>
                    <div className="flex gap-4">
                        <Skeleton className="h-8 w-16  " />
                        <Skeleton className="h-8 w-24  " />



                    </div>
                </div>
            ))}
        </div>
    );
}
