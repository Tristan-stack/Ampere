"use client";
import React, { useState, useRef, useEffect } from "react";
import { Batimentgraph2 } from "./batiment-graph-2";
import Batimentgraph4 from "./batiment-graph-4";
import { BatimentgraphTable } from "./batiment-graph-tableau";
import { BatimentCarousel } from "./batiment-carousel";
import Squares from "@/components/squares";
import Score from "@/components/score";
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info, Maximize2, Minimize2, Blocks } from "lucide-react"
import { useData } from '../context/DataContext';
import AmpyWeather from "@/components/ampy-weather";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { createSwapy } from "swapy";
import { toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type ConsumptionData = {
    id: string;
    date: string;
    building: string;
    floor: string;
    totalConsumption: number;
    emissions: number;
};

const calculateEfficiencyScore = (data: ConsumptionData[]) => {
    if (data.length === 0) {
        return 500; // Score neutre si pas de données
    }

    // Votre logique de calcul ici
    return 310;
};

const CONFIG_STORAGE_KEY_PREFIX = "batimentConfig_";

const Batiments = () => {
    const {
        chartData,
        filteredData,
        aggregatedData,
        selectedBuildings,
        setSelectedBuildings,
        efficiencyScore
    } = useData();
    const { user } = useUser();
    const swapy = useRef<ReturnType<typeof createSwapy> | null>(null);
    const container = useRef<HTMLDivElement | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [configLoading, setConfigLoading] = useState(true);
    const [config, setConfig] = useState<string[] | null>(null);

    const FullscreenButton = ({ onClick }: { onClick: (e: React.MouseEvent) => void }) => (
        <button
            onClick={onClick}
            className="absolute top-1 right-1 p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors z-10"
        >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
    );
    const items = ["A", "B", "C"];
    const handleBuildingSelection = (building: string) => {
        setSelectedBuildings((prevBuildings: string[]) => {
            if (prevBuildings.includes(building)) {
                return prevBuildings.filter((b: string) => b !== building);
            }
            return [...prevBuildings, building];
        });
    };

    const buildingColors = {
        'A': 'hsl(var(--chart-1))',
        'B': 'hsl(var(--chart-2))',
        'C': 'hsl(var(--chart-3))'
    } as const;

    // Ajoutez les fonctions de gestion de la configuration
    const getSwapyConfig = () => {
        if (!container.current) return [];
        const items = Array.from(
            container.current.querySelectorAll<HTMLDivElement>("[data-swapy-item]")
        );
        return items.map((item) => item.getAttribute("data-swapy-item") || "");
    };

    const setSwapyConfig = (config: string[]) => {
        const currentContainer = container.current;
        if (!currentContainer) return;

        const slots = Array.from(
            currentContainer.querySelectorAll<HTMLDivElement>("[data-swapy-slot]")
        );

        slots.forEach((slot, index) => {
            const itemId = config[index];
            const item = currentContainer.querySelector<HTMLDivElement>(
                `[data-swapy-item="${itemId}"]`
            );

            if (item && slot) {
                slot.appendChild(item);
            }
        });
    };

    // Ajoutez les fonctions de sauvegarde locale
    const saveConfigToLocal = (config: string[]) => {
        if (user?.primaryEmailAddress?.emailAddress) {
            const key = `${CONFIG_STORAGE_KEY_PREFIX}${user.primaryEmailAddress.emailAddress}`;
            localStorage.setItem(key, JSON.stringify(config));
        }
    };

    const loadConfigFromLocal = (): string[] | null => {
        if (user?.primaryEmailAddress?.emailAddress) {
            const key = `${CONFIG_STORAGE_KEY_PREFIX}${user.primaryEmailAddress.emailAddress}`;
            const configString = localStorage.getItem(key);
            return configString ? JSON.parse(configString) : null;
        }
        return null;
    };

    // Modifions l'effet qui charge la configuration
    useEffect(() => {
        const fetchBatimentConfig = async () => {
            if (user?.primaryEmailAddress?.emailAddress) {
                try {
                    // D'abord, essayons de charger depuis le localStorage
                    const localConfig = loadConfigFromLocal();
                    if (localConfig) {
                        setConfig(localConfig);
                        // Appliquons la configuration immédiatement
                        setSwapyConfig(localConfig);
                    }

                    // Ensuite, vérifions la configuration sur le serveur
                    const response = await fetch("/api/getBatimentConfig", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            userEmail: user.primaryEmailAddress.emailAddress
                        }),
                    });
                    const data = await response.json();

                    if (data.config) {
                        setConfig(data.config);
                        saveConfigToLocal(data.config);
                        // Appliquons la configuration du serveur si elle existe
                        setSwapyConfig(data.config);
                    }
                } catch (error) {
                    console.error("Erreur lors de la récupération de la configuration :", error);
                } finally {
                    setConfigLoading(false);
                }
            } else {
                setConfigLoading(false);
            }
        };

        fetchBatimentConfig();
    }, [user]);

    // Modifions également la fonction de sauvegarde pour appliquer la configuration immédiatement
    const handleSaveConfig = async () => {
        if (user?.primaryEmailAddress?.emailAddress) {
            const currentConfig = getSwapyConfig();
            try {
                await fetch("/api/saveBatimentConfig", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        config: currentConfig,
                        userEmail: user.primaryEmailAddress.emailAddress,
                    }),
                });

                // Sauvegardons localement et appliquons la configuration
                saveConfigToLocal(currentConfig);
                setConfig(currentConfig);
                setSwapyConfig(currentConfig);

                toast('Configuration sauvegardée avec succès!', {
                    position: "top-right",
                    autoClose: 5000,
                    theme: "dark",
                    transition: Bounce,
                });
                setIsEditing(false);
            } catch (error) {
                console.error("Erreur lors de la sauvegarde :", error);
                toast.error('Erreur lors de la sauvegarde de la configuration', {
                    position: "top-right",
                    autoClose: 5000,
                    theme: "dark",
                });
            }
        }
    };

    // Ajoutons un effet pour appliquer la configuration lorsqu'elle change
    useEffect(() => {
        if (config && !configLoading) {
            setSwapyConfig(config);
        }
    }, [config, configLoading]);

    useEffect(() => {
        if (!configLoading && container.current) {
            swapy.current = createSwapy(container.current, {});
            swapy.current.enable(isEditing);
        }

        return () => {
            swapy.current?.destroy();
            swapy.current = null;
        };
    }, [configLoading, isEditing]);

    return (
        <div className="w-full space-y-4 flex flex-col justify-start lg:justify-center  pt-8 md:pt-0 mx-auto items-center md:mt-10 xl:mt-0">
            <div className="flex justify-between items-center w-full">
                <motion.button
                    initial={{ backgroundColor: "#171717", color: "#fff" }}
                    whileHover={{ backgroundColor: "#fff", color: "#000" }}
                    transition={{ duration: 0.2 }}
                    className="px-4 py-2 rounded"
                    onClick={() => setIsEditing(!isEditing)}
                >
                    {isEditing ? "Quitter le mode édition" : <Blocks className="h-4 w-4 stroke-[2.25px]" />}
                </motion.button>
                <AnimatePresence>
                    {isEditing && (
                        <motion.button
                            key="save-btn"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="px-4 py-2 rounded bg-white text-black hover:shadow-[0_0_15px_#858585] transition-shadow duration-300"
                            onClick={handleSaveConfig}
                        >
                            Sauvegarder
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>
            <div className="w-full h-full lg:h-1/2 flex flex-col lg:flex-row space-x-0 lg:space-x-4 space-y-4 lg:space-y-0"  >
                <div className="sm:w-full lg:w-1/3 bg-neutral-800 rounded-md border" data-swapy-slot="a">
                    <div className="w-full h-full bg-neutral-900 rounded-md p-4 overflow-hidden flex flex-col items-start justify-start space-y-4" data-swapy-item="a"  >
                        <h1 className="text-white text-2xl font-bold mb-3">Analyse des bâtiments</h1>
                        <div className="relative w-full space-y-4">
                            <Score score={efficiencyScore} />
                            <AmpyWeather score={efficiencyScore} />
                        </div>
                        <div>
                            <h3 className="text-neutral-300 text-sm 3xl:text-lg font-bold pb-0 lg:-pb-2 mt-2">Sélection des bâtiments</h3>
                            <div className="flex items-start mt-1 justify-start gap-[0.15rem]">
                                {["A", "B", "C"].map(building => (
                                    <button
                                        key={building}
                                        onClick={() => handleBuildingSelection(building)}
                                        className={cn(
                                            "px-2 py-2 3xl:px-4 3xl:py-2 rounded-md transition-all duration-200 font-medium text-xs",
                                            "border hover:bg-zinc-800 flex items-center gap-2",
                                            selectedBuildings.includes(building)
                                                ? "bg-neutral-950 text-white shadow-lg shadow-neutral-900/50"
                                                : "bg-neutral-900 text-neutral-400 hover:text-neutral-300"
                                        )}
                                    >
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{
                                                backgroundColor: buildingColors[building as keyof typeof buildingColors],
                                                boxShadow: `0 0 10px ${buildingColors[building as keyof typeof buildingColors]}`
                                            }}
                                        />
                                        Bâtiment {building}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
                <motion.div
                    className={cn(
                        "bg-neutral-800 rounded-md relative",
                        isFullscreen
                            ? "fixed md:absolute w-full -top-4 left-0 md:-top-6 md:-left-4 h-screen z-50 m-0 overflow-hidden"
                            : "w-full lg:w-2/3"



                    )}
                    initial={false}
                    animate={isFullscreen ? {
                        scale: 1,
                        opacity: 1,
                    } : {
                        scale: 1,
                        opacity: 1,
                    }}
                    transition={{
                        duration: 0.3,
                        ease: "easeInOut"
                    }}
                >
                    <FullscreenButton onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        setIsFullscreen(!isFullscreen);
                    }} />
                    <div className="h-full">
                        <div className="w-full h-full bg-neutral-900 rounded-md flex items-center justify-center">
                            <Batimentgraph2
                                aggregatedData={aggregatedData}
                                loading={false}
                            />
                        </div>
                    </div>
                </motion.div>

            </div>
            <div ref={container} className="w-full h-full pt-32 md:pt-0 lg:h-1/2 flex flex-col lg:flex-row space-x-0 lg:space-x-4">
                <div className="w-full lg:w-1/3 rounded-md">
                    <div className="h-full">
                        <div className="w-full h-72 md:h-96 lg:h-full rounded-md relative">
                            <Squares
                                speed={0.15}
                                squareSize={40}
                                direction='diagonal'
                                borderColor='#1f1f1f'
                                hoverFillColor='#222'
                            />
                            <div className="absolute inset-0 z-[1] pointer-events-none">
                                <BatimentCarousel />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="w-full lg:w-2/3 h-full flex flex-col pt-4 lg:pt-0 lg:flex-row space-x-0 lg:space-x-4 space-y-4 lg:space-y-0">
                    <div className="w-full lg:w-1/2 bg-neutral-900 rounded-md" data-swapy-slot="c">
                        <div className="h-72 md:h-96 lg:h-full" data-swapy-item="c">
                            <div className="w-full h-full bg-neutral-900 rounded-md relative">
                                <BatimentgraphTable filteredData={filteredData} loading={false} />
                            </div>
                        </div>
                    </div>
                    <div className="w-full lg:w-1/2 bg-neutral-900 rounded-md" data-swapy-slot="d">
                        <div className="h-72 md:h-96 lg:h-full" data-swapy-item="d">
                            <div className="w-full h-full bg-neutral-900 rounded-md overflow-hidden border">
                                <Batimentgraph4 />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Batiments;