import { Triangle, Info } from 'lucide-react';
import React from 'react';
import { motion } from 'framer-motion';
import ShinyText from './shiny';
import { Badge } from "@/components/ui/badge"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface TransunionScoreProps {
    score: number;
}

const TransunionScore: React.FC<TransunionScoreProps> = ({ score }) => {
    console.log('Type de score reçu:', typeof score);
    console.log('Valeur brute du score:', score);

    // Limiter le score entre 0 et 10
    const clampedScore = Math.max(0, Math.min(10, score));

    // Position de la flèche basée sur une échelle de 0 à 10
    const getArrowPosition = () => {
        return `${(clampedScore / 10) * 100}%`;
    };

    // Déterminer la couleur en fonction du score
    const getScoreColor = () => {
        if (clampedScore < 3) return '#ff908f'; // Rouge pour mauvais
        if (clampedScore < 4) return '#ffdd5b'; // Jaune pour moyen-mauvais
        if (clampedScore < 6) return '#61baf8'; // Bleu pour neutre
        return '#8cf470'; // Vert pour bon
    };

    return (
        <div className="flex flex-col items-start -mb-4 3xl:mb-2">
            <div className="flex items-center gap-2">
                <Badge className="text-xs bg-neutral-800 border border-neutral-700 hover:bg-neutral-800">
                    <ShinyText text="Score d'efficacité énergétique" disabled={false} speed={3} />
                </Badge>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <Info className="w-4 h-4 text-neutral-400" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[300px]">
                            <p>Ce score compare la consommation actuelle avec celle de la semaine précédente :</p>
                            <ul className="list-disc ml-4 mt-2">
                                <li>10/10 : Réduction de 20% ou plus</li>
                                <li>5/10 : Consommation stable</li>
                                <li>0/10 : Augmentation de 20% ou plus</li>
                                <li>5/10 : Score neutre si données insuffisantes</li>
                            </ul>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="flex justify-center items-start"
            >
                <p className="text-5xl font-bold 3xl:text-6xl -mb-3">{clampedScore}</p>
            </motion.div>
            <div className="relative w-full mt-2">
                <motion.div
                    className="absolute top-0 flex flex-col -mt-2 items-center transform z-10"
                    animate={{ left: getArrowPosition() }}
                    transition={{ type: "spring", stiffness: 100 }}
                    style={{ color: getScoreColor() }}
                >
                    <Triangle className="w-3 h-3 fill-current transform rotate-180" />
                    <div className="w-1 h-10 bg-current rounded-xl"></div>
                </motion.div>

                <div className="w-full absolute top-0 h-8 rounded-xl mt-2 z-0 blur-2xl opacity-45"
                    style={{
                        background: 'linear-gradient(to right, #ff908f, #ffdd5b, #61baf8, #8cf470)'
                    }}
                ></div>

                <div className="w-full flex justify-center items-center z-10">
                    <div className="w-1/3 h-8 bg-gradient-to-r from-[#ff908f] to-[#ffdd5b] rounded-xl mt-2 relative"></div>
                    <div className="w-1/3 h-8 bg-gradient-to-r from-[#ffdd5b] to-[#61baf8] rounded-xl -ml-2 mt-2 relative"></div>
                    <div className="w-1/3 h-8 bg-gradient-to-r from-[#61baf8] to-[#8cf470] rounded-xl -ml-2 mt-2 relative"></div>
                </div>

                <div className="w-full flex justify-between mt-1 text-gray-500 text-sm">
                    <span>0</span>
                    <span>5</span>
                    <span>10</span>
                </div>
            </div>
        </div>
    );
};

export default TransunionScore;