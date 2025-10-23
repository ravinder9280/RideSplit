import React from 'react'
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTrigger } from './ui/sheet'
import { CarFront, ChevronRight, LogOut, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import ThemeSwitch from './ui/theme-switch'
import { Button } from './ui/button'
import { SignOutButton, useAuth } from '@clerk/nextjs'

const MobileNav = ({ navigationItems, pathname }: { navigationItems: { label: string, href: string, icon: React.ElementType }[], pathname: string }) => {
    const { userId } = useAuth();     


    return (
        <Sheet>
            <SheetTrigger className=' p-2 rounded-full hover:bg-muted md:hidden' >


                    <Menu strokeWidth={1} size={6}  className='size-6' />
                    <span className="sr-only">Toggle navigation menu</span>
            </SheetTrigger>
            <SheetContent className='z-[2000] w-full h-full p-0 flex flex-col justify-between pb-2' side="left">
                <SheetHeader>

                <div className=" flex items-center justify-between px-4 py-2 bg-muted text-lg">
                    <Link href={'/'} className='text-foreground font-poppins font-bold text-xl flex items-center cursor-pointer'>
                        <CarFront className='text-primary' />
                        <span className='ml-2'>
                            RidePlus
                        </span>

                    </Link>


                    <SheetClose className="p-2 hover:bg-foreground/20  rounded-full ">

                        <X strokeWidth={1} className=" h-6 w-6 text-foreground/80" />
                        <span className="sr-only">Close</span>
                    </SheetClose>
                </div>
                <div className="flex flex-col divide-y px-4  justify-center   font-medium">
                   

                        {navigationItems.map((item) => {
                            const isActive =
                                pathname === item.href || pathname.startsWith(item.href + "/");

                            return (
                                <div key={item.label} className="py-2">
                                    <SheetClose asChild>
                                        <Link
                                            href={item.href}
                                            aria-current={isActive ? "page" : undefined}
                                            className={cn(
                                                "flex items-center font-normal justify-between hover:bg-muted/40 py-2 pl-1 rounded-md",
                                                isActive ? "text-primary" : "text-muted-foreground"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <item.icon strokeWidth={1} className="size-6 text-current" />
                                                <span>{item.label}</span>
                                            </div>

                                            <ChevronRight strokeWidth={1} className="size-6 text-current" />
                                        </Link>
                                    </SheetClose>
                                </div>
                            );
                        })}
                    </div>
                   
                        </SheetHeader>
                <SheetFooter>
                    <div className='px-4 py-2 border-t flex items-center w-full justify-between'>
                        <div className='flex items-center w-full justify-start '>
                            {userId ?
                                <div> 


                                <SheetClose>

                            <SignOutButton redirectUrl="/sign-in">
                                <Button variant={'ghost'}
                                    className="   text-red-500   "                        >
                                    <span className=''>

                                        Logout
                                    </span>
                                    <LogOut  className='size-6' size={24} />
                                </Button>
                            </SignOutButton>
                                </SheetClose>  
                                        </div>:
                                <SheetClose  asChild>

                                <Button variant={'outline'} asChild >
                                    <Link href={'/sign-in'}>

                                        SignIn
                                    </Link>
                                </Button>
                                </SheetClose>
                            }
                        </div>
                        <div className=''>


                    <ThemeSwitch />
                        </div>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>

    )
}

export default MobileNav