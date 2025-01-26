"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Building2, ArrowRight } from "lucide-react";
import Score from "@/components/score";
import Squares from "@/components/squares";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EtageCarousel } from "./etage-carousel";

type ConsumptionData = {
  id: string;
  date: string;
  building: string;
  floor: string;
  totalConsumption: number;
  emissions: number;
};

type BuildingFloors = {
  'A': string[];
  'B': string[];
  'C': string[];
};

const buildingFloors: BuildingFloors = {
  'A': ['Rez-de-chaussée', '1er étage', '2e étage', '3e étage'],
  'B': ['Rez-de-chaussée', '1er étage'],
  'C': ['1er étage', '2e étage'],
};

type SelectedFloor = {
  building: keyof BuildingFloors;
  floor: string;
};

const Etages = () => {
  const [selectedFloors, setSelectedFloors] = useState<SelectedFloor[]>([
    { building: 'A', floor: 'Rez-de-chaussée' }
  ]);
  const [floorData, setFloorData] = useState<ConsumptionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [activeBuilding, setActiveBuilding] = useState<keyof BuildingFloors>('A');
  const [showSelected, setShowSelected] = useState(false);
  const [expandedGraph, setExpandedGraph] = useState<number | null>(null);

  const getCookie = (name: string) => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i]?.trim();
      if (c?.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const deviceKeys = [
        { key: '4f887d23-3cf2-4d1c-8ae8-0f0bea45cf09', building: 'A', floor: 'Rez-de-chaussée' },
        { key: '510478e8-ddfe-40d1-8d2f-f8562e4fb128', building: 'A', floor: '1er étage' },
        { key: 'ca8bf525-9259-4cfa-9ebe-856b4356895e', building: 'A', floor: '2e étage' },
        { key: '3b36f6d7-8abd-4e79-8154-72ccb92b9273', building: 'A', floor: '3e étage' },
        // ... autres clés de device
      ];

      const savedRange = getCookie('dateRange');
      if (!savedRange) {
        console.warn('Pas de dateRange dans les cookies.');
        setLoading(false);
        return;
      }

      const { from, to } = JSON.parse(savedRange);
      const fromTime = new Date(from).getTime();
      const toTime = new Date(to).getTime();

      try {
        const allData: ConsumptionData[] = [];
        // Logique de fetch similaire à la page bâtiment
        setFloorData(allData);
      } catch (error) {
        console.error('Erreur lors de la récupération des données :', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const buildingColors = {
    'A': 'hsl(var(--chart-1))',
    'B': 'hsl(var(--chart-2))',
    'C': 'hsl(var(--chart-3))'
  } as const;

  const handleFloorClick = (building: keyof BuildingFloors, floor: string) => {
    setSelectedFloors(prev => {
      const isSelected = prev.some(
        f => f.building === building && f.floor === floor
      );

      if (isSelected) {
        return prev.filter(
          f => !(f.building === building && f.floor === floor)
        );
      }
      return [...prev, { building, floor }];
    });
  };

  const handleBuildingTabClick = (building: keyof BuildingFloors) => {
    setActiveBuilding(building);
  };

  const handleGraphClick = (index: number) => {
    if (index === 2) {
      setExpandedGraph(null);
    } else {
      setExpandedGraph(index);
    }
  };

  return (
    <div className="w-full h-full flex gap-4">
      {/* Colonne de gauche - Contrôles */}
      <div className="w-1/3 h-full flex flex-col gap-4">
        {/* Section Bâtiments */}
        <div className="h-2/4 space-y-4">
          <div className="bg-neutral-800 h-2/4 rounded-md border">
            <div className="w-full h-full bg-neutral-900 rounded-md p-4">
              <h1 className="text-white text-2xl font-bold mb-4">Analyse des étages</h1>
              <div className="flex items-center space-x-4">
                {Object.keys(buildingFloors).map((building) => {
                  const buildingKey = building as keyof BuildingFloors;
                  const selectedFloorsCount = selectedFloors.filter(
                    f => f.building === buildingKey
                  ).length;
                  const isPartiallySelected = selectedFloorsCount > 0 && selectedFloorsCount < buildingFloors[buildingKey].length;
                  const isFullySelected = selectedFloorsCount === buildingFloors[buildingKey].length;

                  return (
                    <button
                      key={building}
                      onClick={() => handleBuildingTabClick(buildingKey)}
                      className={cn(
                        "flex items-center text-sm space-x-2 px-3 py-1 rounded-md transition-all",
                        activeBuilding === building ? "bg-neutral-800 text-white" : "",
                        isFullySelected
                          ? "border-2 border-neutral-700"
                          : isPartiallySelected
                            ? "border-2 border-neutral-700/50"
                            : "border-2 border-transparent",
                        building !== activeBuilding && "text-neutral-400 hover:text-neutral-300"
                      )}
                      style={{
                        borderLeft: `3px solid ${buildingColors[buildingKey]}`,
                      }}
                    >
                      <span>Bâtiment {building}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section Étages */}
          <div className="h-2/4 bg-neutral-800 rounded-md border">
            <div className="w-full h-full bg-neutral-900 rounded-md p-4">
              <div className="flex items-center justify-between mb-1 3xl:mb-3">
                <h3 className="text-neutral-300 text-sm 3xl:text-lg font-medium">
                  {showSelected ? "Sélections actives" : "Étages disponibles"}
                </h3>
                <button
                  onClick={() => setShowSelected(!showSelected)}
                  className="text-xs px-2 py-1 rounded-md bg-neutral-800 text-neutral-400 hover:text-neutral-300 transition-colors"
                >
                  {showSelected ? "Voir les étages" : "Voir les sélections"}
                </button>
              </div>

              <AnimatePresence mode="wait">
                <ScrollArea className="h-[80%]">
                  {!showSelected ? (
                    <motion.div
                      key="floors"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-wrap gap-2"
                    >
                      {buildingFloors[activeBuilding].map((floor, index) => {
                        const isSelected = selectedFloors.some(
                          f => f.building === activeBuilding && f.floor === floor
                        );

                        return (
                          <motion.button
                            key={floor}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.1 }}
                            onClick={() => handleFloorClick(activeBuilding, floor)}
                            className={cn(
                              "px-3 py-1 rounded-md transition-all text-xs 3xl:text-sm",
                              isSelected
                                ? "bg-neutral-800 text-white shadow-lg shadow-neutral-900/50"
                                : "text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800/50",
                              "border-2",
                              isSelected ? "border-neutral-700" : "border-transparent"
                            )}
                          >
                            {floor}
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="selections"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-wrap gap-2"
                    >
                      {selectedFloors.length > 0 ? (
                        selectedFloors.map(({ building, floor }) => (
                          <div
                            key={`${building}-${floor}`}
                            className="flex items-center space-x-2 px-3 py-1 bg-neutral-800 rounded-md text-xs"
                            style={{
                              borderLeft: `3px solid ${buildingColors[building]}`,
                            }}
                          >
                            <span className="text-white">Bât. {building} - {floor}</span>
                            <button
                              onClick={() => handleFloorClick(building, floor)}
                              className="text-neutral-400 hover:text-neutral-300"
                            >
                              ×
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-neutral-400 text-sm">Aucun étage sélectionné</p>
                      )}
                    </motion.div>
                  )}
                </ScrollArea>
              </AnimatePresence>
            </div>
          </div>
        </div>
        {/* Section Squares */}
        <div className="h-2/4  rounded-md relative">
          <div className="h-full pt-4">
            <Squares
              speed={0.15}
              squareSize={40}
              direction='diagonal'
              borderColor='#1f1f1f'
              hoverFillColor='#222'
            />
            <div className="absolute pt-4 inset-0 z-[1] pointer-events-none">
              <EtageCarousel />
            </div>
          </div>
        </div>
      </div>

      {/* Colonne de droite - Visualisations */}
      <div className="w-2/3 flex flex-col space-y-4">
        {/* Graphique principal */}
        <div
          className={cn(
            "bg-neutral-800 rounded-md border transition-all cursor-pointer",
            expandedGraph === 2 ? "h-full" : expandedGraph !== null ? "h-1/4" : "h-full"
          )}
          onClick={() => handleGraphClick(2)}
        >
          <div className="h-full">
            <div className="w-full h-full bg-neutral-900 rounded-md flex items-center justify-center">
              {/* TODO: Ajouter le composant EtageConsommationGraph */}
            </div>
          </div>
        </div>

        {/* Graphiques secondaires */}
                <div className={cn("flex space-x-4 transition-all", expandedGraph !== null ? "h-3/4" : "h-1/4")}>
          <div
            className={cn(
              "bg-neutral-900 border rounded-md transition-all cursor-pointer",
              expandedGraph === 0 ? "w-full h-full" : expandedGraph === null ? "w-1/2" : "w-1/4"
            )}
            onClick={() => handleGraphClick(0)}
          >
            <div className="h-full">
              {/* TODO: Premier graphique secondaire */}
            </div>
          </div>
          <div
            className={cn(
              "bg-neutral-900 border rounded-md transition-all cursor-pointer",
              expandedGraph === 1 ? "w-full h-full" : expandedGraph === null ? "w-1/2" : "w-1/4"
            )}
            onClick={() => handleGraphClick(1)}
          >
            <div className="h-full">
              {/* TODO: Deuxième graphique secondaire */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Etages;