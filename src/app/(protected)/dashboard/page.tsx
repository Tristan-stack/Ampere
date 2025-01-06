"use client";
import React, { useState, useEffect, useRef } from "react";
import { createSwapy } from 'swapy';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const Dashboard = () => {
    const swapy = useRef<ReturnType<typeof createSwapy> | null>(null);
    const container = useRef(null);
    const [deviceData, setDeviceData] = useState<number[]>([]);
    const [labels, setLabels] = useState<string[]>([]);
    const [unit, setUnit] = useState<string>('');
    const [deviceName, setDeviceName] = useState<string>(''); // État pour le nom de l'appareil
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initialiser Swapy
        if (container.current) {
            swapy.current = createSwapy(container.current);

            // Écouter les événements de Swapy
            swapy.current.onSwap((event) => {
                console.log('swap', event);
            });
        }

        return () => {
            // Détruire l'instance Swapy lors du démontage du composant
            swapy.current?.destroy();
        };
    }, []);

    useEffect(() => {
        const fetchDeviceData = async () => {
            try {
                const response = await fetch('/api/getDeviceDataByKey', { // Assurez-vous que le chemin est correct
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        device_key: '14375bc7-eb4f-4cac-88f8-ae6be2dde5cd',
                    }),
                });
                const data = await response.json();
                setDeviceData(data.values);
                setLabels(data.timestamps.map((timestamp: string) => new Date(timestamp).toLocaleTimeString()));
                setUnit(data.unit);
                setDeviceName(data.name); // Stocker le nom de l'appareil
                setLoading(false);
            } catch (error) {
                console.error('Erreur lors de la récupération des données du device :', error);
                setLoading(false);
            }
        };

        fetchDeviceData();
    }, []);

    const chartData = {
        labels: labels,
        datasets: [
            {
                label: `Valeur (${unit})`,
                data: deviceData,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: `Graphique des données de ${deviceName}`,
            },
        },
    };

    return (
        <div ref={container} className="w-5/6 space-y-4 flex flex-col justify-center mx-auto">
            <div className="w-full flex space-x-4">
                <div className="w-2/3 h-80 bg-neutral-800 rounded-md" data-swapy-slot="a">
                    <div className="h-full" data-swapy-item="a">
                        <div className="w-full h-full bg-blue-500 rounded-md flex items-center justify-center">
                            {loading ? (
                                <p className="text-white">Chargement...</p>
                            ) : (
                                <Line data={chartData} options={options} />
                            )}
                        </div>
                    </div>
                </div>
                <div className="w-1/3 h-80 bg-neutral-800 rounded-md" data-swapy-slot="b">
                    <div className="h-full" data-swapy-item="b">
                        <div className="w-full h-full bg-orange-500 rounded-md">
                            {/* Vous pouvez ajouter d'autres composants ou informations ici */}
                        </div>
                    </div>
                </div>
            </div>
            <div className="h-80 flex space-x-4">
                <div className="w-1/3 h-full flex justify-between items-center flex-col space-y-4">
                    <div className="bg-neutral-800 h-40 w-full rounded-md" data-swapy-slot="c">
                        <div className="h-full" data-swapy-item="c">
                            <div className="w-full h-full bg-green-500 rounded-md">
                                {/* Contenu supplémentaire */}
                            </div>
                        </div>
                    </div>
                    <div className="bg-neutral-800 h-36 w-full rounded-md" data-swapy-slot="d">
                        <div className="h-full" data-swapy-item="d">
                            <div className="w-full h-full bg-yellow-500 rounded-md">
                                {/* Contenu supplémentaire */}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="w-2/3 h-80 bg-neutral-800 rounded-md" data-swapy-slot="e">
                    <div className="h-full" data-swapy-item="e">
                        <div className="w-full h-full bg-red-500 rounded-md">
                            {/* Contenu supplémentaire */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;