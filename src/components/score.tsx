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
        <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-2">
                <div className="text-sm font-medium">
                    Score : {clampedScore.toFixed(1)}/10
                </div>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <Info className="w-3 h-3 text-zinc-400" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[250px] text-xs">
                            <p>Ce score compare la consommation actuelle avec celle de la semaine précédente :</p>
                            <ul className="list-disc ml-4 mt-1">
                                <li>10/10 : Réduction de 20% ou plus</li>
                                <li>5/10 : Consommation stable</li>
                                <li>0/10 : Augmentation de 20% ou plus</li>
                            </ul>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <div className="relative h-1.5 w-48">
                <motion.div
                    className="absolute top-0 z-10"
                    animate={{ left: getArrowPosition() }}
                    transition={{ type: "spring", stiffness: 100 }}
                    style={{ color: getScoreColor() }}
                >
                    <Triangle className="w-2 h-2 fill-current transform rotate-180" />
                </motion.div>

                <div className="w-full h-1.5 rounded-full bg-gradient-to-r from-[#ff908f] via-[#ffdd5b] to-[#8cf470]" />
            </div>
        </div>
    );
};

export default TransunionScore;