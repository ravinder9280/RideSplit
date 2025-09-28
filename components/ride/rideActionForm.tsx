"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { publishRide } from "@/actions/rides/actions";
import MapboxAutocomplete from "@/components/location/autocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PublishRideForm() {
    const [pending, startTransition] = useTransition();
    const [formKey, setFormKey] = useState(0);
    const formRef = useRef<HTMLFormElement>(null);

    const onAction = async (formData: FormData) => {
        const res = await publishRide(formData); // { ok, message, rideId }
        if (res?.ok) {
            toast.success("Ride published!");
            // If you want to stay on the page and reset:
            formRef.current?.reset();        // clears native inputs
            setFormKey((k) => k + 1);        // remounts children -> clears internal state
        } else {
            toast.error("Failed to publish ride.");
        }
    };

    return (
        <form
            key={formKey}
            ref={formRef}
            action={(fd) => startTransition(() => onAction(fd))}
            className="space-y-4 p-6"
            aria-busy={pending}
        >
            <MapboxAutocomplete label="Leaving From" namePrefix="from" limit={10} />
            <MapboxAutocomplete label="Going To" namePrefix="to" limit={10} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Date</label>
                    <Input type="date" name="departureDate" required />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Time</label>
                    <Input type="time" name="departureTime" required />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Seats</label>
                    <Input type="number" name="seatsTotal" min={1} max={8} required />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Estimated Fare (₹)</label>
                    <Input type="number" name="estTotalFare" min={1} required />
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-sm text-center font-medium mb-1">Vehicle Type</label>
                <div className="grid grid-cols-2">
                    <div className="flex items-center gap-2 justify-center">
                        <Input type="radio" className="h-5 w-5" id="uber" name="service" value="UBER" required />
                        <Label htmlFor="uber">UBER</Label>
                    </div>
                    <div className="flex items-center gap-2 justify-center">
                        <Input type="radio" className="h-5 w-5" id="ola" name="service" value="OLA" required />
                        <Label htmlFor="ola">OLA</Label>
                    </div>
                </div>
            </div>

            <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Publishing…" : "Publish Ride"}
            </Button>
        </form>
    );
}
