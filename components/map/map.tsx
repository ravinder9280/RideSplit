'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader } from '../ui/card';
import Image from 'next/image';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { Phone } from 'lucide-react';

type Coord = { lng: number; lat: number };

type Props = {
    from?: Coord;
    to?: Coord;
    heightClass?: string;
    profileImage?: string;
    perSeatPrice?: string|number;
    startsAt?: string;
};

const ROUTE_SOURCE_ID = 'route';
const ROUTE_LAYER_ID = 'route-line';

export default function MapLine({ from = { lat: 28.410484, lng: 77.31821 }, to = { lat: 28.9, lng: 76.9 }, heightClass = 'h-96' ,profileImage,startsAt,perSeatPrice}: Props) {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const fromMarkerRef = useRef<mapboxgl.Marker | null>(null);
    const toMarkerRef = useRef<mapboxgl.Marker | null>(null);
    // state: keep numeric distance/duration
    const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);

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
        setRouteInfo({ distance: routeData.distance, duration: routeData.duration });        console.log(routeData)

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
            source.setData(data as any);
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
        routeData.geometry.coordinates.forEach((c: any) => bounds.extend(c));
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
    const calculateTime = (time:number):string => {
        if (!time) {
            return "";
    }
        const tim = Math.round(time / 60) 
        if (tim >= 60) {
            return ((tim/60).toFixed(0)+ " hr")
            
        }
        else {
            return (tim.toFixed(1)+ " min")
        }
        
    }

    return (
        <div className='space-y-4'>
           

        <div ref={mapContainerRef} className={`relative w-full ${heightClass}  overflow-hidden`} />

            <Card>
                <CardHeader>
                    Ride Details
                </CardHeader>
                <CardContent className='grid gap-4'>
                    <div className='flex justify-between'>
                        <div className='flex items-center gap-2'>
                            <div>
                                <Image height={20} width={20} className='w-10 rounded-full h-10' alt='' src={profileImage||''}/>
                            </div>
                            <div>
                                <h3 className='font-bold'>Ravinder</h3>
                                <span className='text-muted-foreground'>⭐ 4.8</span>

                            </div>

                        </div>
                        <div className='flex flex-col items-center justify-center'>
                            <span className='text-xs text-muted-foreground'>Per Seat Price</span>
                            <span className="rounded bg-primary/5 px-2 py-1 text-sm  text-primary font-medium">
                                ₹{perSeatPrice}
                            </span>
                            <span></span>
                        </div>

                    </div>
                    <Separator />
                    <div className='flex justify-between w-full items-center'>
                        <Button className='' size={"lg"}  variant={"outline"}> <Phone/> Contact</Button>
                        <Button className='' size={"lg"} >Request ride</Button>

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
                            <span>{startsAt }</span>

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
