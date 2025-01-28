import { PrismaClient } from '@prisma/client'
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function PUT(request: Request) {
    try {
        const { userId, newRole } = await request.json()

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role: newRole }
        })

        return NextResponse.json(updatedUser)
    } catch (error) {
        console.error('Erreur lors de la mise à jour du rôle:', error)
        return NextResponse.json(
            { error: "Erreur lors de la mise à jour du rôle" },
            { status: 500 }
        )
    } finally {
        await prisma.$disconnect()
    }
} 