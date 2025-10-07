"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import MapboxAutocomplete from "../location/autocomplete";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Search } from "lucide-react";
import LocationDialogInput from "../common/LocationDialogInput";

export default function RideSearchClient({ initialQuery }: { initialQuery: Record<string, any> }) {
    const router = useRouter();
    const sp = useSearchParams();
    const [pending, startTransition] = useTransition();

    // local state (or just read from hidden inputs for from/to)
    const [date, setDate] = useState<string>((sp.get("date") ?? "") as string);
    const [windowV, setWindowV] = useState<string>(sp.get("window") ?? "any");
    const [seats, setSeats] = useState<string>(sp.get("seats") ?? "1");

    // app/(rides)/ride-search-client.tsx   (your component)
    function submit() {
        const params = new URLSearchParams();

        // read hidden fields produced by your autocomplete
        const get = (n: string) =>
            (document.querySelector<HTMLInputElement>(`input[name="${n}"]`)?.value ?? "").trim();

        const fromText = get("fromText");
        const fromLat = get("fromLat");
        const fromLng = get("fromLng");
        const toText = get("toText");
        const toLat = get("toLat");
        const toLng = get("toLng");

        const setIf = (k: string, v?: string) => {
            if (v && v !== "") params.set(k, v);
        };

        setIf("fromText", fromText);
        setIf("fromLat", fromLat);
        setIf("fromLng", fromLng);
        setIf("toText", toText);
        setIf("toLat", toLat);
        setIf("toLng", toLng);

        if (date) params.set("date", date);
        params.set("window", windowV || "any");
        params.set("seats", seats || "1");
        params.set("page", "1");

        startTransition(() => {
            router.replace(`/rides?${params.toString()}`); // (use /rides page path)
        });
    }


    return (
        <div className="w-full flex-col gap-8 flex items-center justify-center">
            
            <div className="rounded-xl w-full lg:max-w-7xl  bg-secondary p-4">
                <div className="mb-4 space-y-1">

                    <h2 className="text-xl text-primary/80 font-semibold md:text-4xl">Find a Ride</h2>
                    <p className="text-sm md:text-base text-muted-foreground">Discover Rides All Over the World. </p>
                </div>

            <div className="grid gap-3 md:grid-cols-2">
                    <LocationDialogInput
                        namePrefix="from"
                        placeholder="Leaving From"
                    />              
                    <LocationDialogInput
                        namePrefix="from"
                        placeholder="Going To"
                    />                
            </div>

            <div className="mt-3 grid gap-3 grid-cols-2 md:grid-cols-3">
                <div className="col-span-3 md:col-span-1">
                    <Input type="date" className="text-muted-foreground" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>
                    
                <div>
                    <label className="block text-sm font-medium mb-1">Time window</label>
                    <Select  value={windowV} onValueChange={setWindowV}>
                        <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="any">Anytime</SelectItem>
                            <SelectItem value="morning">Morning</SelectItem>
                            <SelectItem value="afternoon">Afternoon</SelectItem>
                            <SelectItem value="evening">Evening</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Seats needed</label>
                    <Input type="number" min={1} max={8} value={seats} onChange={(e) => setSeats(e.target.value)} />
                </div>
            </div>

            <div  className="mt-4 flex items-center justify-end gap-3">
                    <Button className="md:w-1/2 md:max-w-[300px] " size={"lg"} onClick={submit} disabled={pending}>
                        <Search className="w-4 h-4" />
                        <span>
                        Search
                        </span>
                    </Button>
            </div>
        </div>
        </div>
    );
}
