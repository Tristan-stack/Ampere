import { PrismaClient } from '@prisma/client'
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                emailAddress: true,
                firstName: true,
                lastName: true,
                role: true,
                updatedAt: true,
            }
        })

        const formattedUsers = users.map(user => ({
            id: user.id,
            email: user.emailAddress,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            lastLogin: user.updatedAt.toISOString(),
        }))

        return NextResponse.json(formattedUsers)
    } catch (error) {
        console.error('Erreur Prisma:', error)
        return NextResponse.json({ error: "Erreur lors de la récupération des utilisateurs" }, { status: 500 })
    } finally {
        await prisma.$disconnect()
    }
} 