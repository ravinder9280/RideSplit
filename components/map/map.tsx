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
import { Dialog, DialogClose, DialogFooter, DialogHeader,  DialogTrigger,DialogContent } from '../ui/dialog';
import { Label } from '../ui/label';
import RidePin from '../common/RidePin';
import { requestRide } from '@/actions/rides/request';
import { SeatSelector } from '../ui/seat-stepper';
import { toast } from 'sonner';
import { Spinner } from '../ui/spinner';

type Coord = { lng: number; lat: number };

type Props = {
    from?: Coord;
    to?: Coord;
    heightClass?: string;
    profileImage?: string;
    perSeatPrice?: string | number;
    startsAt?: string; // Expecting an ISO 8601 string or similar date/time format
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
    rideId:string
};

const ROUTE_SOURCE_ID = 'route';
const ROUTE_LAYER_ID = 'route-line';

export default function MapLine({ from = { lat: 28.410484, lng: 77.31821 }, to = { lat: 28.9, lng: 76.9 }, heightClass = 'h-96', owner, startsAt, status, perSeatPrice ,fromText,toText,seatsAvailable,rideId}: Props) {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const fromMarkerRef = useRef<mapboxgl.Marker | null>(null);
    const toMarkerRef = useRef<mapboxgl.Marker | null>(null);
    const [loading, setLoading] = useState(false)
    // state: keep numeric distance/duration
    const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);
    const { user } = useUser();

    // 1. New state to track if the ride has expired
    const [isExpired, setIsExpired] = useState(false);

    // 2. Function to check if the ride has expired
    const checkRideExpiration = (startTime: string | undefined) => {
        if (!startTime) return;
        try {
            const startDate = new Date(startTime);
            const now = new Date();
            // Compare the start time with the current time
            setIsExpired(startDate < now);
        } catch (e) {
            console.error("Error parsing startsAt date:", e);
            setIsExpired(false); // Default to not expired on error
        }
    };

    // 3. Effect to check expiration when startsAt changes
    useEffect(() => {
        checkRideExpiration(startsAt);
        // Optional: Set up an interval to re-check if the ride is starting soon, 
        // but for a map component, a check on load/update is usually sufficient.
    }, [startsAt]);

