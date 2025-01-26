"use client";
import React, { useRef, useEffect } from "react";
import { createSwapy } from 'swapy';
import { Line } from 'react-chartjs-2';
import { GraphConso } from "./graph-conso";
import { useData } from '../context/DataContext';
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
    const { deviceData, labels, unit, deviceName, isLoading } = useData();

    useEffect(() => {
        const socket = new WebSocket('wss://socket.allegre.ens.mmi-unistra.fr');

        socket.onopen = () => {
            console.log('WebSocket connection opened');
        };

        socket.onmessage = (event) => {
            console.log('WebSocket message received:', event.data);
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        socket.onclose = () => {
            console.log('WebSocket connection closed');
        };

        return () => {
            socket.close();
        };
    }, []);
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
        <div ref={container} className="w-full space-y-4 flex flex-col justify-center mx-auto">
            <div className="w-full h-1/2 flex space-x-4">
                <div className="w-2/3 bg-neutral-800 rounded-md" data-swapy-slot="a">
                    <div className="h-full" data-swapy-item="a">
                        <div className="w-full h-full bg-neutral-900 rounded-md flex items-center justify-center">
                            {isLoading ? (
                                <p className="text-white">Chargement...</p>
                            ) : (
                                <Line data={chartData} options={options} />
                            )}
                        </div>
                    </div>
                </div>
                <div className="w-1/3 bg-neutral-800 rounded-md" data-swapy-slot="b">
                    <div className="h-full" data-swapy-item="b">
                        <div className="w-full h-full bg-neutral-900 rounded-md">
                            {/* Vous pouvez ajouter d'autres composants ou informations ici */}
                        </div>
                    </div>
                </div>
            </div>
            <div className="h-1/2 flex space-x-4">
                <div className="w-1/3 h-full flex justify-between items-center flex-col space-y-4">
                    <div className="bg-neutral-800 h-1/2 w-full rounded-md" data-swapy-slot="c">
                        <div className="h-full" data-swapy-item="c">
                            <div className="w-full h-full bg-neutral-900 rounded-md">
                                {/* Contenu supplémentaire */}
                            </div>
                        </div>
                    </div>
                    <div className="bg-neutral-800 h-1/2 w-full rounded-md" data-swapy-slot="d">
                        <div className="h-full" data-swapy-item="d">
                            <div className="w-full h-full bg-neutral-900 rounded-md">
                                {/* Contenu supplémentaire */}
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
        </div>
    );
};

export default Dashboard;