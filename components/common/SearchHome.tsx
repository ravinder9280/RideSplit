import React from 'react'
import { Search } from 'lucide-react'
import {
      Dialog,
      DialogContent,
      DialogTrigger,
} from "@/components/ui/dialog"

import MapboxAutocomplete from '../location/autocomplete'

const SearchHome = () => {
  return (

              <Dialog>
                    <form>
                    <DialogTrigger asChild>
                          <div className="flex bg-secondary h-12 items-center justify-between px-2 md:px-4 rounded-md w-full">
                                <h2 className=' text-muted-foreground'>Search...</h2>
                                <Search className='text-muted-foreground' size={16} strokeWidth={2} />
                          </div> 
                          </DialogTrigger>
                    <DialogContent className="w-screen z-[999] h-screen">
                          <MapboxAutocomplete  namePrefix='from' />
                          
                                
                          </DialogContent>
                    </form>
              </Dialog>
              
       )
}

export default SearchHome