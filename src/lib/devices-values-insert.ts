import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function insertDevicesValuesFromCSV(filePath: string) {
    // Résoudre le chemin absolu du fichier
    const absolutePath = path.resolve(filePath);

    // Vérifier si le fichier existe
    if (!fs.existsSync(absolutePath)) {
        console.error(`Le fichier ${absolutePath} n'a pas été trouvé.`);
        return;
    }

    const devicesValues: any[] = [];

    // Lire le fichier CSV
    fs.createReadStream(absolutePath)
        .pipe(csvParser())
        .on('data', (row) => {
            try {
                // Convertir le timestamp Unix en millisecondes
                const timestamp = new Date(parseInt(row.timestamp) * 1000);
                if (isNaN(timestamp.getTime())) {
                    console.error(`Timestamp invalide pour la ligne:`, row);
                    return;
                }

                devicesValues.push({
                    device_key: row.device_key,
                    value: row.value,
                    unit: row.unit,
                    quality: row.quality,
                    timestamp: timestamp,
                });
            } catch (error) {
                console.error(`Erreur lors du traitement de la ligne:`, row);
            }
        })
        .on('end', async () => {
            console.log(`Total des valeurs à insérer : ${devicesValues.length}`);

            try {
                // Vérifier d'abord que tous les device_key existent dans la table Devices
                const uniqueDeviceKeys = [...new Set(devicesValues.map(dv => dv.device_key))];
                const existingDevices = await prisma.devices.findMany({
                    where: {
                        device_key: {
                            in: uniqueDeviceKeys
                        }
                    },
                    select: { device_key: true }
                });

                const existingDeviceKeys = new Set(existingDevices.map(d => d.device_key));
                const invalidDeviceKeys = uniqueDeviceKeys.filter(key => !existingDeviceKeys.has(key));

                if (invalidDeviceKeys.length > 0) {
                    console.error('Certains device_key n\'existent pas dans la table Devices:', invalidDeviceKeys);
                    const rejectedCount = devicesValues.filter(dv => invalidDeviceKeys.includes(dv.device_key)).length;
                    console.log(`Nombre de valeurs rejetées à cause de device_key invalides : ${rejectedCount}`);
                    return;
                }

                let insertedCount = 0;
                let skippedCount = 0;

                // Insérer les valeurs par lots de 100 pour éviter de surcharger la base de données
                const batchSize = 100;
                for (let i = 0; i < devicesValues.length; i += batchSize) {
                    const batch = devicesValues.slice(i, i + batchSize);
                    const result = await prisma.devices_values.createMany({
                        data: batch,
                        skipDuplicates: true,
                    });
                    insertedCount += result.count;
                    skippedCount += (batch.length - result.count);
                }

                console.log('=== Rapport d\'insertion ===');
                console.log(`Total des valeurs traitées : ${devicesValues.length}`);
                console.log(`Valeurs insérées avec succès : ${insertedCount}`);
                console.log(`Valeurs ignorées (doublons) : ${skippedCount}`);
                console.log('==========================');
            } catch (error) {
                console.error('Erreur lors de l\'insertion des valeurs:', error);
            } finally {
                await prisma.$disconnect();
            }
        });
}

// Appeler la fonction avec le chemin du fichier CSV à la racine du projet
insertDevicesValuesFromCSV(path.join(process.cwd(), 'devices-values.csv'));
