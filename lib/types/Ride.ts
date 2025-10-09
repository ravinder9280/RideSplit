export interface Ride {
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
    owner?: {
        
            imageUrl?: string,
            rating?: number,
            name?: string,

        
    }   , id: number
    seatsAvailable : number


}