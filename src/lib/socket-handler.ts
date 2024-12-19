import { PrismaClient } from '@prisma/client';
import { io } from "socket.io-client";

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

            // Préparer les données à insérer
            const dataToInsert = Object.values(latestDataMap).map(data => ({
                device_key: data['Data Key'],
                value: data.Value,
                unit: data.Unit,
                quality: data.Quality,
                timestamp: new Date(parseInt(data.Timestamp, 10) * 1000),
            }));

            // Insérer les données en une seule opération
            await prisma.devices_values.createMany({
                data: dataToInsert,
                skipDuplicates: true, // Optionnel
            });

            console.log(`Inséré ${dataToInsert.length} enregistrements dans la base de données.`);
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