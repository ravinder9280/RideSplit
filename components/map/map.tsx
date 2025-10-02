'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

type Coord = { lng: number; lat: number };

type Props = {
    from?: Coord; // e.g. { lng: -122.486052, lat: 37.830348 }
    to?: Coord;   // e.g. { lng: -122.493782, lat: 37.833683 }
    heightClass?: string; // optional Tailwind height override
};

const ROUTE_SOURCE_ID = 'route';
const ROUTE_LAYER_ID = 'route-line';

export default function MapLine({ from = { lat: 28.410484, lng: 77.31821 }, to = { lat: 28.9, lng: 76.9 }, heightClass = 'h-96' }: Props) {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const fromMarkerRef = useRef<mapboxgl.Marker | null>(null);
    const toMarkerRef = useRef<mapboxgl.Marker | null>(null);

    // helper to (re)draw route + fit bounds
    const updateRoute = () => {
        if (!mapRef.current) return;

        const coords: [number, number][] = [
            [from.lng, from.lat],
            [to.lng, to.lat],
        ];

        // Add/update source data
        const source = mapRef.current.getSource(ROUTE_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
        const data = {
            type: 'Feature' as const,
            properties: {},
            geometry: { type: 'LineString' as const, coordinates: coords },
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
                paint: { 'line-color': '#2563eb', 'line-width': 5 }, // Tailwind blue-600
            });
        }

        // Add/update markers
        if (!fromMarkerRef.current) {
            fromMarkerRef.current = new mapboxgl.Marker({ color: '#16a34a' }) // green-600
                .setLngLat([from.lng, from.lat])
                .addTo(mapRef.current);
        } else {
            fromMarkerRef.current.setLngLat([from.lng, from.lat]);
        }

        if (!toMarkerRef.current) {
            toMarkerRef.current = new mapboxgl.Marker({ color: '#dc2626' }) // red-600
                .setLngLat([to.lng, to.lat])
                .addTo(mapRef.current);
        } else {
            toMarkerRef.current.setLngLat([to.lng, to.lat]);
        }

        // Fit map to the line
        const bounds = new mapboxgl.LngLatBounds();
        coords.forEach((c) => bounds.extend(c as [number, number]));
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
                style: 'mapbox://styles/mapbox/standard', // or 'mapbox://styles/mapbox/streets-v12'
                center: [from.lng, from.lat],
                zoom: 12,
            });

            mapRef.current.on('load', () => {
                updateRoute();
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
                updateRoute();
            } else {
                mapRef.current.once('load', updateRoute);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [from.lng, from.lat, to.lng, to.lat]);

    return (
        <div ref={ mapContainerRef } className={`relative w-full ${heightClass} rounded-xl overflow-hidden`} /> )}
