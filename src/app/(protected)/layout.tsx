'use client'
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from './dashboard/app-sidebar'
import React, { useEffect, useState } from "react";
import GradientButton from "@/components/calendar-button";
import SidePanel from "@/components/side-panel";
import { DataProvider } from "@/app/(protected)/context/DataContext";
import { LoadingScreen } from "@/components/loading-screen";
import { get } from "http";

type Props = {
    children: React.ReactNode
}

const SidebarLayout = ({ children }: Props) => {
    const [isSidePanelVisible, setIsSidePanelVisible] = useState(false);

    useEffect(() => {
        // Cookie management functions
        const getCookie = (name: string) => {
            const nameEQ = name + "=";
            const ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i]?.trim();
                if (c?.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
            }
            return null;
        };

        const setCookie = (name: string, value: string, days: number) => {
            const expires = new Date();
            expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
            document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
        };

        // Check if device is a tablet (screen width between 768px and 1024px)
        const isTablet = window.matchMedia('(min-width: 768px) and (max-width: 1024px)').matches;
        console.log("Est tablette:", isTablet);
        console.log(getCookie('sidebar:state'));
        // Initialize sidebar state
        const initializeSidebarState = () => {
            const savedState = getCookie('sidebar:state');
            if (isTablet) {
                // Set to false by default on tablet
                setCookie('sidebar:state', 'false', 7);
                // You might want to trigger any necessary UI updates here
            } else if (isTablet === false) {
                // Set default state for non-tablet devices
                setCookie('sidebar:state', 'true', 7);
            }
        };

        initializeSidebarState();

        // Initialize date range cookie
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

        // Add dark mode
        document.documentElement.classList.add("dark");

        // Handle keyboard shortcut
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
                <main className='w-full flex flex-col justify-center items-center relative bg-blue-5 -ml-8 z-0 pb-24 xl:pb-0'>
                    {/* Bento */}

                    <GradientButton onClick={handleToggleSidePanel} />
                    <div className="w-full px-6 ">
                        <div className='w-full h-[calc(100vh-6rem)] flex'>
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