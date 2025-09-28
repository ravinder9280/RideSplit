'use client'
import Link from 'next/link'
import React from 'react'
import { Button } from './ui/button'
import { Search,Plus,Car,Inbox } from 'lucide-react'
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { usePathname } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import { cn } from '@/lib/utils'

export const NavItems = [
    { label: "Home", href: "/" },
    { label: "How it works", href: "/how-it-works" },
    { label: "Safety", href: "/safety" },
    {
        label: "Rides",
        children: [
            { label: "Search Rides", href: "/search", icon: Search },
            { label: "Post a Ride", href: "/ride/new", icon: Plus, cta: true },
            { label: "My Rides", href: "/rides", icon: Car },
            { label: "Requests", href: "/requests", icon: Inbox},
        ],
    },

]
const userButtonAppearance = {
    elements: {
        userButtonAvatarBox: "border border-primary/50", // Custom width and height
        userButtonPopoverActionButton: "text-primary", // Custom text color for action buttons
    },
};

const Navbar = () => {
    const { user } = useUser()
  const pathname = usePathname()    
  return (
      <header className='fixed top-0 left-0 right-0 z-[999] transition-all duration-300 bg-dark/80  shadow-md backdrop-blur-sm'>
          <div className='w-full sm:px-6 md:px-16 lg:px-28 px-4'>
              <div className='flex items-center h-16'>
                  <div className='flex-1 flex items-center'>
                      <Link href={'/'} className='text-foreground font-poppins font-bold text-2xl flex items-center cursor-pointer'>
                          RideSplit
                          
                      </Link>
                      
                  </div>
                  <div
                      className="hidden md:flex items-center justify-center gap-4"
                  >
                      {
                          NavItems.map((item, idx) => (
                              item.children ? (
                                  
                                  <NavigationMenu   key={6}>
                                      <NavigationMenuList>
                                          <NavigationMenuItem className='hover:bg-transparent'>
                                              <NavigationMenuTrigger className='text-[16px]' >{ item.label}</NavigationMenuTrigger>
                                              <NavigationMenuContent className=''>
                                                  <div className=' p-2 grid w-48 '>
                                                      
                                                  {
                                                          item.children.map((i, id) => (
                                                              <Button variant={'ghost'} className={'justify-start'} key={id} asChild>
                                                                  
                                                          
                                                                  <Link href={i.href || ''}><i.icon  />{" "}{i.label}</Link>
                                                          
                                                          </Button>
                                                          
                                                        ))
                                                    }
                                                    </div>

                                                          

                                              </NavigationMenuContent>
                                          </NavigationMenuItem>
                                      </NavigationMenuList>
                                  </NavigationMenu>
                              ):
                                  <Button variant={'ghost'} key={idx} className={cn(pathname === item.href && 'border-b', 'text-[16px]  border-primary shadow-none hover:bg-transparent hover:border-b rounded-none transition-colors duration-300)')} asChild>
                                  <Link href={item.href||''} >
                                  {item.label}
                                  </Link>
                              </Button>
                          ))
                          
                      }
                      
                      
                  </div>
                  <div className='flex items-center pl-6 gap-2'>

                      {
                          user ? <UserButton appearance={userButtonAppearance} /> :
                              <Button  asChild >
                                  <Link href={'/sign-in'}>

                                      SignIn
                                  </Link>
                              </Button>

                      }
                  </div>

                  
              </div>
              
          </div>
          
    </header>
  )
}

export default Navbar