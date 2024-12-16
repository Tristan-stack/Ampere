// layout.tsx
'use client'
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from './dashboard/app-sidebar'
import React, { useEffect, useState } from "react";
import GradientButton from "@/components/calendar-button";
import SidePanel from "@/components/side-panel";

type Props = {
    children: React.ReactNode
}

const SidebarLayout = ({ children }: Props) => {
    const [isContainerVisible, setIsContainerVisible] = useState(false);

    useEffect(() => {
        document.documentElement.classList.add("dark");
    }, []);

    const handleButtonClick = () => {
        setIsContainerVisible(true);
    };

    const handleClose = () => {
        setIsContainerVisible(false);
    };

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarTrigger />
            <main className='w-full flex flex-col justify-center items-center'>
                {/* Bento */}
                <div className="w-auto space-y-4">
                    {/* <GradientButton onClick={handleButtonClick}/> */}
                    <div className='w-[calc(100vw-20rem)] bg-sidebar border shadow rounded-md overflow-hidden h-[calc(100vh-6rem)] p-4 flex space-x-4'>
                        {children}
                    </div>
                </div>
                <SidePanel isVisible={isContainerVisible} onClose={handleClose} />
            </main>
        </SidebarProvider>
    )
}

export default SidebarLayout