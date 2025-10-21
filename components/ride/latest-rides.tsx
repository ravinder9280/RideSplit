import React from 'react'
import { Button } from '../ui/button';
import { Ride } from '@/lib/types/Ride';
import RideCard from './ride-card';
import { headers } from 'next/headers';
import Link from 'next/link';
const pageSize=6
const LatestRides = async () => {
    const h = headers();
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
    const proto = h.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "development" ? "http" : "https");
    const base = `${proto}://${host}`;

    const res = await fetch(`${base}/api/rides/search?pageSize=${pageSize} `);
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Nearby fetch ${res.status}: ${text}`);
    }
    const { items = [] } = await res.json();

    if (items.length === 0) return null;

  return (
      <section className="space-y-3">
          <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Latest Rides</h2>
              
                      <Button variant="ghost">
                          <Link className='text-muted-foreground' href={'/rides'}>
                          See all
                          </Link>
                  </Button>
              
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((r: Ride) => <RideCard key={r.id} r={r} />)}
          </div>
      </section>  )
}

export default LatestRides