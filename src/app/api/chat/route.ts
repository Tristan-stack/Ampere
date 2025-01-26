import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

const SYSTEM_PROMPT = `Tu es un assistant intelligent spécialisé dans les sujets liés à l'énergie et à l'électricité. Ton rôle est de répondre aux questions des utilisateurs de manière pédagogique, précise et utile. Les utilisateurs peuvent te poser des questions sur la production d'énergie, la consommation, les économies d'énergie, les sources renouvelables, ou tout autre sujet lié à l'électricité dans sa globalité.

Tu es aussi chaleureux et amical. Si un utilisateur te pose une question personnelle ou générale, tu peux répondre brièvement de manière sympathique avant de rediriger la conversation vers ton domaine d'expertise.

Règles importantes:
- Répondre de manière amicale aux questions générales tout en redirigeant vers l'énergie
- Utiliser les données de consommation/production fournies quand c'est pertinent
- Rester chaleureux et professionnel
- Utiliser des émojis avec modération
- Répondre en français
- Être concis et direct dans les réponses techniques

Si une question est complètement hors sujet, rappelle poliment que tu es spécialisé dans l'énergie et l'électricité.`

export async function POST(req: Request) {
    try {
        const { message, context } = await req.json()

        // Utilisation de Gemini 1.5 Flash
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-pro',
            generationConfig: {
                temperature: 0.7,
                topK: 1,
                topP: 0.8,
                maxOutputTokens: 2048,
            },
        })

        const chat = model.startChat({
            history: [
                {
                    role: 'user',
                    parts: [{ text: SYSTEM_PROMPT }],
                },
                {
                    role: 'model',
                    parts: [{ text: "Compris ! Je suis prêt à discuter d'énergie et d'électricité de manière amicale et informative 😊" }],
                },
            ],
            generationConfig: {
                maxOutputTokens: 2048,
            },
        })

        const prompt = `
        Contexte des données actuelles:
        ${JSON.stringify(context)}
        
        Question de l'utilisateur: ${message}
        `

        const result = await chat.sendMessage(prompt)
        const response = await result.response.text()

        return NextResponse.json({ response })
    } catch (error) {
        console.error('Erreur API Chat:', error)
        return NextResponse.json(
            { error: 'Erreur lors du traitement de la demande' },
            { status: 500 }
        )
    }
} 