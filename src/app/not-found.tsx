"use client"

import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Rainbow from "@/components/ui/rainbow"
import { motion } from "framer-motion"
import { UserButton } from '@clerk/nextjs'

export default function NotFound() {
    const router = useRouter()
    const [isClient, setIsClient] = useState(false)
    const letters = "AMPERE".split("")

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsClient(true)
        }, 1800)

        return () => clearTimeout(timer)
    }, [])
    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center">
            <motion.div
                className="absolute top-8 left-8 flex items-center gap-2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
            >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-black">
                    <Rainbow hovered={false} />
                </div>
                <span className="text-xl font-semibold mb-1">Ampere</span>
                <span className="text-xs text-neutral-400 font-bold">IUT de Haguenau</span>
            </motion.div>
            <div
                className="absolute bottom-10 left-0 z-0 font-bold text-neutral-900 opacity-30 whitespace-nowrap select-none pointer-events-none"
                style={{
                    fontSize: '25vw',
                    width: '100%',
                    textAlign: 'center',
                    transform: 'translateY(10%)',
                    lineHeight: '1',
                }}
            >
                <motion.div
                    className="flex justify-center"
                    initial="hidden"
                    animate="visible"
                    variants={{
                        visible: {
                            transition: {
                                staggerChildren: 0.2
                            }
                        }
                    }}
                >
                    {letters.map((letter, index) => (
                        <motion.span
                            key={index}
                            variants={{
                                hidden: { opacity: 0, y: 50 },
                                visible: { opacity: 1, y: 0 }
                            }}
                            transition={{ duration: 0.5 }}
                        >
                            {letter}
                        </motion.span>
                    ))}
                </motion.div>
            </div>
            <div className="text-center z-10 mb-16">
                <div className='relative w-screen'>
                    <h1 className="text-9xl font-bold text-neutral-100">404</h1>
                    <span className='text-neutral-400 absolute top-0 translate-x-1/2 ml-8 mt-4 font-bold'>*Page non trouvée</span>
                </div>
                <p className="text-md text-neutral-400">
                    La page que vous recherchez n'existe pas.
                </p>
                <div className='absolute bottom-8 left-0 w-full'>
                <Button
                    onClick={() => router.push('/batiment')}
                    className=""
                >
                    Retourner au tableau de bord
                </Button>
                </div>
            </div>
            <div className='absolute bottom-4 left-4'>
                <UserButton appearance={{
                    elements: {
                        userButtonTrigger: "focus:shadow-none",
                        userButtonAvatarBox: "w-8 h-8 rounded-lg",
                        userButtonPopoverCard: "bg-white shadow-xl",
                    },
                    variables: {
                        colorPrimary: "#0000ff",
                        borderRadius: "0.5rem",
                    }
                }} />
            </div>
        </div>
    )
}