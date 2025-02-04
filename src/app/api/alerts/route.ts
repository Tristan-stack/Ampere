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

        const alerts = await prisma.alert.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ alerts }, { status: 200 });
    } catch (error) {
        console.error("Erreur lors de la récupération des alertes :", error);
        return NextResponse.json(
            { error: "Erreur interne du serveur." },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

export async function POST(req: NextRequest) {
    try {
        const userEmail = req.headers.get('user-email');
        const body = await req.json();

        if (!userEmail) {
            return NextResponse.json(
                { error: "Utilisateur manquant." },
                { status: 400 }
            );
        }

        const { userEmail: _, ...alertData } = body;

        const user = await prisma.user.findUnique({
            where: { emailAddress: userEmail },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Utilisateur introuvable." },
                { status: 404 }
            );
        }

        try {
            const alert = await prisma.alert.create({
                data: {
                    ...alertData,
                    userId: user.id,
                    threshold: Number(alertData.threshold)
                }
            });

            return NextResponse.json({
                message: "Alerte créée avec succès.",
                alert: {
                    id: alert.id,
                    threshold: alert.threshold,
                    building: alert.building,
                    floor: alert.floor,
                    measureId: alert.measureId,
                    measureName: alert.measureName,
                    isActive: alert.isActive,
                    lastTriggered: alert.lastTriggered
                }
            });
        } catch (error) {
            console.error("Erreur Prisma:", error);
            return NextResponse.json(
                { error: "Erreur lors de la création de l'alerte dans la base de données." },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("Erreur lors de la création de l'alerte:", error);
        return NextResponse.json(
            { error: "Erreur interne du serveur." },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const alertId = searchParams.get('id');
        const userEmail = req.headers.get('user-email');

        if (!alertId || !userEmail) {
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

        await prisma.alert.delete({
            where: {
                id: alertId,
                userId: user.id
            }
        });

        return NextResponse.json(
            { message: "Alerte supprimée avec succès." },
            { status: 200 }
        );
    } catch (error) {
        console.error("Erreur lors de la suppression de l'alerte:", error);
        return NextResponse.json(
            { error: "Erreur interne du serveur." },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const alertId = searchParams.get('id');
        const body = await req.json();
        const { userEmail, ...updateData } = body;

        if (!alertId || !userEmail) {
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

        const alert = await prisma.alert.update({
            where: {
                id: alertId,
                userId: user.id
            },
            data: updateData
        });

        return NextResponse.json({
            message: "Alerte mise à jour avec succès.",
            alert
        }, { status: 200 });
    } catch (error) {
        console.error("Erreur lors de la mise à jour de l'alerte:", error);
        return NextResponse.json(
            { error: "Erreur interne du serveur." },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
} 