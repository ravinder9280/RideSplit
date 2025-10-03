'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

type Coord = { lng: number; lat: number };

type Props = {
    from?: Coord;
    to?: Coord;
    heightClass?: string;
};

const ROUTE_SOURCE_ID = 'route';
const ROUTE_LAYER_ID = 'route-line';

export default function MapLine({ from = { lat: 28.410484, lng: 77.31821 }, to = { lat: 28.9, lng: 76.9 }, heightClass = 'h-96' }: Props) {
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
            return ((tim/60).toFixed(1)+ " hr")
            
        }
        else {
            return (tim.toFixed(1)+ " min")
        }
        
    }

    return (
        <div className='mx-auto max-w-5xl'>
           

        <div ref={mapContainerRef} className={`relative w-full ${heightClass} rounded-xl overflow-hidden`} />
            <h1>
                Distance:&nbsp;
                {routeInfo ? `${(routeInfo.distance / 1000).toFixed(1)} km` : '—'}
            </h1>
            <p>
                ETA:&nbsp;
                {routeInfo ? calculateTime(routeInfo.duration) : '—'}
            </p>
        </div>
    );
}
