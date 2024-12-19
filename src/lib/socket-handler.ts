// lib/socket-handler.ts
import { PrismaClient } from '@prisma/client';
import { io } from "socket.io-client";

// Initialiser Prisma
const prisma = new PrismaClient();

// Prévenir le double démarrage
declare global {
    var __socketHandlerStarted: boolean | undefined;
}

// Vérifier si le socket handler a déjà démarré
if (!global.__socketHandlerStarted) {
    global.__socketHandlerStarted = true;

    console.log("Socket handler initialisé.");

    // Initialiser le client socket
    const socket = io("wss://socket.allegre.ens.mmi-unistra.fr", {
        transports: ["websocket"],
    });

    // Fonction pour insérer les données dans la base de données
    const saveDeviceData = async (data: {
        Timestamp: string;
        'Data Key': string;
        Value: string;
        Unit: string;
        Quality: string;
    }) => {
        try {
            const timestamp = new Date(parseInt(data.Timestamp, 10) * 1000);
    
            await prisma.devices_values.create({
                data: {
                    device_key: data['Data Key'],
                    value: data.Value,
                    unit: data.Unit,
                    quality: data.Quality,
                    timestamp,
                },
            });
    
            console.log('Données insérées :', data);
        } catch (error) {
            console.error('Erreur lors de l’insertion des données :', error);
        }
    };

    // Gestion des événements du socket
    socket.on("data", async (data?: any) => { // Modifier any[] en any
        console.log("Données reçues :", data);

        if (data) {
            // Vérifier si data est un tableau
            if (Array.isArray(data)) {
                for (const item of data) {
                    await saveDeviceData(item);
                }
            } else {
                // Si data est un objet unique
                await saveDeviceData(data);
            }
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
