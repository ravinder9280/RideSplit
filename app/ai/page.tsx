import ChatBox from '@/components/chat/ChatBox'
import React from 'react'

const page = () => {
  return (
      <div>
          
          <div className=" mx-auto ">
              <h2 className="text-lg font-semibold mb-3">AI Assistant</h2>
              <ChatBox />
          </div>
    </div>
  )
}

export default page