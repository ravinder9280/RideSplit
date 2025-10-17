import React from 'react'
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTrigger } from './ui/sheet'
import { Button } from './ui/button'
import { CarFront, ChevronRight, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import ThemeSwitch from './ui/theme-switch'

const MobileNav = ({ navigationItems, pathname }: { navigationItems: { label: string, href: string, icon: React.ElementType }[], pathname: string }) => {
    return (
        <Sheet>
            <SheetTrigger asChild>

                <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 rounded-full md:hidden"
                >
                    <Menu className="size-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                </Button>
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

                        <X className=" h-6 w-6 text-foreground/80" />
                        <span className="sr-only">Close</span>
                    </SheetClose>
                </div>
                <div className="flex flex-col divide-y px-4  justify-center   font-medium">
                   

                    {navigationItems.map((item) => (
                        <div key={item.label} className='py-2' >

                        
                            
                            <SheetClose asChild >
                                



                                    <Link
                                    key={item.label}
                                    href={item.href}
                                    className={cn(pathname === item.href && 'text-primary ',`flex items-center justify-between  hover:bg-muted/40 py-2 pl-1  `)}
                                    >
                                    <div className='flex items-center gap-4'>

                                        <item.icon className='size-5  text-muted-foreground  ' />
                                        <span className=''>
                                            {item.label}
                                        </span>
                                    </div>
                                    <ChevronRight className='size-5  text-muted-foreground'/>
                                </Link>
                                
                            </SheetClose>
                        </div>
                        ))}
                </div>
                        </SheetHeader>
                <SheetFooter>
                    <div className='px-4 py-2 border-t'>
                        <div className='flex flex-col gap-1 justify-center'>

                        <span className='text-sm text-muted-foreground'>Dark Mode</span>

                    <ThemeSwitch />
                        </div>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>

    )
}

export default MobileNav