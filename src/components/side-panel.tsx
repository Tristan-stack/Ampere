import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    PlugZap,
    Wind,
    Scroll
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import EnergyPerformanceBar from './energy-bar';
import TrendComparison from './trend-comparison';
import DateSelector from './date-selector';
import { ScrollArea, ScrollBar } from './ui/scroll-area';

type SidePanelProps = {
    isVisible: boolean;
    onClose: () => void;
    onToggle: () => void;
};

const containerVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: { x: '0%', opacity: 1 },
    exit: { x: '100%', opacity: 0 }
};

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

const SidePanel: React.FC<SidePanelProps> = ({ isVisible, onClose, onToggle }) => {
    const [width, setWidth] = useState(300); // Initial width of the side panel
    const [isResizing, setIsResizing] = useState(false);
    const [consumption, setConsumption] = useState<number | null>(null);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === 'd') {
                event.preventDefault();
                onToggle();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onToggle]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsResizing(true);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isResizing) {
            setWidth(window.innerWidth - e.clientX);
        }
    };

    const handleMouseUp = () => {
        setIsResizing(false);
    };

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    useEffect(() => {
        const fetchConsumption = async () => {
            try {
                const response = await fetch('/api/getDeviceDataByKey', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        device_key: '9b97f5da-0328-42ac-94c4-d9f0b673e5e0',
                    }),
                });
                const data = await response.json();
                setConsumption(data.values);
            } catch (error) {
                console.error('Erreur lors de la récupération des données du device :', error);
            }
        };
        fetchConsumption();
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-50"
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={onClose}
                >
                    <motion.div
                        className="my-4 p-5 mr-4 rounded-lg shadow-lg relative overflow-y-auto bg-[#18181b]"
                        style={{ width, minWidth: 350, maxWidth: 1000 }}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ type: 'tween', duration: 0.3 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className="absolute top-0 left-0 h-full w-2 cursor-ew-resize"
                            onMouseDown={handleMouseDown}
                        />
                        <ScrollArea className="h-[99.5%] w-full">
                            <motion.div
                                className="relative flex flex-col space-y-6 h-full"
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                variants={{
                                    visible: {
                                        transition: {
                                            staggerChildren: 0.1
                                        }
                                    }
                                }}
                            >
                                {/* Header */}
                                <motion.div className="w-full flex justify-between" variants={itemVariants}>
                                    <div className="space-y-1">
                                        <h2 className="text-3xl uppercase">Périodes</h2>
                                    </div>

                                    <div className="space-x-2">
                                        <Button
                                            onClick={onClose}
                                            className="p-2 border rounded duration-200 w-fit h-fit"
                                            variant={'secondary'}
                                        >
                                            <X className='w-4 h-4' />
                                        </Button>
                                    </div>
                                </motion.div>

                                {/* Current Consumption */}
                                <motion.div className="w-full space-y-6" variants={itemVariants}>
                                    <div>
                                        <p className="text-sm font-extralight text-white/70">
                                            Consommation cette semaine
                                        </p>
                                        <div className="flex items-end space-x-1">
                                            <div className="flex items-center space-x-1">
                                                <PlugZap size={40} />
                                                <p className="text-4xl font-extralight">{consumption !== null ? `${consumption} kWh` : 'Chargement...'}</p>
                                            </div>
                                            <TrendComparison current={consumption || 0} previous={18} type={'value'} unit='kWh' />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-extralight text-white/70">
                                            Émissions de carbone (approx.)
                                        </p>
                                        <div className="flex items-center space-x-1">
                                            <Wind size={30} />
                                            <p className="text-2xl font-extralight">
                                                {consumption !== null ? `${(consumption * 50).toLocaleString()} gCO₂` : 'Chargement...'}
                                            </p>
                                        </div>
                                    </div>
                                    <EnergyPerformanceBar value={80} />
                                </motion.div>
                                <motion.div className='h-full overflow-hidden' variants={itemVariants}>
                                    <DateSelector width={width} />
                                </motion.div>
                            </motion.div>
                        </ScrollArea>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SidePanel;