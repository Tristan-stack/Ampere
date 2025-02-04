import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userEmail } = body;

    if (!userEmail || typeof userEmail !== 'string') {
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

    const batimentConfig = await prisma.batimentConfig.findUnique({
      where: { userId: user.id },
    });

    if (!batimentConfig) {
      return NextResponse.json(
        { message: "Aucune configuration trouvée pour cet utilisateur." },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { config: batimentConfig.config },
      { status: 200 }
    );

  } catch (error) {
    console.error("Erreur lors de la récupération de la configuration :", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 