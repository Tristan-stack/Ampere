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
            <main className='w-full m-2'>
            <SidebarTrigger />
                {/* Bento */}
                <div className='border-sidebar-border bg-sidebar border shadow rounded-md overflow-y-auto h-[calc(100vh-6rem)] p-4'>
                    {children}
                </div>

            </main>
        </SidebarProvider>
    )
}

export default SidebarLayout