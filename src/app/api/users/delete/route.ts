import { PrismaClient } from '@prisma/client'
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function DELETE(request: Request) {
    try {
        const { userId } = await request.json()

        await prisma.user.delete({
            where: { id: userId }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Erreur lors de la suppression:', error)
        return NextResponse.json(
            { error: "Erreur lors de la suppression" },
            { status: 500 }
        )
    } finally {
        await prisma.$disconnect()
    }
} 