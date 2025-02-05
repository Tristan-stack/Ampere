import React from 'react';
import CountUp from "@/components/countup";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Euro, Info, ArrowUpLeft, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface EtageCostProps {
    totalConsumption: number; // En kWh, calculé par intégration de la puissance sur le temps
    pricePerKwh: number;
    onPriceChange: (price: number) => void;
    isExpanded: boolean;
    onToggleExpand: (event: React.MouseEvent) => void;
    isToolsExpanded?: boolean;
}

export const EtageCost: React.FC<EtageCostProps> = ({
    totalConsumption, 
    pricePerKwh,
    onPriceChange,
    isExpanded,
    onToggleExpand,
    isToolsExpanded = false
}) => {
    const [isResizing, setIsResizing] = React.useState(false);

    // Calcul direct du coût total
    const totalCost = totalConsumption * pricePerKwh;
    
    // Moyennes estimées
    const hourlyCost = totalCost / (24 * 30); // Moyenne sur un mois
    const dailyCost = totalCost / 30; // Moyenne sur un mois
    const monthlyCost = totalCost; // Coût total considéré comme mensuel

    const handlePriceChange = (value: string) => {
        const newPrice = parseFloat(value);
        if (!isNaN(newPrice) && newPrice >= 0) {
            onPriceChange(newPrice);
        }
    };

    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        
        setIsResizing(true);
        const timer = setTimeout(() => {
            setIsResizing(false);
        }, 150);
        return () => clearTimeout(timer);
    }, [isExpanded]);

    if (!isExpanded) {
        if (isToolsExpanded) {
            return (
                <div className="w-full h-full">
                    {!isResizing && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col h-full w-full p-4 px-0 bg-neutral-900 rounded-md"
                        >
                            <div className="flex items-center justify-between relative mb-4 px-4">
                                <div className="flex items-center gap-2">
                                    <h4 className="md:text-sm xl:text-lg  font-medium text-neutral-300 text-nowrap mt-1">Coût énergétique</h4>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onToggleExpand}
                                    className="bg-neutral-800 hover:bg-neutral-700 mx-4 px-1 py-1 3xl:px-2 3xl:py-2 h-auto absolute -top-3 -right-3"
                                >
                                    <ArrowUpLeft className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex flex-col space-y-4">
                                <div className="flex items-center gap-1 px-4">
                                    <Input
                                        type="number"
                                        value={pricePerKwh}
                                        onChange={(e) => handlePriceChange(e.target.value)}
                                        step="0.001"
                                        min="0"
                                        className="md:w-16 xl:w-24 text-right"
                                    />
                                    <span className="text-xs text-neutral-400">€/kWh</span>
                                </div>
                                <div className="flex flex-col space-y-4">
                                    <div className="flex items-center justify-between border-b border-neutral-800 pb-2 px-4">
                                        <span className="text-sm text-neutral-400">Horaire</span>
                                        <span className="text-lg font-bold">
                                            <CountUp
                                                from={0}
                                                to={hourlyCost}
                                            />
                                            <span className="text-muted-foreground"> €</span>   
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-neutral-800 pb-2 px-4">
                                        <span className="text-sm text-neutral-400">Journalier</span>
                                        <span className="text-lg font-bold">
                                            <CountUp
                                                from={0}
                                                to={dailyCost}
                                            />
                                            <span className="text-muted-foreground"> €</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between px-4">
                                        <span className="text-sm text-neutral-400">Mensuel</span>
                                        <span className="text-lg font-bold">
                                            <CountUp
                                                from={0}
                                                to={monthlyCost}
                                            />
                                            <span className="text-muted-foreground"> €</span>
                                        </span>
                                    </div>
                                </div>
                                <div className="text-xs text-neutral-400 text-center pt-2 border-t border-neutral-800">
                                    Basé sur une consommation totale de {totalConsumption.toFixed(2)} kWh
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            );
        }
        return (
            <div className="w-full h-full">
                {!isResizing && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col h-full w-full px-0 bg-neutral-900 rounded-md"
                    >
                        <div className="flex items-center justify-between relative">
                            <div className="flex flex-row gap-1 items-center 3xl:flex-col py-4 3xl:items-start px-2">
                                <h4 className="text-lg font-medium text-neutral-300">Coût énergétique</h4>
                                <div className="flex flex-row gap-1 items-center">
                                <Input
                                    type="number"
                                    value={pricePerKwh}
                                    onChange={(e) => handlePriceChange(e.target.value)}
                                    step="0.001"
                                    min="0"
                                    className="w-16 p-1 m-0 h-auto text-right text-xs"
                                />
                                <span className="text-xs text-neutral-400">€/kWh</span>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onToggleExpand}
                                className="mx-4 my-4 bg-neutral-800 hover:bg-neutral-700 px-1 py-1 h-auto 3xl:px-2 3xl:py-2 absolute -top-3 -right-3"
                            >
                                <ArrowUpLeft className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex flex-col h-full items-stretch space-y-0">
                            <div className="grid grid-cols-3 border-t  h-full">
                                <div className="flex flex-1 h-full flex-col justify-center px-6 py-2 text-left border-r">
                                    <span className="text-xs text-muted-foreground">Horaire</span>
                                    <span className="text-lg 3xl:text-xl font-bold leading-none whitespace-nowrap">
                                        <CountUp
                                            from={0}
                                            to={hourlyCost}
                                            duration={0.1}
                                        />
                                        <span className="text-muted-foreground"> €</span>
                                    </span>
                                </div>
                                <div className="flex flex-1 flex-col justify-center px-6 py-2 text-left border-r">
                                    <span className="text-xs text-muted-foreground">Journalier</span>
                                    <span className="text-lg 3xl:text-xl font-bold leading-none whitespace-nowrap">
                                        <CountUp
                                            from={0}
                                            to={dailyCost}
                                            duration={0.1}
                                        />
                                        <span className="text-muted-foreground"> €</span>
                                    </span>
                                </div>
                                <div className="flex flex-1 flex-col justify-center px-6 py-2 text-left">
                                    <span className="text-xs text-muted-foreground">Mensuel</span>
                                    <span className="text-lg 3xl:text-xl font-bold leading-none whitespace-nowrap">
                                        <CountUp
                                            from={0}
                                            to={monthlyCost}
                                            duration={0.1}
                                        />
                                        <span className="text-muted-foreground"> €</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        );
    }

    return (
        <div className="w-full h-full">
            {!isResizing && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col h-full w-full p-4 bg-neutral-900 rounded-md"
                >
                    <div className="flex items-center justify-between relative">
                        <div className="flex items-center gap-2">
                            <h4 className="text-lg font-medium text-neutral-300">Coût énergétique</h4>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info className="h-4 w-4 text-neutral-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Estimation basée sur la consommation actuelle</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onToggleExpand}
                            className="bg-neutral-800 hover:bg-neutral-700 px-1 py-1 h-auto 3xl:px-2 3xl:py-2 absolute -top-3 -right-3"
                        >
                            <ArrowDownRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex-1 flex flex-col justify-between space-y-6">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-neutral-800 rounded-md">
                                <Euro className="h-4 w-4" />
                            </div>
                            <Input
                                type="number"
                                value={pricePerKwh}
                                onChange={(e) => handlePriceChange(e.target.value)}
                                step="0.001"
                                min="0"
                                className="w-24 text-right"
                            />
                            <span className="text-xs text-neutral-400">€/kWh</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="text-xs text-neutral-400 mb-1">Coût moyen horaire</div>
                                <div className="text-2xl font-bold text-neutral-200">
                                    <CountUp
                                        from={0}
                                        to={hourlyCost}
                                        decimals={2}
                                    />
                                    <span className="text-muted-foreground"> €</span>
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-neutral-400 mb-1">Coût moyen journalier</div>
                                <div className="text-2xl font-bold text-neutral-200">
                                    <CountUp
                                        from={0}
                                        to={dailyCost}
                                        decimals={2}
                                    />
                                    <span className="text-muted-foreground"> €</span>
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-neutral-400 mb-1">Coût total</div>
                                <div className="text-2xl font-bold text-neutral-200">
                                    <CountUp
                                        from={0}
                                        to={monthlyCost}
                                        decimals={2}
                                    />
                                    <span className="text-muted-foreground"> €</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-center pt-4 border-t border-neutral-800">
                            <div className="text-xs text-neutral-400 mt-2">
                                Basé sur une consommation de {Math.round(totalConsumption)} kWh
                                <br />
                                au tarif de {pricePerKwh.toFixed(3)} €/kWh
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}; 