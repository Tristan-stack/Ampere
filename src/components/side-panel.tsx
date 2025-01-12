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
import { BounceLoader } from 'react-spinners';
import { doc } from 'prettier';

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
    const [width, setWidth] = useState(400); // Initial width of the side panel
    const [isResizing, setIsResizing] = useState(false);
    const [consumption, setConsumption] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const getCookie = (name: string) => {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i]?.trim();
            if (c?.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    };

    const fetchConsumption = async () => {
        setLoading(true);
        try {
            const savedRange = getCookie('dateRange');
            if (!savedRange) {
                console.warn('Pas de dateRange dans les cookies.');
                setConsumption(0);
                setLoading(false);
                return;
            }
            const parsedRange = JSON.parse(savedRange);
            const fromTime = new Date(parsedRange.from).getTime();
            const toTime = new Date(parsedRange.to).getTime();

            const response = await fetch('/api/getDeviceDataByKey', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    device_key: 'a869af7d-fb50-4754-b3a2-097035a1dc33'
                }),
            });

            const data = await response.json();
            console.log('API response:', data);

            const { values = [], timestamps = [] } = data;
            if (!Array.isArray(values) || !Array.isArray(timestamps)) {
                console.warn("Les tableaux values/timestamps sont manquants ou invalides.");
                setConsumption(0);
                setLoading(false);
                return;
            }

            // Combiner values et timestamps en un tableau exploitable
            const allRecords = timestamps.map((ts, i) => ({
                timestamp: ts,
                value: values[i]
            }));

            // Filtrer selon la plage de temps
            const filtered = allRecords.filter((rec) => {
                const recordTime = new Date(rec.timestamp).getTime();
                return recordTime >= fromTime && recordTime <= toTime;
            });

            console.log('filtered:', filtered);

            if (filtered.length < 2) {
                console.warn("Pas assez de données pour calculer.");
                setConsumption(0);
                setLoading(false);
                return;
            }

            // Calcul de la consommation
            let totalConsumption = 0;
            for (let i = 0; i < filtered.length - 1; i++) {
                const currentPowerKw = filtered[i]?.value ?? 0 / 1000;
                const startTime = new Date(filtered[i]?.timestamp).getTime();
                const endTime = new Date(filtered[i + 1]?.timestamp).getTime();
                const durationInHours = (endTime - startTime) / (1000 * 3600);
                totalConsumption += currentPowerKw * durationInHours;
            }

            setConsumption(totalConsumption);
        } catch (error) {
            console.error('Erreur lors de la récupération des données:', error);
            setConsumption(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConsumption();
    }, []);

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

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 bg-black bg-opacity-40 flex justify-end z-50"
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={onClose}
                >
                    <motion.div
                        className=" p-5 shadow-lg relative overflow-y-auto border-0 border-l bg-[#18181b]"
                        style={{ width, minWidth: 400, maxWidth: 1000 }}
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
                                                <PlugZap size={40} className='stroke-1' />
                                                <p className="text-4xl font-extralight">{loading ? <BounceLoader color='#00ff96' size={25} className='drop-shadow-[0_0_10px_rgba(47,173,121,1)]' /> : `${consumption?.toFixed(1)} kWh`}</p>
                                            </div>
                                            <TrendComparison current={consumption !== null ? parseFloat(consumption.toFixed(1)) : 0} previous={18} type={'value'} unit='kWh' />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-extralight text-white/70">
                                            Émissions de carbone (approx.)
                                        </p>
                                        <div className="flex items-center space-x-1">
                                            <Wind size={30} className='stroke-1' />
                                            <p className="text-2xl font-extralight">
                                                {loading ? <BounceLoader color='#00ff96' size={25} className='drop-shadow-[0_0_10px_rgba(47,173,121,1)]' /> : `${(consumption! * 50).toFixed(1).toLocaleString()} gCO₂`}
                                            </p>
                                        </div>
                                    </div>
                                    <EnergyPerformanceBar value={80} />
                                </motion.div>
                                <motion.div className='h-full overflow-hidden' variants={itemVariants}>
                                    <DateSelector width={width} onDateRangeChange={fetchConsumption} />
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