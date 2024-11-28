// page.tsx
"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { createSwapy } from "swapy";
import useCache from "@/hooks/useCache";

interface SlotItem {
    slot: string;
    item: string;
}

const Dashboard = () => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [isConfiguring, setIsConfiguring] = useState(false);
    const { storedValue: slotItemMap, setValue: setSlotItemMap, remove: removeSlotItemMap } = useCache<SlotItem[]>("dashboardSlotItemMap", [
        { slot: "item1", item: "item1" },
        { slot: "item2", item: "item2" },
        { slot: "item3", item: "item3" },
        { slot: "item4", item: "item4" },
        { slot: "item5", item: "item5" },
    ]);

    // Ref to keep track of the latest slotItemMap
    const slotItemMapRef = useRef<SlotItem[]>(slotItemMap);

    useEffect(() => {
        slotItemMapRef.current = slotItemMap;
    }, [slotItemMap]);

    // Memoized handleSwap to ensure stable reference
    const handleSwap = useCallback((event: any) => {
        const newMap: SlotItem[] = event.data.array
            .map((item: { slotId: string; itemId: string | null }) => {
                const { slotId, itemId } = item;
                if (slotId && itemId) {
                    return { slot: slotId, item: itemId };
                }
                return null;
            })
            .filter((item): item is SlotItem => item !== null);

        console.log("Swapped items, newMap:", newMap);
        // Compare with the latest slotItemMap using the ref
        if (JSON.stringify(newMap) !== JSON.stringify(slotItemMapRef.current)) {
            setSlotItemMap(newMap);
        }
    }, [setSlotItemMap]);

    // Effect to initialize swapy when configuring
    useEffect(() => {
        if (containerRef.current && isConfiguring) {
            console.log("Initializing swapy...");
            const swapy = createSwapy(containerRef.current, {
                animation: "dynamic",
            });

            const savedMap = window.localStorage.getItem("dashboardSlotItemMap");
            if (savedMap) {
                try {
                    const parsedMap: SlotItem[] = JSON.parse(savedMap);
                    setSlotItemMap(parsedMap);
                } catch (error) {
                    console.error("Failed to parse dashboardSlotItemMap from localStorage:", error);
                }
            }

            swapy.onSwap(handleSwap);

            return () => {
                console.log("Cleaning up swapy...");
                swapy.destroy();
            };
        }
    }, [isConfiguring, handleSwap]);

    const toggleConfiguration = () => {
        setIsConfiguring((prev) => !prev);
    };

    const resetCache = () => {
        removeSlotItemMap();
    };

    // Helper function to get item by slot
    const getItemBySlot = (slot: string) => {
        return slotItemMap.find((item) => item.slot === slot);
    };

    return (
        <div className="w-full">
            <div className="mb-4 flex space-x-4">
                <button
                    onClick={toggleConfiguration}
                    className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                    {isConfiguring
                        ? "Terminer la configuration"
                        : "Configurer son dashboard"}
                </button>
                <button
                    onClick={resetCache}
                    className="px-4 py-2 bg-red-500 text-white rounded"
                >
                    Réinitialiser le cache
                </button>
            </div>
            <div
                ref={containerRef}
                className="w-5/6 space-y-4 flex flex-col justify-center mx-auto"
            >
                {/* Example Slots */}
                <div className="w-full flex space-x-4">
                    <div
                        data-swapy-slot="item1"
                        className="w-2/3 h-80 bg-neutral-800 rounded-md p-4"
                    >
                        {getItemBySlot("item1") && (
                            <div
                                data-swapy-item={getItemBySlot("item1")?.item}
                                className={`handle ${isConfiguring ? "cursor-move" : ""}`}
                                data-swapy-handle
                            >
                                <div className="w-full h-32 bg-green-500"></div>
                            </div>
                        )}
                    </div>
                    <div
                        data-swapy-slot="item2"
                        className="w-1/3 bg-neutral-800 rounded-md p-4"
                    >
                        {getItemBySlot("item2") && (
                            <div
                                data-swapy-item={getItemBySlot("item2")?.item}
                                className={`handle ${isConfiguring ? "cursor-move" : ""}`}
                                data-swapy-handle
                            >
                                <div className="w-full h-32 bg-orange-500"></div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="h-80 flex space-x-4">
                    <div className="w-1/3 h-full flex justify-between items-center flex-col space-y-4">
                        <div
                            data-swapy-slot="item3"
                            className="bg-neutral-800 h-40 w-full rounded-md p-4"
                        >
                            {getItemBySlot("item3") && (
                                <div
                                    data-swapy-item={getItemBySlot("item3")?.item}
                                    className={`handle ${isConfiguring ? "cursor-move" : ""}`}
                                    data-swapy-handle
                                >
                                    <div className="w-full h-32 bg-blue-500"></div>
                                </div>
                            )}
                        </div>
                        <div
                            data-swapy-slot="item4"
                            className="bg-neutral-800 h-36 w-full rounded-md p-4"
                        >
                            {getItemBySlot("item4") && (
                                <div
                                    data-swapy-item={getItemBySlot("item4")?.item}
                                    className={`handle ${isConfiguring ? "cursor-move" : ""}`}
                                    data-swapy-handle
                                >
                                    <div className="w-full h-28 bg-yellow-500"></div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div
                        data-swapy-slot="item5"
                        className="w-2/3 h-80 bg-neutral-800 rounded-md p-4"
                    >
                        {getItemBySlot("item5") && (
                            <div
                                data-swapy-item={getItemBySlot("item5")?.item}
                                className={`handle ${isConfiguring ? "cursor-move" : ""}`}
                                data-swapy-handle
                            >
                                <div className="w-full h-32 bg-red-500"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;