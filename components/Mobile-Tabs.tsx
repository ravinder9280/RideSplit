'use client'
import React from 'react'
import { NavItems } from './Navbar'
import Image from 'next/image'
import Link from 'next/link'
const MobileTabs = () => {
  return (
      <div className='space-y-4 md:hidden mt-6'>
          <h2 className='text-xl text-primary/80 font-bold'>Suggestions</h2>
          <div className='flex items-center justify-between gap-4'>
              {NavItems[3].children?.map((item, idx) => (
                <Link key={idx} className='  text-center flex flex-col items-center justify-center gap-2' href={item.href}>
                  <div className='w-20 h-20 bg-secondary rounded-md flex items-center justify-center'>
                    <Image  src={item.image} alt={item.label} width={40} height={40} />
                  </div>
                  <span className='text-sm font-medium'>{item.label}</span>

                  </Link>
              ))}
          </div>
          
    </div>
  )
}

export default MobileTabs