"use client";

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { createSwapy } from "swapy";
import { Line } from "react-chartjs-2";
import { GraphConso } from "./graph/graph-conso";
import { BigChart } from "./graph/big-chart";
import { useData } from '../context/DataContext';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { BarLoader } from 'react-spinners';
import { toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Blocks } from 'lucide-react';
import { AnimatePresence, motion } from "framer-motion";
import { Batimentgraph3 } from "./graph/batiment-graph-3";
import { Linechartsm } from "./graph/line-chart-sm";
import { RadialChart } from "./graph/radial-chart";
import TransunionScore from '@/components/score';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const CONFIG_STORAGE_KEY_PREFIX = "dashboardConfig_";

const Dashboard: React.FC = () => {
    const { user } = useUser();
    const swapy = useRef<ReturnType<typeof createSwapy> | null>(null);
    const container = useRef<HTMLDivElement | null>(null);
    const [deviceData, setDeviceData] = useState<number[]>([]);
    const [labels, setLabels] = useState<string[]>([]);
    const [unit, setUnit] = useState<string>("");
    const [deviceName, setDeviceName] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [configLoading, setConfigLoading] = useState(true);
    const [config, setConfig] = useState<string[] | null>(null);
    const { efficiencyScore } = useData();
    console.log('Score dans Dashboard:', efficiencyScore);
    
    const getSwapyConfig = (): string[] => {
        if (!container.current) return [];
        const items = Array.from(
            container.current.querySelectorAll<HTMLDivElement>("[data-swapy-item]")
        );
        return items.map((item) => item.getAttribute("data-swapy-item") || "");
    };

    const setSwapyConfig = (config: string[]) => {
        const currentContainer = container.current;
        if (!currentContainer) {
            console.error("Le conteneur n'est pas initialisé.");
            return;
        }

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
            } else {
                console.warn(`Impossible de trouver l'élément ou le slot pour l'id : ${itemId}`);
            }
        });
    };

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
            if (configString) {
                try {
                    const config = JSON.parse(configString);
                    if (Array.isArray(config)) {
                        return config;
                    }
                } catch (error) {
                    console.error("Erreur lors de la lecture du localStorage :", error);
                }
            }
        }
        return null;
    };

    useEffect(() => {
        const fetchDeviceData = async () => {
            try {
                const response = await fetch("/api/getDeviceDataByKey", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        device_key: "14375bc7-eb4f-4cac-88f8-ae6be2dde5cd",
                    }),
                });
                const data = await response.json();
                setDeviceData(data.values);
                setLabels(
                    data.timestamps.map((timestamp: string) =>
                        new Date(timestamp).toLocaleTimeString()
                    )
                );
                setUnit(data.unit);
                setDeviceName(data.name);
                setLoading(false);
            } catch (error) {
                console.error("Erreur lors de la récupération des données :", error);
                setLoading(false);
            }
        };

        fetchDeviceData();
    }, []);

    const handleSaveConfig = async () => {
        if (user?.primaryEmailAddress?.emailAddress) {
            const currentConfig = getSwapyConfig();
            try {
                await fetch("/api/saveDashboardConfig", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        config: currentConfig,
                        userEmail: user.primaryEmailAddress.emailAddress,
                    }),
                });
                saveConfigToLocal(currentConfig);
                toast('Configuration sauvegardée avec succès!', {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false, // Affiche la barre de progression
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "dark",
                    transition: Bounce,
                });
                setIsEditing(false);
            } catch (error) {
                console.error("Erreur lors de la sauvegarde :", error);
            }
        } else {
            console.error("Utilisateur non authentifié ou configuration invalide.");
        }
    };

    useEffect(() => {
        const fetchDashboardConfig = async () => {
            if (user?.primaryEmailAddress?.emailAddress) {
                const localConfig = loadConfigFromLocal();
                if (localConfig) {
                    setConfig(localConfig);
                }

                try {
                    const response = await fetch("/api/getDashboardConfig", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ userEmail: user.primaryEmailAddress.emailAddress }),
                    });
                    const data = await response.json();
                    if (data.config) {
                        setConfig(data.config);
                        saveConfigToLocal(data.config);
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

        fetchDashboardConfig();
    }, [user]);

    useLayoutEffect(() => {
        if (config && container.current) {
            setSwapyConfig(config);
        }
    }, [config]);

    useEffect(() => {
        if (!configLoading && container.current) {
            swapy.current = createSwapy(container.current, {});

            swapy.current.onSwap((event) => {
                console.log("Swapped items", event);
                const newConfig = getSwapyConfig();
                saveConfigToLocal(newConfig);
            });

            swapy.current.enable(isEditing);
        }

        return () => {
            swapy.current?.destroy();
            swapy.current = null;
        };
    }, [configLoading, isEditing]);

    const chartData = {
        labels: labels,
        datasets: [
            {
                label: `Valeur (${unit})`,
                data: deviceData,
                borderColor: "rgba(75, 192, 192, 1)",
                backgroundColor: "rgba(75, 192, 192, 0.2)",
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: "top" as const,
            },
            title: {
                display: true,
                text: `Graphique des données de ${deviceName}`,
            },
        },
    };

    return configLoading ? (
        <div className="flex justify-center items-center h-full w-full">
            <BarLoader color='#f3f3f3' height={4} width={200} className='drop-shadow-[0_0_10px_rgba(243,243,243,1)]' />
        </div>
    ) : (
        <div
            ref={container}
            className="w-full space-y-3 flex flex-col justify-center mx-auto"
        >
            <div className="flex justify-between items-center">
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
            <div className="w-full h-1/2 flex space-x-3">
                <div className="w-2/3 bg-neutral-800 rounded-md" data-swapy-slot="a">
                    <div className="h-full" data-swapy-item="a">
                        <div className="w-full h-full bg-neutral-900 rounded-md flex items-center justify-center">

                            <RadialChart />

                        </div>
                    </div>
                </div>
                <div className="w-1/3 bg-neutral-800 rounded-md" data-swapy-slot="b">
                    <div className="h-full" data-swapy-item="b">
                        <div className="w-full h-full bg-neutral-900 rounded-md">
                            <BigChart />
                        </div>
                    </div>
                </div>
            </div>
            <div className="h-1/2 flex space-x-3">
                <div className="w-1/3 h-full flex flex-col space-y-3">
                    <div className="bg-neutral-800 h-1/2 w-full rounded-md" data-swapy-slot="c">
                        <div className="h-full" data-swapy-item="c">
                            <div className="w-full h-full bg-neutral-900 rounded-md">
                                <Batimentgraph3 />
                            </div>
                        </div>
                    </div>
                    <div className="bg-neutral-800 h-1/2 w-full rounded-md" data-swapy-slot="d">
                        <div className="h-full" data-swapy-item="d">
                            <div className="w-full h-full bg-neutral-900 rounded-md">
                                <Linechartsm />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="w-2/3 bg-neutral-800 rounded-md" data-swapy-slot="e">
                    <div className="h-full" data-swapy-item="e">
                        <div className="w-full h-full bg-neutral-900 rounded-md">
                            <GraphConso />
                        </div>
                    </div>
                </div>
            </div>
            <TransunionScore score={efficiencyScore} />
        </div>
    );
};

export default Dashboard;