"use client"

import { useEffect, useState } from 'react'
import { motion, stagger } from 'framer-motion'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Rainbow from "@/components/ui/rainbow"
import { SignIn } from '@clerk/nextjs'
import { GlowingEffect } from '@/components/glowing-effect'
import ShinyText from '@/components/shiny'

export default function Page() {
    const [isClient, setIsClient] = useState(false)
    const letters = "AMPERE".split("")

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsClient(true)
        }, 1800) // Délai pour laisser l'animation des lettres se terminer

        return () => clearTimeout(timer)
    }, [])

    return (
        <div className={cn("flex flex-col gap-6 h-screen w-full justify-center items-center bg-neutral-950 overflow-hidden relative")}>
            <motion.div
                className="absolute top-8 left-8 flex items-center gap-2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 2 }}
            >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-black ">
                    <Rainbow hovered={false} />
                </div>
                <span className="text-xl font-semibold mb-1">Ampere</span>
                <span className="text-xs text-neutral-400 font-bold">IUT de Haguenau</span>
            </motion.div>
            <div className='h-screen w-screen bg-neutral-100 blur-xl absolute top-0 left-0 translate-y-1/2 mt-[30rem]'>



            </div>
            <div
                className="absolute bottom-10 left-0 font-bold text-neutral-900 opacity-30 whitespace-nowrap select-none pointer-events-none"
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

            <motion.div 
                className="relative list-none"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.8 }}
            >
                <div className="relative rounded-xl border p-[2px]  md:p-[3px]">
                    <GlowingEffect
                        spread={40}
                        glow={true}
                        disabled={false}
                        proximity={700}
                        inactiveZone={0.01}
                    />
                    <Card className="relative overflow-hidden border-0.75 dark:shadow-[0px_0px_27px_0px_#2D2D2D]">
                        <CardContent className="grid p-0 md:grid-cols-2">
                            {isClient && <SignIn />}
                            <div className="flex flex-col justify-center p-10 gap-12 bg-neutral-950/30">
                                <div className="space-y-6">
                                    <h2 className="text-4xl font-bold text-neutral-300 tracking-tight">
                                        AMPERE
                                    </h2>
                                    <p className="text-neutral-500 text-sm font-semibold tracking-wider uppercase">
                                        Dashboard de gestion énergétique
                                        <br />
                                        IUT de Haguenau
                                    </p>
                                </div>
                                
                                <div className="space-y-8">
                                    <div>
                                        <p className="text-xs text-neutral-400 uppercase tracking-[0.2em]">
                                            Consommation
                                        </p>
                                        <p className="text-xs text-neutral-400 uppercase tracking-[0.2em]">
                                            Production
                                        </p>
                                        <p className="text-xs text-neutral-400 uppercase tracking-[0.2em]">
                                            Analyses
                                        </p>
                                    </div>
                                    
                                    <div>
                                        <p className="text-[10px] text-neutral-500 tracking-wider">
                                            Version 1.0.0
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </motion.div>
            <div className="flex flex-col absolute bottom-8 gap-2">
                <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8 }}
                className="text-xs text-neutral-400 font-bold">
                    Développé par <span className="text-neutral-300"><a href="https://github.com/wav-rover" target="_blank" rel="noopener noreferrer">Deveney Jérémy</a></span> et <span className="text-neutral-300"><a href="https://github.com/Tristan-stack" target="_blank" rel="noopener noreferrer">Gerber Tristan</a></span>
                </motion.p>
            </div>
        </div>



    )
}

