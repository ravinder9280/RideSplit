export interface Ride {
    fromText: string
    fromLat: number
    fromLng: number
    toText: string
    toLat: number
    toLng: number
    departureAt: string | Date
    departureTime: string
    seatsTotal: number
    estTotalFare: number
    perSeatPrice:number
    service: "UBER" | "OLA"
    owner?: any | null
    id: number
    seatsAvailable : number


}