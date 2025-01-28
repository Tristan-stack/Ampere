'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TypewriterTextProps {
    text: string | undefined
    className?: string
    onComplete?: () => void
}

export function TypewriterText({ text = '', className = '', onComplete }: TypewriterTextProps) {
    const [displayedChars, setDisplayedChars] = useState<string[]>([])

    useEffect(() => {
        if (!text) return

        if (displayedChars.length < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedChars((prev) => {
                    const nextChar = text[prev.length];
                    return nextChar !== undefined ? [...prev, nextChar] : prev;
                });
            }, 30)
            return () => clearTimeout(timeout)
        }
    }, [displayedChars, text])

    useEffect(() => {
        if (!text) return

        if (displayedChars.length === text.length) {
            onComplete?.()
        }
    }, [displayedChars.length, text.length, onComplete])

    return (
        <span className={className}>
            <AnimatePresence mode="popLayout">
                {displayedChars.map((char, index) => (
                    <motion.span
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.75 }}
                    >
                        {char}
                    </motion.span>
                ))}
            </AnimatePresence>
        </span>
    )
} 