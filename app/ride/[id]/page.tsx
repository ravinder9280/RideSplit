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
            toText:true
            
        },
    })

    if (!ride) {
        notFound()
    }

    const from = { lat: ride.fromLat, lng: ride.fromLng }
    const to = { lat: ride.toLat, lng: ride.toLng }

    return (
        <div className=''>
            <p>from - {ride.fromText}</p>
            <p>To - {ride.toText}</p>

        <MapLine
            from={from} to={to}
            />
            </div>
    )
}