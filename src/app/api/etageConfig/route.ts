import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const userEmail = req.headers.get('user-email');

        if (!userEmail) {
            return NextResponse.json(
                { error: "Utilisateur manquant." },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { emailAddress: userEmail },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Utilisateur introuvable." },
                { status: 404 }
            );
        }

        const configs = await prisma.etageConfiguration.findMany({
            where: { userId: user.id },
            orderBy: { updatedAt: 'desc' }
        });

        return NextResponse.json({ configs }, { status: 200 });
    } catch (error) {
        console.error("Erreur lors de la récupération des configurations:", error);
        return NextResponse.json(
            { error: "Erreur interne du serveur." },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const userEmail = req.headers.get('user-email');
        const { selectedMeasures, isDefault } = await req.json();

        if (!userEmail) {
            return NextResponse.json(
                { error: "Utilisateur manquant." },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { emailAddress: userEmail },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Utilisateur introuvable." },
                { status: 404 }
            );
        }

        // Si isDefault est true, désactiver les autres configurations par défaut
        if (isDefault) {
            await prisma.etageConfiguration.updateMany({
                where: {
                    userId: user.id,
                    isDefault: true
                },
                data: { isDefault: false }
            });
        }

        const config = await prisma.etageConfiguration.create({
            data: {
                userId: user.id,
                selectedMeasures,
                isDefault
            }
        });

        return NextResponse.json({
            message: "Configuration sauvegardée avec succès.",
            config
        }, { status: 200 });
    } catch (error) {
        console.error("Erreur lors de la sauvegarde de la configuration:", error);
        return NextResponse.json(
            { error: "Erreur interne du serveur." },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const configId = searchParams.get('id');
        const userEmail = req.headers.get('user-email');

        if (!configId || !userEmail) {
            return NextResponse.json(
                { error: "Paramètres manquants." },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { emailAddress: userEmail },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Utilisateur introuvable." },
                { status: 404 }
            );
        }

        await prisma.etageConfiguration.delete({
            where: {
                id: configId,
                userId: user.id
            }
        });

        return NextResponse.json(
            { message: "Configuration supprimée avec succès." },
            { status: 200 }
        );
    } catch (error) {
        console.error("Erreur lors de la suppression de la configuration:", error);
        return NextResponse.json(
            { error: "Erreur interne du serveur." },
            { status: 500 }
        );
    }
} 