"use client";
import React, { useState, useEffect, useRef } from "react";
import { createSwapy } from 'swapy'

const Dashboard = () => {
    const swapy = useRef<ReturnType<typeof createSwapy> | null>(null)
    const container = useRef(null)
    const containerRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);

    const toggleDiv = () => {
        setIsOpen(!isOpen);
    };
    useEffect(() => {
        // If container element is loaded
        if (container.current) {
            swapy.current = createSwapy(container.current)

            // Your event listeners
            swapy.current.onSwap((event) => {
                console.log('swap', event);
            })
        }

        return () => {
            // Destroy the swapy instance on component destroy
            swapy.current?.destroy()
        }
    }, [])
    return (
        <div ref={container} className="w-5/6 space-y-4 flex flex-col justify-center mx-auto">
            <div className="w-full flex space-x-4">
                <div className="w-2/3 h-80 bg-neutral-800 rounded-md" data-swapy-slot="a">
                    <div className="h-full" data-swapy-item="a">
                        <div className="w-full h-full bg-blue-500 rounded-md">
                        </div>
                    </div>
                </div>
                <div className="w-1/3 h-80 bg-neutral-800 rounded-md" data-swapy-slot="b">
                    <div className="h-full" data-swapy-item="b">
                        <div className="w-full h-full bg-orange-500 rounded-md">
                        </div>
                    </div>
                </div>
            </div>
            <div className="h-80 flex space-x-4">
                <div className="w-1/3 h-full flex justify-between items-center flex-col space-y-4">
                    <div className="bg-neutral-800 h-40 w-full rounded-md"  data-swapy-slot="c">
                        <div className="h-full"  data-swapy-item="c">
                            <div className="w-full h-full bg-green-500 rounded-md">
                            </div>
                        </div>
                    </div>
                    <div className="bg-neutral-800 h-36 w-full rounded-md" data-swapy-slot="d">
                        <div className="h-full" data-swapy-item="d">
                            <div className="w-full h-full bg-yellow-500 rounded-md">
                            </div>
                        </div>
                    </div>
                </div>
                <div className="w-2/3 h-80 bg-neutral-800 rounded-md" data-swapy-slot="e">
                    <div className="h-full" data-swapy-item="e">
                        <div className="w-full h-full bg-red-500 rounded-md">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;