import React from 'react'
import { Search } from 'lucide-react'

import Link from 'next/link'

const LocationNavigator = () => {
    return (

                    <Link href={'/rides'} className="flex bg-secondary h-12 items-center max-w-2xl mx-auto gap-4 px-3 md:px-4 rounded-md w-full">
                        <Search className='text-muted-foreground' size={20}  />
                        <h2 className=' text-muted-foreground'>Search...</h2>
                    </Link >
                



    )
}

export default LocationNavigator