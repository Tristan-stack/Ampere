"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Building2, ArrowRight } from "lucide-react";
import Score from "@/components/score";
import Squares from "@/components/squares";
import { motion, AnimatePresence } from "framer-motion";
import { EtageCarousel } from "./etage-carousel";
import { EtageGraph2 } from "./etage-graph-2";
import { useData } from "../context/DataContext";
import { EtageTools } from "./etage-tools";
import { EtageEmissionsGraph } from "./etage-graph-3";
import { EtageCost } from "./etage-cost";

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

type SelectedMeasurement = {
  id: string;  // ID unique de la mesure
  building: string;
  floor: string;
  measurementNumber: number;  // Numéro de la mesure pour cet étage
};

const Etages = () => {
  const { chartData, isLoading } = useData();
  const [selectedMeasurements, setSelectedMeasurements] = useState<SelectedMeasurement[]>([]);
  const [activeBuilding, setActiveBuilding] = useState<keyof BuildingFloors>('A');
  const [showSelected, setShowSelected] = useState(false);
  const [expandedGraph, setExpandedGraph] = useState<number | null>(null);
  const [savingsPercentage, setSavingsPercentage] = useState(0);
  const [isToolsExpanded, setIsToolsExpanded] = useState(false);
  const [pricePerKwh, setPricePerKwh] = useState<number>(0.15);

  // Obtenir les mesures disponibles pour chaque étage
  const availableMeasurements = React.useMemo(() => {
    if (!chartData || chartData.length === 0) return {};

    const measurements: Record<string, Record<string, Set<string>>> = {};
    
    chartData.forEach(item => {
      // Initialiser l'objet du bâtiment s'il n'existe pas
      if (!measurements[item.building]) {
        measurements[item.building] = {};
      }
      // Initialiser le Set pour l'étage s'il n'existe pas
      if (!measurements[item.building]?.[item.floor]) {
        measurements[item.building][item.floor] = new Set<string>();
      }
      // Ajouter l'ID de mesure au Set
      const measurementId = item?.id?.split('-')[0] || '';
      measurements[item.building][item.floor]?.add(measurementId);
    });

    return measurements;
  }, [chartData]);

  // Préparer les données pour le graphique
  const floorData = React.useMemo(() => {
    if (!chartData || chartData.length === 0) return {};

    // Filtrer les données pour les mesures sélectionnées
    const filteredData = chartData.filter(item => 
      selectedMeasurements.some(
        m => item.id.startsWith(m.id)
      )
    );

    // Grouper par mesure
    const groupedByMeasurement: { [key: string]: typeof chartData } = {};
    
    filteredData.forEach(item => {
      const measurementId = item.id.split('-')[0];
      const key = `${item.building}-${item.floor}-${measurementId}`;
      if (!groupedByMeasurement[key]) {
        groupedByMeasurement[key] = [];
      }
      groupedByMeasurement[key].push({
        ...item,
        totalConsumption: item.totalConsumption * (1 - savingsPercentage / 100),
        emissions: item.emissions * (1 - savingsPercentage / 100)
      });
    });

    return groupedByMeasurement;
  }, [chartData, selectedMeasurements, savingsPercentage]);

  const getCookie = (name: string) => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i]?.trim();
      if (c?.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  const buildingColors = {
    'A': 'hsl(var(--chart-1))',
    'B': 'hsl(var(--chart-2))',
    'C': 'hsl(var(--chart-3))'
  } as const;

  const handleMeasurementSelect = (building: string, floor: string, measurementId: string) => {
    setSelectedMeasurements(prev => {
      const isSelected = prev.some(m => m.id === measurementId);
      
      if (isSelected) {
        return prev.filter(m => m.id !== measurementId);
      }

      const measurementNumber = [...(availableMeasurements[building]?.[floor] || [])].indexOf(measurementId) + 1;
      
      return [...prev, {
        id: measurementId,
        building,
        floor,
        measurementNumber
      }];
    });
  };

  // Ajout des nouvelles fonctions de gestion des doubles clics
  const handleBuildingDoubleClick = (building: keyof BuildingFloors) => {
    const allMeasurements: SelectedMeasurement[] = [];
    
    buildingFloors[building].forEach(floor => {
      const measurements = availableMeasurements[building]?.[floor] || new Set();
      measurements.forEach(measurementId => {
        const measurementNumber = [...measurements].indexOf(measurementId) + 1;
        allMeasurements.push({
          id: measurementId,
          building,
          floor,
          measurementNumber
        });
      });
    });

    // Si toutes les mesures du bâtiment sont déjà sélectionnées, on les désélectionne
    const allSelected = allMeasurements.every(m => 
      selectedMeasurements.some(sm => sm.id === m.id)
    );

    if (allSelected) {
      setSelectedMeasurements(prev => prev.filter(m => m.building !== building));
    } else {
      setSelectedMeasurements(allMeasurements);
    }
  };

  const handleFloorDoubleClick = (building: string, floor: string) => {
    const measurements = availableMeasurements[building]?.[floor] || new Set();
    const floorMeasurements = [...measurements].map((measurementId, index) => ({
      id: measurementId,
      building,
      floor,
      measurementNumber: index + 1
    }));

    // Si toutes les mesures de l'étage sont déjà sélectionnées, on les désélectionne
    const allSelected = floorMeasurements.every(m => 
      selectedMeasurements.some(sm => sm.id === m.id)
    );

    if (allSelected) {
      setSelectedMeasurements(prev => prev.filter(m => m.building !== building || m.floor !== floor));
    } else {
      setSelectedMeasurements(prev => {
        const otherMeasurements = prev.filter(m => m.building !== building || m.floor !== floor);
        return [...otherMeasurements, ...floorMeasurements];
      });
    }
  };

  const handleMeasurementDoubleClick = (building: string, floor: string, measurementId: string) => {
    const measurements = availableMeasurements[building]?.[floor] || new Set();
    const measurementNumber = [...measurements].indexOf(measurementId) + 1;
    
    setSelectedMeasurements([{
      id: measurementId,
      building,
      floor,
      measurementNumber
    }]);
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

  const handleToolsClick = (event: React.MouseEvent) => {
    // Empêcher la propagation du clic pour éviter le déclenchement du onClick parent
    event.stopPropagation();
    handleGraphClick(0);
  };

  console.log('data', floorData)

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
                  const selectedMeasurementsCount = selectedMeasurements.filter(
                    m => m.building === buildingKey
                  ).length;
                  const isPartiallySelected = selectedMeasurementsCount > 0 && selectedMeasurementsCount < buildingFloors[buildingKey].length;
                  const isFullySelected = selectedMeasurementsCount === buildingFloors[buildingKey].length;

                  return (
                    <button
                      key={building}
                      onClick={() => handleBuildingTabClick(buildingKey)}
                      onDoubleClick={() => handleBuildingDoubleClick(buildingKey)}
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

          {/* Section Étages et Mesures */}
          <div className="h-2/4 bg-neutral-800 rounded-md border">
            <div className="w-full h-full bg-neutral-900 rounded-md p-4">
              <div className="flex items-center justify-between mb-1 3xl:mb-3">
                <h3 className="text-neutral-300 text-sm 3xl:text-lg font-medium">
                  {showSelected ? "Sélections actives" : "Mesures disponibles"}
                </h3>
                <button
                  onClick={() => setShowSelected(!showSelected)}
                  className="text-xs px-2 py-1 rounded-md bg-neutral-800 text-neutral-400 hover:text-neutral-300 transition-colors"
                >
                  {showSelected ? "Voir les mesures" : "Voir les sélections"}
                </button>
              </div>

              <AnimatePresence mode="wait">
                <div className="h-20 3xl:h-28 w-full overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-neutral-800 [&::-webkit-scrollbar-track]:bg-neutral-950">
                  {!showSelected ? (
                    <motion.div
                      className=""
                      key="measurements"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      {buildingFloors[activeBuilding].map((floor) => {
                        const measurements = availableMeasurements[activeBuilding]?.[floor] || new Set();
                        const isFloorSelected = [...measurements].every(measurementId => 
                          selectedMeasurements.some(m => m.id === measurementId)
                        );
                        const isPartiallySelected = [...measurements].some(measurementId => 
                          selectedMeasurements.some(m => m.id === measurementId)
                        );
                        
                        return (
                          <div key={floor}>
                            <div 
                              className={cn(
                                "p-3 py-2 mb-1 rounded-lg",
                                "border-2 transition-all duration-200",
                                isFloorSelected 
                                  ? "bg-neutral-800 border-neutral-700" 
                                  : isPartiallySelected 
                                    ? "bg-neutral-800/50 border-neutral-700/50"
                                    : "bg-neutral-900 border-transparent",
                              )}
                            >
                              <h3 
                                className={cn(
                                  "text-sm font-medium flex items-center justify-between",
                                  "cursor-pointer hover:text-neutral-200 transition-colors",
                                  isFloorSelected ? "text-white" : "text-neutral-400"
                                )}
                                onClick={() => handleFloorDoubleClick(activeBuilding, floor)}
                              >
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4" />
                                  {floor}
                                </div>
                                <div className="text-xs text-neutral-500">
                                  {[...measurements].filter(m => 
                                    selectedMeasurements.some(sm => sm.id === m)
                                  ).length} / {measurements.size}
                                </div>
                              </h3>

                              <div className="flex flex-wrap gap-2 mt-1">
                                {[...measurements].map((measurementId) => {
                                  const isSelected = selectedMeasurements.some(
                                    m => m.id === measurementId
                                  );
                                  const measurementNumber = [...measurements].indexOf(measurementId) + 1;

                                  return (
                                    <button
                                      key={measurementId}
                                      onClick={() => handleMeasurementSelect(activeBuilding, floor, measurementId)}
                                      onDoubleClick={() => handleMeasurementDoubleClick(activeBuilding, floor, measurementId)}
                                      className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-md",
                                        "text-xs transition-all duration-200",
                                        isSelected
                                          ? "bg-neutral-700 text-white shadow-lg shadow-neutral-900/50"
                                          : "bg-neutral-800/50 text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800",
                                        "border border-neutral-700/50"
                                      )}
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <div 
                                          className={cn(
                                            "w-2 h-2 rounded-full",
                                            isSelected ? "bg-green-500" : "bg-neutral-600"
                                          )}
                                        />
                                        Mesure {measurementNumber}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
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
                      {selectedMeasurements.length > 0 ? (
                        selectedMeasurements.map((measurement) => (
                          <div
                            key={measurement.id}
                            className="flex items-center space-x-2 px-3 py-1 bg-neutral-800 rounded-md text-xs"
                            style={{
                              borderLeft: `3px solid ${buildingColors[measurement?.building as keyof BuildingFloors]}`,
                            }}
                          >
                            <span className="text-white">
                              Bât. {measurement.building} - {measurement.floor} - Mesure {measurement.measurementNumber}
                            </span>
                            <button
                              onClick={() => handleMeasurementSelect(measurement.building, measurement.floor, measurement.id)}
                              className="text-neutral-400 hover:text-neutral-300"
                            >
                              ×
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-neutral-400 text-sm">Aucune mesure sélectionnée</p>
                      )}
                    </motion.div>
                  )}
                </div>
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
            "bg-neutral-800 rounded-md border transition-all",
            expandedGraph === 2 ? "h-full" : expandedGraph !== null ? "h-1/4  cursor-pointer" : "h-3/4"
          )}
          onClick={() => handleGraphClick(2)}
        >
          <div className="h-full">
            <div className="w-full h-full bg-neutral-900 rounded-md flex items-center justify-center">
              <EtageGraph2
                floorData={floorData}
                isExpanded={expandedGraph === 2 || expandedGraph === null}
              />
            </div>
          </div>
        </div>

        {/* Graphiques secondaires */}
        <div className={cn("flex space-x-4 transition-all", expandedGraph !== null ? "h-3/4" : "h-1/4")}>
          <div
            className={cn(
              "bg-neutral-900 border rounded-md transition-all",
              expandedGraph === 0 ? "w-full h-full" : expandedGraph === null ? "w-1/2" : "w-1/4"
            )}
          >
            <div className="h-full">
              <EtageTools 
                onSavingsChange={(savings) => {
                  setSavingsPercentage(savings);
                }}
                onPriceChange={(price) => {
                  setPricePerKwh(price);
                }}
                isExpanded={expandedGraph === 0}
                onToggleExpand={(event) => {
                  event.stopPropagation();
                  handleGraphClick(expandedGraph === 0 ? 2 : 0);
                }}
                totalConsumption={Object.values(floorData)
                    .flat()
                    .reduce((acc, curr) => acc + curr.totalConsumption, 0)
                }
              />
            </div>
          </div>
          <div
            className={cn(
              "bg-neutral-900 border rounded-md transition-all",
              expandedGraph === 1 ? "w-full h-full" : expandedGraph === null ? "w-1/2" : "w-1/4"
            )}
          >
            <div className="h-full">
              <EtageCost
                totalConsumption={Object.values(floorData)
                  .flat()
                  .reduce((acc, curr) => acc + curr.totalConsumption, 0)
                }
                pricePerKwh={pricePerKwh}
                onPriceChange={setPricePerKwh}
                isExpanded={expandedGraph === 1}
                onToggleExpand={(event) => {
                  event.stopPropagation();
                  handleGraphClick(expandedGraph === 1 ? 2 : 1);
                }}
                isToolsExpanded={expandedGraph === 0}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Etages;