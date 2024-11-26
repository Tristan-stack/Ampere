"use client";
import React, { useState, useEffect, useRef } from "react";
import { createSwapy } from "swapy"; // Import de Swapy

const Dashboard = () => {
    const containerRef = useRef(null); // Référence pour le conteneur
    const [isOpen, setIsOpen] = useState(false);

    const toggleDiv = () => {
        setIsOpen(!isOpen);
    };

    // Initialisation de Swapy
    useEffect(() => {
        if (containerRef.current) {
            const swapy = createSwapy(containerRef.current, {
                animation: "dynamic", // animation dynamique lors du swap
            });

            // Écouter l'événement de swap
            swapy.onSwap((event) => {
                console.log(event.data.object); // Affiche le nouvel ordre des éléments
                console.log(event.data.array);  // Affiche les éléments sous forme de tableau
                console.log(event.data.map);    // Affiche les éléments sous forme de Map
            });
        }
    }, []);

    return (
        <div ref={containerRef} className="w-5/6 space-y-4 flex flex-col justify-center mx-auto">
            <div className="w-full flex space-x-4">
                <div
                    data-swapy-slot="item1" // Slot pour l'élément
                    className="w-2/3 h-80 bg-neutral-800 rounded-md p-4"
                >
                    <div data-swapy-item="item1" className="handle" data-swapy-handle>
                        <div className="w-full h-32 bg-green-500">

                        </div>
                    </div>
                </div>
                <div
                    data-swapy-slot="item2" // Slot pour l'élément
                    className="w-1/3 bg-neutral-800 rounded-md p-4"
                >
                    <div data-swapy-item="item2" className="handle" data-swapy-handle>
                        <div className="w-full h-32 bg-orange-500">

                        </div>
                    </div>
                </div>
            </div>
            <div className="h-80 flex space-x-4">
                <div className="w-1/3 h-full flex justify-between items-center flex-col space-y-4">
                    <div
                        data-swapy-slot="item3" // Slot pour l'élément
                        className="bg-neutral-800 h-40 w-full rounded-md p-4"
                    >
                        <div data-swapy-item="item3" className="handle" data-swapy-handle>
                            <div className="w-full h-32 bg-blue-500">

                            </div>
                        </div>
                    </div>
                    <div
                        data-swapy-slot="item4" // Slot pour l'élément
                        className="bg-neutral-800 h-36 w-full rounded-md p-4"
                    >
                        <div data-swapy-item="item4" className="handle" data-swapy-handle>
                            <div className="w-full h-28 bg-yellow-500">

                            </div>
                        </div>
                    </div>
                </div>
                <div
                    data-swapy-slot="item5" // Slot pour l'élément
                    className="w-2/3 h-80 bg-neutral-800 rounded-md p-4"
                >
                    <div data-swapy-item="item5" className="handle" data-swapy-handle>
                        <div className="w-full h-32 bg-red-500">
                            
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
