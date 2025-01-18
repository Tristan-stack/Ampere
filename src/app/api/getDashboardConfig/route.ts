import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userEmail } = body;

    // Vérifier que l'email est fourni et est une chaîne de caractères
    if (!userEmail || typeof userEmail !== 'string') {
      return NextResponse.json(
        { error: 'Données invalides ou utilisateur manquant.' },
        { status: 400 }
      );
    }

    // Trouver l'utilisateur par email
    const user = await prisma.user.findUnique({
      where: { emailAddress: userEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable." },
        { status: 404 }
      );
    }

    // Récupérer la configuration du dashboard de l'utilisateur
    const dashboardConfig = await prisma.dashboardConfig.findUnique({
      where: { userId: user.id },
    });

    if (!dashboardConfig) {
      return NextResponse.json(
        { message: "Aucune configuration trouvée pour cet utilisateur." },
        { status: 200 }
      );
    }

    // Retourner la configuration en réponse
    return NextResponse.json(
      { config: dashboardConfig.config },
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