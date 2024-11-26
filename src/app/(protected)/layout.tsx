'use client'
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from './dashboard/app-sidebar'
import React, { useEffect } from "react";



type Props = {
    children: React.ReactNode
}

const SidebarLayout = ({ children }: Props) => {
    useEffect(() => {
        document.documentElement.classList.add("dark");
      }, []);
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarTrigger />
            <main className='w-full flex justify-center items-center'>
                {/* Bento */}
                <div className='w-[calc(100vw-20rem)] bg-sidebar border shadow rounded-md overflow-hidden h-[calc(100vh-6rem)] p-4 flex space-x-4'>
                    {children}
                </div>

            </main>
        </SidebarProvider>
    )
}

export default SidebarLayout