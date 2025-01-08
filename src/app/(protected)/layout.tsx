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
    const [isSidePanelVisible, setIsSidePanelVisible] = useState(true);

    useEffect(() => {
        document.documentElement.classList.add("dark");

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === 'd') {
                event.preventDefault();
                handleToggleSidePanel();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const handleToggleSidePanel = () => {
        setIsSidePanelVisible(prev => !prev);
    };

    const handleClose = () => {
        setIsSidePanelVisible(false);
    };

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarTrigger />
            <main className='w-full flex flex-col justify-center items-center'>
                {/* Bento */}
                <div className="w-auto space-y-4">
                    <div className="absolute top-2 right-2">
                    <GradientButton onClick={handleToggleSidePanel}/>
                    </div>
                    <div className='w-[calc(100vw-20rem)] bg-sidebar border shadow rounded-md overflow-hidden h-[calc(100vh-6rem)] p-4 flex space-x-4'>
                        {children}
                    </div>
                </div>
                <SidePanel isVisible={isSidePanelVisible} onClose={handleClose} onToggle={handleToggleSidePanel} />
            </main>
        </SidebarProvider>
    )
}

export default SidebarLayout