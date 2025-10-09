"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

export function SeatSelector({ min = 1, max = 6 }: { min?: number; max?: number }) {
    const [seats, setSeats] = useState(min);

    const decrement = () => setSeats((prev) => Math.max(min, prev - 1));
    const increment = () => setSeats((prev) => Math.min(max, prev + 1));

    return (
        <div className="flex items-center  mx-auto gap-6">
            <Button className="h-16 w-16" size={"lg"} type="button" variant="outline" onClick={decrement} disabled={seats <= min}>
                <Minus/>
            </Button>
            <Input
                type="number"
                name="seatsRequested"
                value={seats}
                readOnly
                className="w-16 h-16 [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none bg-transparent text-2xl md:text-2xl outline-none focus-visible:ring-0 font-bold text-center"
            />
            <Button className="w-16 h-16" size={'lg'} type="button" variant="outline" onClick={increment} disabled={seats >= max}>
                <Plus/>
            </Button>
        </div>
    );
}
