import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function insertDevicesFromCSV(filePath: string) {
    // Résoudre le chemin absolu du fichier
    const absolutePath = path.resolve(filePath);

    // Vérifier si le fichier existe
    if (!fs.existsSync(absolutePath)) {
        console.error(`Le fichier ${absolutePath} n'a pas été trouvé.`);
        return;
    }

    const devices: any[] = [];

    // Lire le fichier CSV
    fs.createReadStream(absolutePath)
        .pipe(csvParser())
        .on('data', (row) => {
            devices.push({
                device_key: row.device_key,
                name: row.name,
                unit: row.unit,
                device_id: row.device_id || null,
                device_name: row.device_name || null,
                address_ip: row.address_ip,
            });
        })
        .on('end', async () => {
            console.log(`Total devices to insert: ${devices.length}`);

            try {
                // Utiliser upsert pour éviter les doublons
                await prisma.$transaction(
                    devices.map((device) =>
                        prisma.devices.upsert({
                            where: { device_key: device.device_key },
                            update: device,
                            create: device,
                        })
                    )
                );
                console.log('All devices inserted successfully!');
            } catch (error) {
                console.error('Error inserting devices:', error);
            } finally {
                await prisma.$disconnect();
            }
        });
}

// Appeler la fonction avec le chemin du fichier CSV à la racine du projet
insertDevicesFromCSV(path.join(process.cwd(), 'devices-insert.csv'));