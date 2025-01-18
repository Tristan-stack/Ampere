"use client";
import React, { useState, useEffect } from "react";
import { Batimentgraph2 } from "./batiment-graph-2";
import Batimentgraph4 from "./batiment-graph-4";
import { Batimentgraph3 } from "./batiment-graph-3";
import { BatimentgraphTable } from "./batiment-graph-tableau";
import { createSwapy } from 'swapy';

const BatA = () => {
    const [deviceData, setDeviceData] = useState<number[]>([]);
    const [labels, setLabels] = useState<string[]>([]);
    const [unit, setUnit] = useState<string>('');
    const [deviceName, setDeviceName] = useState<string>(''); // État pour le nom de l'appareil
    const [loading, setLoading] = useState(true);

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
                console.log('Données du device :', data);
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
        <div className="w-full space-y-4 flex flex-col justify-center mx-auto">
            <div className="w-full h-1/2 flex space-x-4">
                <div className="w-1/3 bg-neutral-800 rounded-md">
                    <div className="h-full">
                        <div className="w-full h-full bg-neutral-900 rounded-md">
                            {/* Vous pouvez ajouter d'autres composants ou informations ici */}
                        </div>
                    </div>
                </div>
                <div className="w-2/3 bg-neutral-800 rounded-md">
                    <div className="h-full">
                        <div className="w-full h-full bg-neutral-900 rounded-md flex items-center justify-center">
                            <Batimentgraph2 />
                        </div>
                    </div>
                </div>
            </div>
            <div className="w-full h-1/2 flex space-x-4">
                <div className="w-1/3 bg-neutral-800 rounded-md">
                    <div className="h-full">
                        <div className="w-full h-full bg-neutral-900 rounded-md">
                            <Batimentgraph3 />
                        </div>
                    </div>
                </div>
                <div className="w-2/3 h-full flex space-x-4">
                    <div className="w-1/2 bg-neutral-800 rounded-md">
                        <div className="h-full">
                            <div className="w-full h-full bg-neutral-900 rounded-md">
                                <BatimentgraphTable />
                            </div>
                        </div>
                    </div>
                    <div className="w-1/2 bg-neutral-800 rounded-md">
                        <div className="h-full">
                            <div className="w-full h-full rounded-md">
                                <Batimentgraph4 />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BatA;