import { NextRequest, NextResponse } from 'next/server';
import { getDeviceDataByKey, disconnectPrisma } from '@/lib/data-extract';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { device_key, from, to } = body;

        if (!device_key || !from || !to) {
            return NextResponse.json({
                values: [],
                timestamps: [],
                error: 'Paramètres manquants'
            });
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

        return NextResponse.json(formattedData);
    } catch (error) {
        console.error('Erreur API:', error);
        // Toujours retourner un objet JSON valide
        return NextResponse.json({
            values: [],
            timestamps: [],
            error: error instanceof Error ? error.message : 'Erreur inconnue'
        });
    } finally {
        await prisma.$disconnect();
    }
}