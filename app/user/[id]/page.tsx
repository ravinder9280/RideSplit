import { Separator } from '@/components/ui/separator';
import { prisma } from '@/lib/prisma';
import { Star } from 'lucide-react';
import Image from 'next/image';
import React from 'react'

const UserPage =  async ({params}:{params:{id:string}}) => {
    // pseudo
    const user = await prisma.user.findUnique({
        where: { id: params.id },
        select: {
            id: true, name: true, imageUrl: true, rating: true,email:true,
            rides: { take: 5, orderBy: { createdAt: "desc" }, select: { id: true, fromText: true, toText: true, departureAt: true, perSeatPrice: true, status: true } },
            memberships: { take: 5, orderBy: { createdAt: "desc" }, select: { status: true, ride: { select: { id: true, fromText: true, toText: true, departureAt: true, status: true } } } }
        }
    });

  return (
      <div className='p-4 flex flex-col gap-4'>
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
          
      </div>
  )
}

export default UserPage