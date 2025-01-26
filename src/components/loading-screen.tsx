'use client';
import React from 'react';
import { useData } from '@/app/(protected)/context/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import Rainbow from "@/components/ui/rainbow";
import CountUp from './countup';

export const LoadingScreen = () => {
    const { isLoading, loadingProgress } = useData();
    const [shouldExit, setShouldExit] = React.useState(false);

    React.useEffect(() => {
        if (loadingProgress === 100) {
            const timer = setTimeout(() => {
                setShouldExit(true);
            }, 500); // Attendre 500ms après 100%
            return () => clearTimeout(timer);
        }
    }, [loadingProgress]);

    return (
        <AnimatePresence mode="wait">
            {isLoading && !shouldExit && (
                <motion.div
                    className="fixed inset-0 bg-neutral-950 z-50 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ 
                        y: '-100%',
                        transition: {
                            duration: 0.8,
                            ease: [0.76, 0, 0.24, 1]
                        }
                    }}
                >
                    <motion.div
                        className="absolute top-8 left-8 flex items-center gap-2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="flex items-center justify-center rounded-lg bg-black p-2">
                            <Rainbow hovered={false} />
                        </div>
                        <span className="text-xl font-semibold">
                            Ampere
                        </span>
                    </motion.div>
                    <motion.div 
                        className="flex items-center justify-center"
                        exit={{ 
                            scale: 0.8, 
                            opacity: 0,
                            transition: { 
                                duration: 0.4,
                                ease: [0.76, 0, 0.24, 1]
                            }
                        }}
                    >
                        <CountUp 
                            to={loadingProgress}
                            from={0}
                            duration={0.5}
                            className="text-6xl font-bold text-white"
                            onEnd={() => {
                                if (loadingProgress === 100) {
                                    setTimeout(() => {
                                        setShouldExit(true);
                                    }, 300);
                                }
                            }}
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}; 