import { Triangle } from 'lucide-react';
import React from 'react';
import { motion } from 'framer-motion';
import ShinyText from './shiny';
import { Badge } from "@/components/ui/badge"

interface TransunionScoreProps {
    score: number;
}

const TransunionScore: React.FC<TransunionScoreProps> = ({ score }) => {
    const getArrowPosition = () => {
        if (score < 300) return '0%';
        if (score > 1000) return '100%';
        return `${((score - 300) / 700) * 100}%`;
    };

    return (
        <div className="flex flex-col items-start -mb-4 3xl:mb-2">
            <Badge className="text-xs bg-neutral-800 border border-neutral-700 hover:bg-neutral-800"><ShinyText text="Score d'efficacité énergétique" disabled={false} speed={3} /></Badge>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="flex justify-center items-start"
            >
                <p className="text-5xl font-bold 3xl:text-6xl">{score}</p>
            </motion.div>
            <div className="relative w-full mt-2">
                {/* Animated Arrow */}
                <motion.div 
                    className="absolute top-0 flex flex-col -mt-2 items-center transform z-10"
                    animate={{ left: getArrowPosition() }}
                    transition={{ 
                        type: "easeInOut",
                        duration: 0.5
                    }}
                >
                    <Triangle className="w-3 h-3 fill-white transform rotate-180" />
                    <div className="w-1 h-10 bg-white rounded-xl"></div>
                </motion.div>

                <div className="w-full absolute top-0 h-8 rounded-xl mt-2 z-0 blur-2xl opacity-45"
                    style={{
                        background: 'linear-gradient(to right, #ff908f, #ffdd5b, #61baf8, #8cf470)'
                    }}
                ></div>

                {/* Score bars */}
                <div className="w-full flex justify-center items-center z-10">
                    <div className="w-1/2 h-8 bg-gradient-to-r from-[#ff908f] to-[#ffdd5b] rounded-xl mt-2 relative"></div>
                    <div className="w-1/2 flex justify-center items-center">
                        <div className="w-full h-8 bg-gradient-to-r from-[#ffdd5b] to-[#61baf8] rounded-xl -ml-2 mt-2 relative"></div>
                        <div className="w-full h-8 bg-gradient-to-r from-[#61baf8] to-[#8cf470] rounded-xl -ml-2 mt-2 relative"></div>
                    </div>
                </div>

                {/* Score labels */}
                <div className="w-full flex justify-center mt-1 text-gray-500 text-sm items-center">
                    <p className="w-1/2 h-8 rounded-xl relative">300</p>
                    <div className="w-1/2 flex justify-center items-center">
                        <p className="w-full h-8 rounded-xl -ml-2 relative">640</p>
                        <p className="w-full h-8 rounded-xl -ml-2 relative">810</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransunionScore;