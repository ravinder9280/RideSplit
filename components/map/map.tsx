'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import Image from 'next/image';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { ArrowRight, Phone } from 'lucide-react';
import { useUser } from "@clerk/nextjs";
import { Badge } from '../ui/badge';
import { Dialog, DialogClose, DialogFooter, DialogHeader, DialogTrigger, DialogContent } from '../ui/dialog';
import { Label } from '../ui/label';
import RidePin from '../common/RidePin';
import { requestRide } from '@/actions/rides/request'; // <-- Server Action
import { SeatSelector } from '../ui/seat-stepper';
import { toast } from 'sonner';
import { Spinner } from '../ui/spinner';
import { useFormStatus } from 'react-dom';

type Coord = { lng: number; lat: number };

type Props = {
    from?: Coord;
    to?: Coord;
    heightClass?: string;
    profileImage?: string;
    perSeatPrice?: string | number;
    startsAt?: string; // ISO 8601 string
    status?: string;
    fromText?: string;
    toText?: string;
    owner?: {
        imageUrl?: string | null
        rating?: number | null,
        name?: string | null,
        id?: string | number,
        clerkId: string | number,
    }
    seatsAvailable: number
    rideId: string
};

const ROUTE_SOURCE_ID = 'route';
const ROUTE_LAYER_ID = 'route-line';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button disabled={pending} type="submit">
            {pending ? (
                <div className="flex items-center gap-2">
                    <Spinner />
                    Sending Request...
                </div>
            ) : (
                <span className="flex items-center gap-2">
                    Send Request <ArrowRight size={20} />
                </span>
            )}
        </Button>
    );
}

