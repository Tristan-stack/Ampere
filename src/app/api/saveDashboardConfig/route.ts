import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { config, userEmail } = body;

    if (!config || typeof config !== 'object' || !userEmail) {
      return NextResponse.json(
        { error: 'Données invalides ou utilisateur manquant.' },
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

    const dashboardConfig = await prisma.dashboardConfig.upsert({
      where: { userId: user.id },
      update: { config },
      create: {
        userId: user.id,
        config,
      },
    });

    return NextResponse.json(
      { message: "Configuration sauvegardée avec succès.", dashboardConfig },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de la configuration :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}