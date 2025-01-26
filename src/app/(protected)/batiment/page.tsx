"use client";
import React from "react";
import { Batimentgraph2 } from "./batiment-graph-2";
import Batimentgraph4 from "./batiment-graph-4";
import { BatimentgraphTable } from "./batiment-graph-tableau";
import { BatimentCarousel } from "./batiment-carousel";
import Squares from "@/components/squares";
import Score from "@/components/score";
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from "lucide-react"
import { useData } from '../context/DataContext';

type ConsumptionData = {
  id: string;
  date: string;
  building: string;
  floor: string;
  totalConsumption: number;
  emissions: number;
};

const calculateEfficiencyScore = (data: ConsumptionData[]) => {
  if (!data.length) return 300;

  // Calculer les métriques clés
  const avgConsumption = data.reduce((acc, curr) => acc + curr.totalConsumption, 0) / data.length;
  const maxConsumption = Math.max(...data.map(d => d.totalConsumption));
  const variability = data.reduce((acc, curr) => 
    acc + Math.pow(curr.totalConsumption - avgConsumption, 2), 0) / data.length;

  // Normaliser les métriques (0-100)
  const avgScore = Math.max(0, 100 - (avgConsumption / 1000) * 100);
  const peakScore = Math.max(0, 100 - (maxConsumption / 2000) * 100);
  const variabilityScore = Math.max(0, 100 - (variability / 10000) * 100);

  // Pondérer les différents facteurs
  const weightedScore = (
    avgScore * 0.5 +      // Consommation moyenne (50%)
    peakScore * 0.3 +     // Pics de consommation (30%)
    variabilityScore * 0.2 // Stabilité de la consommation (20%)
  );

  // Mapper le score sur l'échelle 300-810
  const finalScore = 300 + Math.round((weightedScore / 100) * 510);
  
  // Limiter le score entre 300 et 810
  return Math.min(810, Math.max(300, finalScore));
};

const Batiments = () => {
    const { 
        chartData, 
        filteredData, 
        aggregatedData, 
        selectedBuildings, 
        setSelectedBuildings 
    } = useData();

    const items = ["A", "B", "C"];
    const handleBuildingSelection = (building: string) => {
        setSelectedBuildings((prevBuildings: string[]) => {
            if (prevBuildings.includes(building)) {
                return prevBuildings.filter((b: string) => b !== building);
            }
            return [...prevBuildings, building];
        });
    };

    const buildingColors = {
        'A': 'hsl(var(--chart-1))',
        'B': 'hsl(var(--chart-2))',
        'C': 'hsl(var(--chart-3))'
    } as const;

    const efficiencyScore = React.useMemo(() => {
        const filteredForScore = chartData.filter(item => selectedBuildings.includes(item.building));
        return calculateEfficiencyScore(filteredForScore);
    }, [chartData, selectedBuildings]);

    return (
        <div className="w-full space-y-4 flex flex-col justify-center mx-auto">
            <div className="w-full h-1/2 flex space-x-4">
                <div className="w-1/3 bg-neutral-800 rounded-md border">
                    <div className="h-full">
                        <div className="w-full h-full bg-neutral-900 rounded-md p-4 overflow-hidden">
                            <h1 className="text-white text-2xl font-bold mb-1 3xl:mb-8">Analyse des bâtiments</h1>
                            <div className="relative">
                                <Score score={efficiencyScore+500} />
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button className="absolute top-0 right-0 p-2 text-neutral-400 hover:text-neutral-300 transition-colors">
                                                <Info className="h-4 w-4" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-sm">
                                            <p className="text-sm">
                                                Le score est calculé en fonction de 3 critères :
                                                <br />• Consommation moyenne (50%)
                                                <br />• Pics de consommation (30%)
                                                <br />• Stabilité de la consommation (20%)
                                                <br /><br />
                                                Plus le score est élevé, plus la consommation est optimisée.
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <h3 className="text-neutral-300 text-sm 3xl:text-lg font-bold mt-2">Sélection des bâtiments</h3>
                            <div className="flex items-start mt-1 justify-start gap-2">
                                {["A", "B", "C"].map(building => (
                                    <button
                                        key={building}
                                        onClick={() => handleBuildingSelection(building)}
                                        className={cn(
                                            "px-2 py-2 3xl:px-4 3xl:py-2 rounded-md transition-all duration-200 font-medium text-xs",
                                            "border hover:bg-zinc-800 flex items-center gap-2",
                                            selectedBuildings.includes(building)
                                                ? "bg-neutral-950 text-white shadow-lg shadow-neutral-900/50"
                                                : "bg-neutral-900 text-neutral-400 hover:text-neutral-300"
                                        )}
                                    >
                                        <div 
                                            className="w-3 h-3 rounded-full" 
                                            style={{ 
                                                backgroundColor: buildingColors[building as keyof typeof buildingColors],
                                                boxShadow: `0 0 10px ${buildingColors[building as keyof typeof buildingColors]}`
                                            }} 
                                        />
                                        Bâtiment {building}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="w-2/3 bg-neutral-800 rounded-md">
                    <div className="h-full">
                        <div className="w-full h-full bg-neutral-900 rounded-md flex items-center justify-center">
                            <Batimentgraph2 aggregatedData={aggregatedData} loading={false} />
                        </div>
                    </div>
                </div>
            </div>
            <div className="w-full h-1/2 flex space-x-4">
                <div className="w-1/3 rounded-md">
                    <div className="h-full">
                        <div className="w-full h-full rounded-md relative">
                            <Squares
                                speed={0.15}
                                squareSize={40}
                                direction='diagonal'
                                borderColor='#1f1f1f'
                                hoverFillColor='#222'
                            />
                            <div className="absolute inset-0 z-[1] pointer-events-none">
                                <BatimentCarousel />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="w-2/3 h-full flex space-x-4">
                    <div className="w-1/2 bg-neutral-800 rounded-md">
                        <div className="h-full">
                            <div className="w-full h-full bg-neutral-900 rounded-md relative">
                                <BatimentgraphTable filteredData={filteredData} loading={false} />
                            </div>
                        </div>
                    </div>
                    <div className="w-1/2 bg-neutral-900 rounded-md">
                        <div className="h-full">
                            <div className="w-full h-full rounded-md">
                                <Batimentgraph4 />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Batiments;