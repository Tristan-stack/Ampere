import { PrismaClient } from '@prisma/client';
import { io } from "socket.io-client";
import path from 'path';

// Initialiser Prisma
const prisma = new PrismaClient();

// Prévenir le double démarrage
declare global {
    var __socketHandlerStarted: boolean | undefined;
}

if (!global.__socketHandlerStarted) {
    global.__socketHandlerStarted = true;

    console.log("Socket handler initialisé.");

    // Initialiser le client socket
    const socket = io("wss://socket.allegre.ens.mmi-unistra.fr", {
        transports: ["websocket"],
    });

    // Définir le type pour les données du device
    type DeviceData = {
        Timestamp: string;
        'Data Key': string;
        Value: string;
        Unit: string;
        Quality: string;
    };

    // Buffer pour stocker les données reçues
    let dataBuffer: DeviceData[] = [];

    // Fonction pour enregistrer les dernières données pour chaque Data Key toutes les 5 minutes
    const saveLatestData = async () => {
        console.log("5 minutes sont passées.");
        if (dataBuffer.length === 0) {
            // Pas de données à sauvegarder
            return;
        }

        try {
            // Créer une map pour stocker la dernière donnée pour chaque Data Key
            const latestDataMap: { [key: string]: DeviceData } = {};

            // Parcourir le buffer pour trouver la dernière donnée pour chaque Data Key
            dataBuffer.forEach(data => {
                const dataKey = data['Data Key'];
                const timestamp = parseInt(data.Timestamp, 10);

                if (!latestDataMap[dataKey] || timestamp > parseInt(latestDataMap[dataKey].Timestamp, 10)) {
                    latestDataMap[dataKey] = data;
                }
            });

            const dataToInsert: any[] = [];

            // Vérifier l'existence de chaque device_key avant d'ajouter à l'insertion
            for (const data of Object.values(latestDataMap)) {
                const deviceExists = await prisma.devices.findUnique({
                    where: { device_key: data['Data Key'] },
                });

                if (deviceExists) {
                    dataToInsert.push({
                        device_key: data['Data Key'],
                        value: data.Value,
                        unit: data.Unit,
                        quality: data.Quality,
                        timestamp: new Date(parseInt(data.Timestamp, 10) * 1000),
                    });
                } else {
                    console.warn(`device_key ${data['Data Key']} n'existe pas dans la table Devices. Ignoré.`);
                }
            }

            if (dataToInsert.length > 0) {
                for (const data of dataToInsert) {
                    await prisma.devices_values.create({
                        data: {
                            value: data.value,
                            unit: data.unit,
                            quality: data.quality,
                            timestamp: data.timestamp,
                            device: {
                                connect: { device_key: data.device_key }
                            }
                        }
                    });
                }
                console.log(`Inséré ${dataToInsert.length} enregistrements dans la base de données.`);
            } else {
                console.log("Aucune donnée valide à insérer cette période.");
            }
        } catch (error) {
            console.error('Erreur lors de l’insertion des données :', error);
        }

        // Vider le buffer après l'insertion
        dataBuffer = [];
    };

    // Définir un intervalle pour enregistrer les données toutes les 5 minutes (300000 millisecondes)
    setInterval(saveLatestData, 300000);

    // Gestion des données reçues du socket
    socket.on("data", (data?: DeviceData) => {
        console.log("Données reçues :", data);

        if (data) {
            // Ajouter la donnée individuelle au buffer
            dataBuffer.push(data);
        }
    });

    // Gestion des erreurs de connexion
    socket.on("connect_error", (err) => {
        console.error("Erreur de connexion au socket :", err);
    });

    // Déconnexion propre à l'arrêt du serveur
    process.on("SIGINT", async () => {
        await prisma.$disconnect();
        socket.disconnect();
        console.log("Socket et Prisma déconnectés proprement.");
        process.exit(0);
    });
}

export const startSocketHandler = () => {
    console.log("Socket handler démarré.");
};