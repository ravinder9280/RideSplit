import React from 'react'
import { Search } from 'lucide-react'

import MapboxAutocomplete from '../location/autocomplete'
import Link from 'next/link'

const LocationNavigator = () => {
    return (

                    <Link href={'/rides'} className="flex bg-secondary h-12 items-center justify-between px-3 md:px-4 rounded-md w-full">
                        <h2 className=' text-muted-foreground'>Search...</h2>
                        <Search className='text-muted-foreground' size={16} strokeWidth={2} />
                    </Link >
                



    )
}

export default LocationNavigator