import { PrismaClient } from '@prisma/client'
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
        return NextResponse.json(
            { error: "Email requis" },
            { status: 400 }
        )
    }

    try {
        const user = await prisma.user.findUnique({
            where: { emailAddress: email },
            select: { role: true }
        })

        if (!user) {
            return NextResponse.json(
                { role: "étudiant" }, // Par défaut
                { status: 200 }
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