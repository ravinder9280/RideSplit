export type Owner = {
    imageUrl?: string | null
    rating?: number | null,
    name?: string | null,
    id?: string ,
    email?: string ,
    clerkId?: string | number,
}
export interface Ride {
    id?:string,
    fromText: string
    fromLat: number
    fromLng: number
    toText: string
    toLat: number
    toLng: number
    departureAt: string | Date
    seatsTotal: number
    estTotalFare: number
    perSeatPrice:number
    service: "UBER" | "OLA"
    owner?:  Owner , 
    seatsAvailable : number


}
export type RideInfo = { fromText: string; toText: string; owner?: Owner };

export type RideMember = { id: string; status: "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED"; rideId: string; ride: RideInfo };

