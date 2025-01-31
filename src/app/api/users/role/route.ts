import { PrismaClient } from '@prisma/client'
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    console.log('API Role - Email reçu:', email)

    if (!email) {
        console.log('API Role - Email manquant')
        return NextResponse.json({ error: "Email requis" }, { status: 400 })
    }

    try {
        const user = await prisma.user.findUnique({
            where: { emailAddress: email },
            select: { role: true }
        })

        console.log('API Role - Utilisateur trouvé:', user)

        if (!user) {
            // Au lieu de renvoyer une erreur, on renvoie un rôle par défaut
            console.log('API Role - Utilisateur non trouvé, renvoi du rôle par défaut')
            return NextResponse.json({ role: "étudiant" })
        }

        console.log('API Role - Rôle renvoyé:', user.role)
        return NextResponse.json({ role: user.role })
    } catch (error) {
        console.error('API Role - Erreur:', error)
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    } finally {
        await prisma.$disconnect()
    }
} 