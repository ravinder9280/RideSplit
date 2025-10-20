import {  UserProfile } from '@clerk/nextjs'
import {  currentUser } from '@clerk/nextjs/server'
import React from 'react'
// const userButtonAppearance = {
//     elements: {
//         userButtonAvatarBox: "border border-primary/50", // Custom width and height
//         userButtonPopoverActionButton: "text-primary",
//         // Custom text color for action buttons
//     },
// };
const ProfilePage = async () => {
    
    const user= await currentUser()
  return (
      <div className=' flex items-center justify-center pt-12 '>{
          user &&
          <UserProfile/>
      
      }</div>
  )
}

export default ProfilePage