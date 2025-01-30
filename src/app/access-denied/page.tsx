"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function AccessDenied() {
    const router = useRouter()

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center">
            <div className="text-center space-y-6">
                <h1 className="text-4xl font-bold text-red-500">Accès Refusé</h1>
                <p className="text-xl text-neutral-400">
                    Vous n'avez pas les permissions nécessaires pour accéder à cette page.
                </p>
                <Button 
                    onClick={() => router.push('/dashboard')}
                    className="mt-4"
                >
                    Retourner au tableau de bord
                </Button>
            </div>
        </div>
    )
} 