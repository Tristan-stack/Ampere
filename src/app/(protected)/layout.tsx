'use client'
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from './dashboard/app-sidebar'
import React, { useEffect, useState } from "react";
import GradientButton from "@/components/calendar-button";
import SidePanel from "@/components/side-panel";
import { DataProvider } from "@/app/(protected)/context/DataContext";
import { LoadingScreen } from "@/components/loading-screen";

type Props = {
    children: React.ReactNode
}

const SidebarLayout = ({ children }: Props) => {
    const [isSidePanelVisible, setIsSidePanelVisible] = useState(false);
    useEffect(() => {
        const setCookie = (name: string, value: string, days: number) => {
          const expires = new Date();
          expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
          document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
        };
    
        const getCookie = (name: string) => {
          const nameEQ = name + "=";
          const ca = document.cookie.split(';');
          for (let i = 0; i < ca.length; i++) {
            let c = ca[i]?.trim();
            if (c?.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
          }
          return null;
        };
    
        const initializeDateRangeCookie = () => {
          const savedRange = getCookie('dateRange');
          if (!savedRange) {
            const currentDate = new Date();
            const day = currentDate.getDay() || 7;
            const monday = new Date(currentDate);
            monday.setDate(monday.getDate() - (day - 1));
            const sunday = new Date(monday);
            sunday.setDate(sunday.getDate() + 6);
            setCookie('dateRange', JSON.stringify({ from: monday, to: sunday }), 7);
          }
        };
    
        initializeDateRangeCookie();
      }, []);
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
            <DataProvider>
                <LoadingScreen />
                <AppSidebar />
                <SidebarTrigger />
                <main className='w-full flex flex-col justify-center items-center'>
                    {/* Bento */}
                    <div className="w-full space-y- pr-12">
                        <div className="absolute top-2 right-2">
                            <GradientButton onClick={handleToggleSidePanel}/>
                        </div>
                        <div className='w-full bg-sidebar shadow rounded-md overflow-hidden h-[calc(100vh-6rem)] pl-4 py-2 flex space-x-4'>
                            {children}
                        </div>
                    </div>
                    <SidePanel isVisible={isSidePanelVisible} onClose={handleClose} onToggle={handleToggleSidePanel} />
                </main>
            </DataProvider>
        </SidebarProvider>
    )
}

export default SidebarLayout