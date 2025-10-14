import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const UserCard = ({userId,userImage,userName,userEmail,className}:{userId:string,userImage:string,userName:string,userEmail:string,className:string}) => {
  return (
    <Link href={`/user/${userId}`} className={`  flex items-center gap-2 ${className}`} >
      <Image alt='user' className='rounded-full' width={40} height={40} src={userImage}/>
      <div className='flex flex-col' >
        <h3 className='text-foreground line-clamp-1'>{ userName}</h3>
        <span className='text-sm text-muted-foreground hover:text-muted-foreground/50 line-clamp-1'>{ userEmail}</span>
      </div>
    </Link>
  )
}

export default UserCard