console.log(rideId)
    // Function to fetch the route from the Directions API
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
        const routeData = json.routes[0];
        setRouteInfo({ distance: routeData.distance, duration: routeData.duration }); console.log(routeData)

        if (!routeData) {
            console.error('No route found');
            return;
        }

        // The route's geometry
        const routeGeometry = routeData.geometry;

        // Add/update source data
        const source = mapRef.current.getSource(ROUTE_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
        const data = {
            type: 'Feature' as const,
            properties: {},
            geometry: routeGeometry,
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


        if (!fromMarkerRef.current) {
            fromMarkerRef.current = new mapboxgl.Marker({ color: '#FDD518' })
                .setLngLat([from.lng, from.lat])
                .addTo(mapRef.current);
        } else {
            fromMarkerRef.current.setLngLat([from.lng, from.lat]);
        }

        if (!toMarkerRef.current) {
            const toEl = document.createElement('div');
            toEl.className = 'h-3 w-3 bg-white rounded-full border-2 shadow';
            toMarkerRef.current = new mapboxgl.Marker({ element: toEl })
                .setLngLat([to.lng, to.lat])
                .addTo(mapRef.current);
        } else {
            toMarkerRef.current.setLngLat([to.lng, to.lat]);
        }


        // Fit map to the route's bounds
        const bounds = new mapboxgl.LngLatBounds();
        routeData.geometry.coordinates.forEach((c: [number, number]) => bounds.extend(c));
        mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 600 });
    };

    // init map once
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
                style: 'mapbox://styles/mapbox/streets-v12', // changed to a standard style
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
    async function requestRideWrapper(formData: FormData) {
        try {

            setLoading(true)
            const result = await requestRide(formData);
            console.log(result);
            if (result.ok) {
                toast.success("Request Sent Successfully")
            }
            else {
                toast.error(result.message || "Failed to send request")
            }
        }
        catch (e) {
            const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred";
            toast.error(errorMessage);
        }
        finally {
            setLoading(false)
        }
    }

    // update when props change
    useEffect(() => {
        if (!mapRef.current) return;
        if (Number.isFinite(from.lng) && Number.isFinite(from.lat) && Number.isFinite(to.lng) && Number.isFinite(to.lat)) {
            if (mapRef.current.isStyleLoaded()) {
                fetchRouteAndDisplay();
            } else {
                mapRef.current.once('load', fetchRouteAndDisplay);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [from.lng, from.lat, to.lng, to.lat]);

    const calculateTime = (time: number): string => {
        if (!time) {
            return "";
        }
        const tim = Math.round(time / 60)
        if (tim >= 60) {
            return ((tim / 60).toFixed(0) + " hr")

        }
        else {
            return (tim.toFixed(1) + " min")
        }

    }

    // Determine if the request button should be disabled
    const isRequestDisabled = isExpired || user?.id === owner?.clerkId || status !== "ACTIVE";

    return (
        <div className='space-y-4'>


            <div ref={mapContainerRef} className={`relative w-full ${heightClass}  overflow-hidden`} />

            <Card>
                <CardHeader >
                    <CardTitle className='flex items-center justify-between' >
                        <h2>Ride Details</h2>
                        <Badge variant={isExpired?"red-subtle":"green-subtle"} >{ isExpired?"Expired":"Active"}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className='grid gap-4'>
                    <div className='flex justify-between'>
                        <div className='flex items-center gap-2'>
                            <div>
                                <Image height={20} width={20} className='w-10 rounded-full h-10' alt='' src={owner?.imageUrl || ''} />
                            </div>
                            <div>
                                <h3 className='font-bold'>{owner?.name}</h3>
                                <span className='text-muted-foreground'>⭐ {owner?.rating}</span>

                            </div>

                        </div>
                        <div className='flex flex-col items-center justify-center'>
                            <span className='text-xs text-muted-foreground'>Per Seat Price</span>
                            <span className="rounded bg-primary/5 px-2 py-1 text-sm  text-primary font-medium">
                                ₹{perSeatPrice}
                            </span>
                            
                        </div>

                    </div>
                    <Separator />
                    <div className='flex justify-between w-full items-center'>
                        <Button className='' size={"lg"} variant={"outline"}> <Phone /> Contact</Button>
                        {/* 5. Update disabled prop with isRequestDisabled */}
                        <div>
                            
                            <Dialog>
                                
                            <DialogTrigger>


                        <Button disabled={isRequestDisabled} className=''  size={"lg"} >
                            Request ride <ArrowRight size={40}  />
                        </Button>
                            </DialogTrigger>
                            

                                <DialogContent showCloseButton={false} className="sm:max-w-[425px]">
                                        <DialogHeader>
                                            <div className='flex justify-between'>
                                                <div className='flex items-center gap-2'>
                                                    <div>
                                                        <Image height={20} width={20} className='w-10 rounded-full h-10' alt='' src={owner?.imageUrl || ''} />
                                                    </div>
                                                    <div className='flex items-start flex-col'>
                                                        <h3 className='font-bold'>{owner?.name}</h3>
                                                        <span className='text-muted-foreground text-start text-xs'>⭐ {owner?.rating}</span>

                                                    </div>

                                                </div>
                                                <div className='flex flex-col items-center justify-center'>
                                                    <span className='text-xs text-muted-foreground'>Per Seat Price</span>
                                                    <span className="rounded bg-primary/5 px-2 py-1 text-sm  text-primary font-medium">
                                                        ₹{perSeatPrice}
                                                    </span>

                                                </div>

                                            </div>
                                    </DialogHeader>
                                    <form action={requestRideWrapper}>

                                    <div className="grid gap-4">
                                        <div>
                                            <Badge size='sm' variant='teal-subtle'>Seats Avialable : {seatsAvailable} </Badge>
                                        </div>
                                            <RidePin lineClampClass={"line-clamp-1"} fromText={fromText||'Location'} toText={toText||'Location'} />
                                       
                                        <div  className="grid mt-4 gap-3">
                                            <input type="hidden" name="rideId" value={String(rideId)} />
                                            <Label className='text-sm text-muted-foreground' htmlFor="username-1">Number Of Seats</Label>
                                            <SeatSelector min={1} max={seatsAvailable} />
                                                                                </div >
                                        </div>
                                        
                                    <DialogFooter className='mt-4 '>
                                        <DialogClose asChild>
                                            <Button variant="outline">Cancel</Button>
                                            </DialogClose>
                                            
                                            <Button disabled={loading} type="submit">
                                                {loading ? (
                                                    <span className="flex items-center gap-2">
                                                        <Spinner />
                                                        Sending Request...
                                                    </span>
                                                ) : (
                                                    <span>Request Ride</span>
                                                )}
                                            </Button>
                                    </DialogFooter>
                                    </form>
                                </DialogContent>
                            
                        </Dialog>
        </div>

                    </div>
                    <Separator />
                    <div className='flex items-center justify-between gap-2'>
                        <div className='text-center flex flex-col items-center justify-center'>
                            <span className='text-sm text-muted-foreground'>Distance</span>
                            <span>                {routeInfo ? `${(routeInfo.distance / 1000).toFixed(1)} km` : '—'}
                            </span>

                        </div>
                        <div className='text-center flex flex-col items-center justify-center'>
                            <span className='text-sm text-muted-foreground'>Starts At</span>
                            <span>{startsAt}</span>

                        </div>
                        <div className='text-center flex flex-col items-center justify-center'>
                            <span className='text-sm text-muted-foreground'>Duration</span>
                            <span>                {routeInfo ? calculateTime(routeInfo.duration) : '—'}
                            </span>

                        </div>

                    </div>
                </CardContent>
            </Card>
        </div>
    );
}