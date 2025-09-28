import { Client } from '@googlemaps/google-maps-services-js'


const client = new Client();

export const autoComplete = async (input: string) => {


    try {
        
        const response = await client.placeAutocomplete({
            params: {
                input,
                key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY||""
            }
        })
        return response.data.predictions;
        
    } catch (error) {
        console.log(error)
        
    }
}

console.log(await autoComplete('sector 87'))