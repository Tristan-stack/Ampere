// SidePanel.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Calendar, Clock, Euro, X } from 'lucide-react';
import ProgressBorder from '@/components/progress-border';
import TabsDemo from '@/components/TabsDemo';

type SidePanelProps = {
    isVisible: boolean;
    onClose: () => void;
};

const containerVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: { x: '0%', opacity: 1 },
    exit: { x: '100%', opacity: 0 },
};

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
};

const SidePanel: React.FC<SidePanelProps> = ({ isVisible, onClose }) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex justify-end"
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={onClose}
                >
                    <motion.div
                        className="w-1/4 h-[95vh] my-auto p-6 mr-4 rounded-lg shadow-lg relative bg-cover bg-center overflow-y-auto"
                        style={{ backgroundImage: `url('/img/Gradient2.jpg')` }}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ type: 'tween', duration: 0.3 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black opacity-10 rounded-lg"></div>

                        {/* Content */}
                        <div className="relative flex flex-col space-y-10 z-10 h-full">
                            {/* Header */}
                            <div className="w-full flex justify-between">
                                <div className="space-y-2">
                                    <h2 className="text-3xl uppercase">Calendar</h2>
                                    <p className="text-sm font-thin text-white/80">
                                        Automatic Global Statistics
                                    </p>
                                </div>

                                <div className="space-x-2">
                                    <button className="mb-4 p-2 bg-white/20 text-white border border-gray-300/50 rounded hover:bg-white hover:text-sidebar duration-200 ">
                                        <Clock />
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="p-2 border border-white rounded bg-white text-sidebar duration-200 "
                                    >
                                        <X />
                                    </button>
                                </div>
                            </div>

                            {/* Statistics */}
                            <div className="w-full flex justify-between items-end ">
                                <div className="space-y-4">
                                    <p className="text-sm font-extralight text-white/80">
                                        Paid amount :
                                    </p>
                                    <div className="flex items-center">
                                        <Euro size={40} />
                                        <p className="text-5xl font-extralight">12,340</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-sm font-extralight text-white/80">
                                        Previous month :
                                    </p>
                                    <div className="flex items-center">
                                        <Euro size={14} />
                                        <p className="text-sm font-light text-white">14,723</p>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center justify-center ">
                                    <ProgressBorder percentage={83} />
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="w-full flex-1">
                                <TabsDemo />
                            </div>

                            {/* Last Div */}
                            <div className="w-full flex justify-between">
                                <button className='flex justify-center items-center p-4 border border-white rounded-xl bg-white text-sidebar duration-200 '><Calendar/>Check the calendar</button>
                                <button className='flex justify-center items-center p-4 bg-white/20 text-white border border-gray-300/50 rounded-xl hover:bg-white hover:text-sidebar duration-200 '><Calculator/>Calculate </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SidePanel;