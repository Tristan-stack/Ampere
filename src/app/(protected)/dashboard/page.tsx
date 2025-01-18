"use client";

import React, { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { createSwapy } from "swapy";
import { Line } from "react-chartjs-2";
import { GraphConso } from "./graph-conso";
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

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

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
    const [configLoading, setConfigLoading] = useState(true); // Indicateur de chargement de la configuration

    // Fonction pour récupérer la configuration actuelle des éléments
    const getSwapyConfig = (): string[] => {
        if (!container.current) return [];
        const items = Array.from(
            container.current.querySelectorAll<HTMLDivElement>("[data-swapy-item]")
        );
        return items.map((item) => item.getAttribute("data-swapy-item") || "");
    };

    // Fonction pour appliquer une configuration existante
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
                console.warn(
                    `Impossible de trouver l'élément ou le slot pour l'id : ${itemId}`
                );
            }
        });
    };

    // Fetch device data
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

    // Save configuration
    const handleSaveConfig = async () => {
        if (user?.primaryEmailAddress?.emailAddress) {
            const config = getSwapyConfig();
            try {
                await fetch("/api/saveDashboardConfig", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        config,
                        userEmail: user.primaryEmailAddress.emailAddress,
                    }),
                });
                alert("Configuration sauvegardée !");
                setIsEditing(false);
            } catch (error) {
                console.error("Erreur lors de la sauvegarde :", error);
            }
        } else {
            console.error("Utilisateur non authentifié ou configuration invalide.");
        }
    };

    // Fetch existing configuration
    useEffect(() => {
        const fetchDashboardConfig = async () => {
            if (user?.primaryEmailAddress?.emailAddress) {
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
                        setSwapyConfig(data.config);
                    }
                } catch (error) {
                    console.error("Erreur lors de la récupération de la configuration :", error);
                } finally {
                    setConfigLoading(false); // Fin du chargement
                }
            } else {
                setConfigLoading(false); // Fin du chargement même si l'utilisateur n'est pas authentifié
            }
        };

        fetchDashboardConfig();
    }, [user]);

    // Initialize Swapy after configuration is loaded
    useEffect(() => {
        if (!configLoading && container.current) {
            swapy.current = createSwapy(container.current, {});

            swapy.current.onSwap((event) => {
                console.log("Swapped items", event);
            });

            if (isEditing) {
                swapy.current.enable(true); // Activer Swapy
            } else {
                swapy.current.enable(false); // Désactiver Swapy
            }
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

    if (configLoading) {
        // Afficher un indicateur de chargement pendant que la configuration est récupérée
        return <p>Chargement de votre configuration...</p>;
    }

    return (
        <div
            ref={container}
            className="w-full space-y-4 flex flex-col justify-center mx-auto"
        >
            <div className="flex justify-between items-center">
                <button
                    className={`px-4 py-2 rounded ${
                        isEditing ? "bg-red-500" : "bg-green-500"
                    } text-white`}
                    onClick={() => setIsEditing(!isEditing)}
                >
                    {isEditing ? "Quitter le mode édition" : "Configurer mon dashboard"}
                </button>
                {isEditing && (
                    <button
                        className="px-4 py-2 rounded bg-blue-500 text-white"
                        onClick={handleSaveConfig}
                    >
                        Sauvegarder
                    </button>
                )}
            </div>
            <div className="w-full h-1/2 flex space-x-4">
                <div className="w-2/3 bg-neutral-800 rounded-md" data-swapy-slot="a">
                    <div className="h-full" data-swapy-item="a">
                        <div className="w-full h-full bg-purple-900 rounded-md flex items-center justify-center">
                            {loading ? (
                                <p className="text-white">Chargement...</p>
                            ) : (
                                <Line data={chartData} options={options} />
                            )}
                        </div>
                    </div>
                </div>
                <div className="w-1/3 bg-neutral-800 rounded-md" data-swapy-slot="b">
                    <div className="h-full" data-swapy-item="b">
                        <div className="w-full h-full bg-red-900 rounded-md">
                            {/* Contenu supplémentaire */}
                        </div>
                    </div>
                </div>
            </div>
            <div className="h-1/2 flex space-x-4">
                <div className="w-1/3 h-full flex flex-col space-y-4">
                    <div className="bg-neutral-800 h-1/2 w-full rounded-md" data-swapy-slot="c">
                        <div className="h-full" data-swapy-item="c">
                            <div className="w-full h-full bg-green-900 rounded-md">
                                {/* Contenu supplémentaire */}
                            </div>
                        </div>
                    </div>
                    <div className="bg-neutral-800 h-1/2 w-full rounded-md" data-swapy-slot="d">
                        <div className="h-full" data-swapy-item="d">
                            <div className="w-full h-full bg-yellow-900 rounded-md">
                                {/* Contenu supplémentaire */}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="w-2/3 bg-neutral-800 rounded-md" data-swapy-slot="e">
                    <div className="h-full" data-swapy-item="e">
                        <div className="w-full h-full bg-blue-900 rounded-md">
                            <GraphConso />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;