export default function MapLine({
    from = { lat: 28.410484, lng: 77.31821 },
    to = { lat: 28.9, lng: 76.9 },
    heightClass = 'h-96',
    owner,
    startsAt,
    status,
    perSeatPrice,
    fromText,
    toText,
    seatsAvailable,
    rideId
}: Props) {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const fromMarkerRef = useRef<mapboxgl.Marker | null>(null);
    const toMarkerRef = useRef<mapboxgl.Marker | null>(null);
    const closeRef = useRef<HTMLButtonElement>(null);

    const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
    const { user } = useUser();
    const [isExpired, setIsExpired] = useState(false);

    // Check expiry once on mount/when startsAt changes
    useEffect(() => {
        if (!startsAt) return;
        try {
            const startDate = new Date(startsAt);
            const now = new Date();
            setIsExpired(startDate < now);
        } catch (e) {
            console.error("Error parsing startsAt date:", e);
            setIsExpired(false);
        }
    }, [startsAt]);

    const fetchRouteAndDisplay = async () => {
        if (!mapRef.current) return;

        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!token) {
            console.error('Missing NEXT_PUBLIC_MAPBOX_TOKEN');
            return;
        }

        const query = await fetch(
            `https://api.mapbox.com/directions/v5/mapbox/driving/${from.lng},${from.lat};${to.lng},${to.lat}?geometries=geojson&access_token=${token}`,
            { method: 'GET' }
        );
        const json = await query.json();
        const routeData = json?.routes?.[0];
        if (!routeData) {
            console.error('No route found');
            return;
        }

        setRouteInfo({ distance: routeData.distance, duration: routeData.duration });

        // add/update source
        const source = mapRef.current.getSource(ROUTE_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
        const data = {
            type: 'Feature' as const,
            properties: {},
            geometry: routeData.geometry,
        };

        if (source) {
            source.setData(data);
        } else {
            mapRef.current.addSource(ROUTE_SOURCE_ID, { type: 'geojson', data });
            mapRef.current.addLayer({
                id: ROUTE_LAYER_ID,
                type: 'line',
                source: ROUTE_SOURCE_ID,
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': '#2563eb', 'line-width': 5 },
            });
        }

        // from marker
        if (!fromMarkerRef.current) {
            fromMarkerRef.current = new mapboxgl.Marker({ color: '#FDD518' })
                .setLngLat([from.lng, from.lat])
                .addTo(mapRef.current);
        } else {
            fromMarkerRef.current.setLngLat([from.lng, from.lat]);
        }

        // to marker
        if (!toMarkerRef.current) {
            const toEl = document.createElement('div');
            toEl.className = 'h-3 w-3 bg-white rounded-full border-2 shadow';
            toMarkerRef.current = new mapboxgl.Marker({ element: toEl })
                .setLngLat([to.lng, to.lat])
                .addTo(mapRef.current);
        } else {
            toMarkerRef.current.setLngLat([to.lng, to.lat]);
        }

        // fit bounds
        const bounds = new mapboxgl.LngLatBounds();
        routeData.geometry.coordinates.forEach((c: [number, number]) => bounds.extend(c));
        mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 600 });
    };

    // init map
    useEffect(() => {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!token) {
            console.error('Missing NEXT_PUBLIC_MAPBOX_TOKEN');
            return;
        }
        mapboxgl.accessToken = token;

        if (mapContainerRef.current && !mapRef.current) {
            mapRef.current = new mapboxgl.Map({
                container: mapContainerRef.current,
                style: 'mapbox://styles/mapbox/streets-v12',
                center: [from.lng, from.lat],
                zoom: 12,
            });

            mapRef.current.on('load', () => {
                fetchRouteAndDisplay();
            });
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // update when coords change
    useEffect(() => {
        if (!mapRef.current) return;
        if (
            Number.isFinite(from.lng) &&
            Number.isFinite(from.lat) &&
            Number.isFinite(to.lng) &&
            Number.isFinite(to.lat)
        ) {
            if (mapRef.current.isStyleLoaded()) {
                fetchRouteAndDisplay();
            } else {
                mapRef.current.once('load', fetchRouteAndDisplay);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [from.lng, from.lat, to.lng, to.lat]);

    const calculateTime = (time: number): string => {
        if (!time) return '';
        const minutes = Math.round(time / 60);
        if (minutes >= 60) {
            return `${(minutes / 60).toFixed(0)} hr`;
        }
        return `${minutes.toFixed(1)} min`;
    };

    const isRequestDisabled = isExpired || user?.id === owner?.clerkId || status !== "ACTIVE";

    /**
     * We keep the submit handler entirely on the server via `action={requestRide}`.
     * If you want a toast after success/failure, you can have the server action
     * return a flag and redirect back with a search param; then read it here and call `toast`.
     * For simplicity, this example keeps the action fire-and-forget.
     */
    async function clientAfterSubmit(formData: FormData) {
        // Optional: if you still want to run something **client-side before** the server action,
        // you can do it here and then call the server action manually.
        // But for canonical `useFormStatus`, prefer `action={requestRide}` directly.
        try {
            const res = await requestRide(formData);
            if (res.ok) {
                
                
                toast.success(res.message||'Request Sent Successfully');
            }
            else {
                toast.error(res.message||'Some Error Ocuured')
            }
            closeRef.current?.click();
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Failed to send request';
            toast.error(message);
        }
    }

    return (
        <div className="space-y-4">
            <div ref={mapContainerRef} className={`relative w-full ${heightClass} overflow-hidden`} />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <h2>Ride Details</h2>
                        <Badge variant={isExpired ? 'red-subtle' : 'green-subtle'}>
                            {isExpired ? 'Expired' : 'Active'}
                        </Badge>
                    </CardTitle>
                </CardHeader>

                <CardContent className="grid gap-4">
                    <div className="flex justify-between">
                        <div className="flex items-center gap-2">
                            <div>
                                <Image height={20} width={20} className="w-10 h-10 rounded-full" alt="" src={owner?.imageUrl || ''} />
                            </div>
                            <div>
                                <h3 className="font-bold">{owner?.name}</h3>
                                <span className="text-muted-foreground">⭐ {owner?.rating}</span>
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center">
                            <span className="text-xs text-muted-foreground">Per Seat Price</span>
                            <span className="rounded bg-primary/5 px-2 py-1 text-sm text-primary font-medium">
                                ₹{perSeatPrice}
                            </span>
                        </div>
                    </div>
                    <div>
                        <Badge size="sm" variant="blue">Seats Available : {seatsAvailable}</Badge>
                    </div>

                    <Separator />

                    <div className="flex justify-between w-full items-center">
                        <Button size="lg" variant="outline">
                            <Phone /> Contact
                        </Button>

                        <div>
                            <Dialog  >
                                <DialogTrigger asChild>
                                    <Button disabled={isRequestDisabled} size="lg">
                                        Request ride <ArrowRight size={20} />
                                    </Button>
                                </DialogTrigger>

                                {/* forceMount keeps the subtree mounted so pending UI is stable */}
                                <DialogContent showCloseButton={false} forceMount  className="sm:max-w-[425px] z-[1000]">
                                    <DialogHeader>
                                        <div className="flex justify-between">
                                            <div className="flex items-center gap-2">
                                                <div>
                                                    <Image height={20} width={20} className="w-10 h-10 rounded-full" alt="" src={owner?.imageUrl || ''} />
                                                </div>
                                                <div className="flex flex-col items-start">
                                                    <h3 className="font-bold">{owner?.name}</h3>
                                                    <span className="text-muted-foreground text-xs">⭐ {owner?.rating}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-center justify-center">
                                                <span className="text-xs text-muted-foreground">Per Seat Price</span>
                                                <span className="rounded bg-primary/5 px-2 py-1 text-sm text-primary font-medium">
                                                    ₹{perSeatPrice}
                                                </span>
                                            </div>
                                        </div>
                                    </DialogHeader>

                                    {/* ---- SERVER ACTION FORM ---- */}
                                    <form
                                        action={async (formData) => {
                                            // If you want purely server-side, use: action={requestRide}
                                            // Here we call a small client helper that delegates to the server action
                                            // so we can still show toasts after completion.
                                            await clientAfterSubmit(formData);
                                        }}
                                    >
                                        <div className="grid gap-4">
                                            <div>
                                                <Badge size="sm" variant="teal-subtle">Seats Available : {seatsAvailable}</Badge>
                                            </div>

                                            <RidePin lineClampClass="line-clamp-1" fromText={fromText || 'Location'} toText={toText || 'Location'} />

                                            <div className="grid mt-4 gap-3">
                                                <input type="hidden" name="rideId" value={String(rideId)} />
                                                <Label className="text-sm text-muted-foreground" htmlFor="seats">Number Of Seats</Label>
                                                {/* Ensure SeatSelector posts a value (e.g., name="seats") */}
                                                <SeatSelector min={1} max={seatsAvailable} />
                                            </div>
                                        </div>

                                        <DialogFooter className="mt-4">
                                            <DialogClose asChild>
                                                <Button ref={closeRef} type="button" variant="outline">Cancel</Button>
                                            </DialogClose>

                                            {/* Pending-aware submit button */}
                                            <SubmitButton />
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between gap-2">
                        <div className="text-center flex flex-col items-center justify-center">
                            <span className="text-sm text-muted-foreground">Distance</span>
                            <span>{routeInfo ? `${(routeInfo.distance / 1000).toFixed(1)} km` : '—'}</span>
                        </div>

                        <div className="text-center flex flex-col items-center justify-center">
                            <span className="text-sm text-muted-foreground">Starts At</span>
                            <span>{startsAt}</span>
                        </div>

                        <div className="text-center flex flex-col items-center justify-center">
                            <span className="text-sm text-muted-foreground">Duration</span>
                            <span>{routeInfo ? calculateTime(routeInfo.duration) : '—'}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
