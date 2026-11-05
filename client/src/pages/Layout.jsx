import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import AiChatWidget from '../components/AiChatWidget' // <-- Import this

const Layout = () => {
  return (
    <div className='flex h-screen bg-linear-to-br from-slate-50 via-white to-indigo-50/30'>
        <Sidebar />
        <main className='flex-1 overflow-y-auto'>
            <div className='p-4 pt-16 sm:p-6 sm:pt-6 lg:p-8 max-w-400 mx-auto'>
                <Outlet />
            </div>
        </main>
        
        {/* Add the AI Widget here */}
        <AiChatWidget />
    </div>
  )
}

export default Layout