export type Owner = {
    imageUrl?: string | null
    rating?: number | null,
    name?: string | null,
    id?: string | number,
    clerkId: string | number,
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
