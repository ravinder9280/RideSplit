import React from 'react'
import { Search } from 'lucide-react'
import Link from 'next/link'


const SearchHome = () => {
  return (
      <Link href={'/rides'} className="flex bg-secondary h-12 items-center justify-between px-2  rounded-md w-full">
<h2 className=' text-muted-foreground'>Search...</h2>         
              <Search className='text-muted-foreground' size={16} strokeWidth={2} />
      </Link>  )
}

export default SearchHome