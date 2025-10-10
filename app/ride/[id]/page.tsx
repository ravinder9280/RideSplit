import RidePin from '@/components/common/RidePin'
import MapLine from '@/components/map/map'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

type PageProps = { params: { id: string } }

export default async function Page({ params }: PageProps) {
    const ride = await prisma.ride.findUnique({
        where: { id: params.id },
        select: {
            fromLat: true,
            fromLng: true,
            toLat: true,
            toLng: true,
            fromText: true,
            toText: true,
            perSeatPrice: true,
            departureAt: true,
            status: true,
            seatsAvailable: true,
            id:true,
            
            owner: {
                select: {
                    imageUrl: true,
                    rating: true,
                    name: true,
                    id: true,
                    clerkId:true
                    
                    
                }
            }
            
        },
    })

    if (!ride) {
        notFound()
    }

    const from = { lat: ride.fromLat, lng: ride.fromLng }
    const to = { lat: ride.toLat, lng: ride.toLng }

    return (
        <div className='mx-auto max-w-5xl'>
            
            <RidePin lineClampClass={"line-clamp-2 max-w-xl"} fromText={ride.fromText} toText={ride.toText} />

        <MapLine
                from={from} to={to}
                owner={ride.owner}
                status={ride.status}
                startsAt={ride.departureAt.toDateString()||''}
                perSeatPrice={ride.perSeatPrice || ''}
                fromText={ride.fromText}
                toText={ride.toText}
                seatsAvailable={ride.seatsAvailable}
                rideId={ride.id}
            />
            </div>
    )
}