import { NextRequest, NextResponse } from 'next/server';
import { getDeviceDataByKey, disconnectPrisma } from '@/lib/data-extract';

export async function POST(request: NextRequest) {
    console.log('API Route: Received POST request');

    try {
        const body = await request.json();
        const { device_key } = body;

        console.log(`Received device_key: ${device_key}`);

        if (!device_key) {
            console.log('Missing device_key in request body');
            return NextResponse.json({ message: 'Missing device_key' }, { status: 400 });
        }

        const data = await getDeviceDataByKey(device_key);
        console.log(`Data fetched: ${JSON.stringify(data)}`);

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error('Error in API handler:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    } finally {
        await disconnectPrisma();
    }
}