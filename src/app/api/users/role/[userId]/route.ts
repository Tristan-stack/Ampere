import { PrismaClient } from '@prisma/client'
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET(
    request: Request,
    { params }: { params: { userId: string } }
) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: params.userId },
            select: { role: true }
        })

        if (!user) {
            return NextResponse.json(
                { error: "Utilisateur non trouvé" },
                { status: 404 }
            )
        }

        return NextResponse.json({ role: user.role })
    } catch (error) {
        console.error('Erreur lors de la récupération du rôle:', error)
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        )
    } finally {
        await prisma.$disconnect()
    }
} 