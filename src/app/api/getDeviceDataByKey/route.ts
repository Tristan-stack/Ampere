import { NextRequest, NextResponse } from 'next/server';
import { getDeviceDataByKey, disconnectPrisma } from '@/lib/data-extract';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    console.log('API Route: Received POST request');

    try {
        const { device_key, from, to } = await req.json();

        console.log(`Received device_key: ${device_key}`);

        if (!device_key) {
            console.log('Missing device_key in request body');
            return NextResponse.json({ message: 'Missing device_key' }, { status: 400 });
        }

        const values = await prisma.devices_values.findMany({
            where: {
                device_key: device_key,
                timestamp: {
                    gte: new Date(from * 1000),
                    lte: new Date(to * 1000)
                }
            },
            orderBy: {
                timestamp: 'asc'
            }
        });

        const formattedData = {
            values: values.map(v => parseFloat(v.value)),
            timestamps: values.map(v => v.timestamp.toISOString()),
        };

        console.log(`Data fetched: ${JSON.stringify(formattedData)}`);

        return NextResponse.json(formattedData, { status: 200 });
    } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    } finally {
        await disconnectPrisma();
    }
}