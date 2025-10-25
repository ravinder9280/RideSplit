import RideCard from '@/components/ride/ride-card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { prisma } from '@/lib/prisma';
import { Ride } from '@/lib/types/Ride';
import { Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react'

const UserPage =  async ({params}:{params:{id:string}}) => {
    // pseudo
    const user = await prisma.user.findUnique({
        where: { id: params.id },
        select: {
            id: true, name: true, imageUrl: true, rating: true,email:true,
            rides: { take: 5, orderBy: { createdAt: "desc" }, select: { id: true, fromText: true, toText: true, fromLat: true, fromLng: true, toLat: true, toLng: true, departureAt: true, perSeatPrice: true, status: true, seatsTotal: true, estTotalFare: true, service: true, seatsAvailable: true, owner: { select: { id: true, name: true, email: true, imageUrl: true, rating: true, clerkId: true, phone: true } } } },
            memberships: { take: 5, orderBy: { createdAt: "desc" }, select: { status: true, ride: { select: { id: true, fromText: true, toText: true, departureAt: true, status: true } } } }
        }
    });
    console.log(user?.memberships)

  return (
      <div className='p-2 flex flex-col gap-4'>
          <div className='flex items-center gap-2'>
              <div className='rounded-full ring-2 ring-primary'>
                  <Image className='rounded-full h-24' src={user?.imageUrl||''} alt='hello' height={96} width={96}/>
              </div>
              <div className='flex flex-col flex-1'>
                  <span className='text-2xl gap-1 font-bold '>{user?.name  || "User"}</span>
                  <span className='text-sm text-muted-foreground line-clamp-1'>{ user?.email||"user@mail.com"}</span>
              </div>
              
          </div>
          <div>
              Experience : <span className='font-bold'>HIGH</span>
          </div>
          <div className='flex gap-4 items-center'>
              <span>
                  <Star size={20} fill="yellow" stroke="yellow" />
              </span>
              <span className='text-muted-foreground tracking-widest font-bold'>
                  
              {user?.rating}/5
              </span>
              
              
          </div>
          <Separator />
          <div className='flex flex-col gap-5'>
              <div className='flex items-center justify-between'>
                  
              <h4 className='text-lg text-accent-foreground'>
                  Posted Rides
                  </h4>
                  <Button variant="ghost">
                      <Link className='text-muted-foreground' href={'/rides'}>
                          See all
                      </Link>
                  </Button>

                  
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {
                      user?.rides && user.rides.length > 0 && user.rides.map((ride: Ride) => (
                          <RideCard key={ride.id} r={ride} />

                      ))
                  }
              </div>

          </div>
          
      </div>
  )
}

export default UserPage