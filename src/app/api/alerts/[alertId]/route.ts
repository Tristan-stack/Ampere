import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(
    req: NextRequest,
    { params }: { params: { alertId: string } }
) {
    try {
        const body = await req.json();
        const { userEmail, ...updateData } = body;

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

        const alert = await prisma.alert.update({
            where: {
                id: params.alertId,
                userId: user.id
            },
            data: updateData
        });

        return NextResponse.json(
            { message: "Alerte mise à jour avec succès.", alert },
            { status: 200 }
        );
    } catch (error) {
        console.error("Erreur lors de la mise à jour de l'alerte :", error);
        return NextResponse.json(
            { error: "Erreur interne du serveur." },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { alertId: string } }
) {
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

        await prisma.alert.delete({
            where: {
                id: params.alertId,
                userId: user.id
            }
        });

        return NextResponse.json(
            { message: "Alerte supprimée avec succès." },
            { status: 200 }
        );
    } catch (error) {
        console.error("Erreur lors de la suppression de l'alerte :", error);
        return NextResponse.json(
            { error: "Erreur interne du serveur." },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
} 