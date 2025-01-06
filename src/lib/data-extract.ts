import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fonction pour récupérer un device par son device_key
export const getDeviceByKey = async (deviceKey: string) => {
    try {
        const device = await prisma.devices.findUnique({
            where: { device_key: deviceKey },
        });
        return device;
    } catch (error) {
        console.error('Erreur lors de la récupération du device :', error);
        throw error;
    }
};

// Fonction pour récupérer les dernières valeurs d'un device par son device_key
export const getLatestDeviceValues = async (deviceKey: string) => {
    try {
        const deviceValues = await prisma.devices_values.findMany({
            where: { device_key: deviceKey },
            orderBy: { timestamp: 'desc' },
            take: 1,
        });
        return deviceValues;
    } catch (error) {
        console.error('Erreur lors de la récupération des valeurs du device :', error);
        throw error;
    }
};

// Fonction pour récupérer tous les devices
export const getAllDevices = async () => {
    try {
        const devices = await prisma.devices.findMany();
        return devices;
    } catch (error) {
        console.error('Erreur lors de la récupération des devices :', error);
        throw error;
    }
};

// Fonction pour récupérer toutes les valeurs d'un device par son device_key
export const getAllDeviceValues = async (deviceKey: string) => {
    try {
        const deviceValues = await prisma.devices_values.findMany({
            where: { device_key: deviceKey },
            orderBy: { timestamp: 'desc' },
        });
        return deviceValues;
    } catch (error) {
        console.error('Erreur lors de la récupération des valeurs du device :', error);
        throw error;
    }
};

// Fonction pour récupérer les données d'un device par son device_key
export const getDeviceDataByKey = async (deviceKey: string) => {
    try {
        console.log(`Fetching device with key: ${deviceKey}`);

        const device = await prisma.devices.findUnique({
            where: { device_key: deviceKey },
            include: {
                devices_values: {
                    orderBy: { timestamp: 'asc' },
                },
            },
        });

        console.log(`Device fetched: ${JSON.stringify(device)}`);

        if (!device) {
            throw new Error('Device not found');
        }

        const values = device.devices_values.map(value => parseFloat(value.value));
        const timestamps = device.devices_values.map(value => value.timestamp.toISOString());
        const unit = device.unit;
        const name = device.device_name;

        console.log(`Values: ${values}, Timestamps: ${timestamps}, Unit: ${unit}, Name: ${name}`); // Log

        return { values, timestamps, unit, name };
    } catch (error) {
        console.error('Erreur lors de la récupération des données du device :', error);
        throw error;
    }
};

// N'oubliez pas de fermer la connexion Prisma lorsque vous avez terminé
export const disconnectPrisma = async () => {
    await prisma.$disconnect();
};