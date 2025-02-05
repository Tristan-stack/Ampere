"use client"

import React, { useEffect, useState } from "react";
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
import { EtageCost } from "./etage-cost";
import { Maximize2, Minimize2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { toast } from "react-toastify";

type ConsumptionData = {
  id: string;
  date: string;
  building: string;
  floor: string;
  totalConsumption: number;
  emissions: number;
  name: string;
};

type BuildingFloors = {
  'A': string[];
  'B': string[];
  'C': string[];
};

const buildingFloors: BuildingFloors = {
  'A': ['RDC', '1er étage', '2e étage', '3e étage'],
  'B': ['RDC', '1er étage'],
  'C': ['1er étage', '2e étage'],
};

type SelectedMeasurement = {
  id: string;  // ID unique de la mesure
  building: string;
  floor: string;
  measurementNumber: number;  // Numéro de la mesure pour cet étage
};

const useOptimizedChartData = (rawData: any[]) => {
  return React.useMemo(() => {
    if (!rawData || rawData.length === 0) return [];

    const maxPoints = 500;
    if (rawData.length > maxPoints) {
      const step = Math.ceil(rawData.length / maxPoints);
      return rawData.filter((_, index) => index % step === 0);
    }

    return rawData;
  }, [rawData]);
};

const MeasurementButton = React.memo(({
  measurementId,
  isSelected,
  matchingData,
  onSelect,
  onDoubleClick
}: {
  measurementId: string;
  isSelected: boolean;
  matchingData: any;
  onSelect: () => void;
  onDoubleClick: () => void;
}) => (
  <button
    onClick={onSelect}
    onDoubleClick={onDoubleClick}
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
      {matchingData?.name}
    </div>
  </button>
));

const EtagesClient = () => {
  const { chartData: rawChartData, isLoading } = useData();
  const { user } = useUser();
  const optimizedChartData = useOptimizedChartData(rawChartData);

  const [selectedMeasurements, setSelectedMeasurements] = useState<SelectedMeasurement[]>([]);
  const [activeBuilding, setActiveBuilding] = useState<keyof BuildingFloors>('A');
  const [showSelected, setShowSelected] = useState(false);
  const [expandedGraph, setExpandedGraph] = useState<number | null>(null);
  const [savingsPercentage, setSavingsPercentage] = useState(0);
  const [isToolsExpanded, setIsToolsExpanded] = useState(false);
  const [pricePerKwh, setPricePerKwh] = useState<number>(0.15);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const FullscreenButton = ({ onClick }: { onClick: (event: React.MouseEvent) => void }) => (
    <button
      onClick={onClick}
      className="absolute top-1 right-1 p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors z-10"
    >
      {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
    </button>
  );
  // Obtenir les mesures disponibles pour chaque étage
  const availableMeasurements = React.useMemo(() => {
    if (!optimizedChartData || optimizedChartData.length === 0) return {};

    const measurements: Record<string, Record<string, Set<string>>> = {};

    optimizedChartData.forEach(item => {
      const buildingKey = item.building as keyof BuildingFloors;
      measurements[buildingKey] ??= {};
      measurements[buildingKey][item.floor] ??= new Set<string>();
      const measurementId = item?.id?.split('-')[0] || '';
      measurements[buildingKey][item.floor]?.add(measurementId);
    });

    return measurements;
  }, [optimizedChartData]);

  // Préparer les données pour le graphique
  const floorData = React.useMemo(() => {
    if (!optimizedChartData || optimizedChartData.length === 0) return {};

    // Filtrer les données pour les mesures sélectionnées
    const filteredData = optimizedChartData.filter(item =>
      selectedMeasurements.some(
        m => item.id.startsWith(m.id)
      )
    );

    // Grouper par mesure individuelle
    const groupedByMeasurement: { [key: string]: typeof optimizedChartData } = {};

    filteredData.forEach(item => {
      const measurementId = item.id.split('-')[0];
      const key = `${measurementId}-${item.building}-${item.floor}`;
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
  }, [optimizedChartData, selectedMeasurements, savingsPercentage]);

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

  const handleMeasurementSelect = async (building: string, floor: string, measurementId: string) => {
    const isSelected = selectedMeasurements.some(m => m.id === measurementId);
    let newSelectedMeasurements: SelectedMeasurement[];

    if (isSelected) {
      newSelectedMeasurements = selectedMeasurements.filter(m => m.id !== measurementId);
    } else {
      const measurementNumber = [...(availableMeasurements[building]?.[floor] || [])].indexOf(measurementId) + 1;
      newSelectedMeasurements = [...selectedMeasurements, {
        id: measurementId,
        building,
        floor,
        measurementNumber
      }];
    }


    // Mettre à jour l'état local
    setSelectedMeasurements(newSelectedMeasurements);

    // Sauvegarder la nouvelle configuration
    await saveConfiguration(newSelectedMeasurements);
  };

  // Modifier handleBuildingDoubleClick pour sauvegarder la configuration
  const handleBuildingDoubleClick = async (building: keyof BuildingFloors) => {
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

    const newSelectedMeasurements = allSelected
      ? selectedMeasurements.filter(m => m.building !== building)
      : allMeasurements;

    setSelectedMeasurements(newSelectedMeasurements);
    await saveConfiguration(newSelectedMeasurements);

    toast.success(allSelected
      ? `Mesures du bâtiment ${building} désélectionnées`
      : `Mesures du bâtiment ${building} sélectionnées`
    );
  };

  // Modifier handleFloorDoubleClick pour sauvegarder la configuration
  const handleFloorDoubleClick = async (building: string, floor: string) => {
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

    const newSelectedMeasurements = allSelected
      ? selectedMeasurements.filter(m => m.building !== building || m.floor !== floor)
      : [...selectedMeasurements.filter(m => m.building !== building || m.floor !== floor), ...floorMeasurements];

    setSelectedMeasurements(newSelectedMeasurements);
    await saveConfiguration(newSelectedMeasurements);

    toast.success(allSelected
      ? `Mesures de l'étage ${floor} du bâtiment ${building} désélectionnées`
      : `Mesures de l'étage ${floor} du bâtiment ${building} sélectionnées`
    );
  };

  // Modifier handleMeasurementDoubleClick pour sauvegarder la configuration
  const handleMeasurementDoubleClick = async (building: string, floor: string, measurementId: string) => {
    const measurements = availableMeasurements[building]?.[floor] || new Set();
    const measurementNumber = [...measurements].indexOf(measurementId) + 1;

    const newSelectedMeasurements = [{
      id: measurementId,
      building,
      floor,
      measurementNumber
    }];

    setSelectedMeasurements(newSelectedMeasurements);
    await saveConfiguration(newSelectedMeasurements);

    toast.success('Mesure sélectionnée uniquement');
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

  // Add new state
  const [isInitialized, setIsInitialized] = useState(false);
  const [totalEnergy, setTotalEnergy] = useState(0);

  // Modify useEffect
  useEffect(() => {
    if (!isInitialized && optimizedChartData && optimizedChartData.length > 0) {
      const allMeasurements: SelectedMeasurement[] = [];
      buildingFloors['A'].forEach(floor => {
        const measurements = availableMeasurements['A']?.[floor] || new Set();
        measurements.forEach(measurementId => {
          const measurementNumber = [...measurements].indexOf(measurementId) + 1;
          allMeasurements.push({
            id: measurementId,
            building: 'A',
            floor,
            measurementNumber
          });
        });
      });
      setSelectedMeasurements(allMeasurements);
      setIsInitialized(true);
    }
  }, [optimizedChartData, availableMeasurements, isInitialized]);

  // Remplacer la fonction getCurrentBuildingData
  const getCurrentBuildingData = React.useMemo(() => {
    if (!optimizedChartData || optimizedChartData.length === 0) return {};

    const latestData: { [key: string]: number } = {};

    // Grouper les dernières données par bâtiment
    optimizedChartData.forEach(item => {
      const buildingKey = item.building;
      if (!latestData[buildingKey] || !latestData[buildingKey]) {
        latestData[buildingKey] = item.totalConsumption;
      }
    });

    return latestData;
  }, [optimizedChartData]);

  // Modifier le useEffect pour le chargement de la configuration
  React.useEffect(() => {
    const loadDefaultConfiguration = async () => {
      const userEmail = user?.emailAddresses[0]?.emailAddress;
      if (!userEmail || !optimizedChartData?.length || !availableMeasurements['A']) return;

      try {
        const response = await fetch('/api/etageConfig', {
          headers: {
            'user-email': userEmail
          }
        });

        if (!response.ok) {
          throw new Error('Erreur lors du chargement');
        }

        const data = await response.json();
        const defaultConfig = data.configs.find((c: any) => c.isDefault);

        if (defaultConfig?.selectedMeasures) {
          console.log('Configuration chargée:', defaultConfig.selectedMeasures);
          setSelectedMeasurements(defaultConfig.selectedMeasures);
          setIsInitialized(true);
          toast.success('Configuration chargée avec succès');
        } else if (!isInitialized) {
          const allMeasurements: SelectedMeasurement[] = [];
          buildingFloors['A'].forEach(floor => {
            const measurements = availableMeasurements['A']?.[floor] || new Set();
            measurements.forEach(measurementId => {
              const measurementNumber = [...measurements].indexOf(measurementId) + 1;
              allMeasurements.push({
                id: measurementId,
                building: 'A',
                floor,
                measurementNumber
              });
            });
          });
          setSelectedMeasurements(allMeasurements);
          setIsInitialized(true);
          await saveConfiguration(allMeasurements);
          toast.info('Configuration initiale créée');
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la configuration:', error);
        toast.error('Erreur lors du chargement de la configuration');
      }
    };

    loadDefaultConfiguration();
  }, [user?.emailAddresses[0]?.emailAddress, isInitialized, optimizedChartData]);

  // Modifier le useEffect pour la surveillance des données
  React.useEffect(() => {
    if (optimizedChartData?.length && availableMeasurements['A'] && !isInitialized) {
      const allMeasurements: SelectedMeasurement[] = [];
      buildingFloors['A'].forEach(floor => {
        const measurements = availableMeasurements['A']?.[floor] || new Set();
        measurements.forEach(measurementId => {
          const measurementNumber = [...measurements].indexOf(measurementId) + 1;
          allMeasurements.push({
            id: measurementId,
            building: 'A',
            floor,
            measurementNumber
          });
        });
      });
      setSelectedMeasurements(allMeasurements);
      setIsInitialized(true);
    }
  }, [optimizedChartData?.length, availableMeasurements['A'], isInitialized]);

  // Modifier la fonction saveConfiguration pour ajouter des toasts plus détaillés
  const saveConfiguration = async (measures: SelectedMeasurement[]) => {
    const userEmail = user?.emailAddresses[0]?.emailAddress;
    if (!userEmail) {
      toast.error('Utilisateur non connecté');
      return;
    }

    try {
      const response = await fetch('/api/etageConfig', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-email': userEmail
        },
        body: JSON.stringify({
          selectedMeasures: measures,
          isDefault: true,
          name: 'Configuration par défaut'
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }

      console.log('Configuration sauvegardée avec succès');
      toast.success('Configuration sauvegardée');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde de la configuration');
    }
  };

  return (
    <div className="w-full md:w-full h-full flex flex-col lg:flex-row items-center justify-start md:justify-center gap-4 md:mt-16 xl:mt-0">
      {/* Colonne de gauche - Contrôles */}
      <div className="w-full lg:w-1/3 flex flex-row lg:flex-col space-y-4 h-full md:h-36 lg:h-full">
        {/* Section Bâtiments */}
        <div className="h-36 w-full lg:h-2/4 block justify-start items-start md:flex md:justify-center md:items-center lg:block lg:justify-start lg:items-start lg:space-y-4 space-y-4 md:space-y-0 space-x-0 md:space-x-4 lg:space-x-0">
          <div className="bg-neutral-800 h-full lg:h-2/4 rounded-md border">
            <div className="w-full h-full bg-neutral-900 rounded-md p-4">
              <h1 className="text-white text-2xl font-bold mb-4">Analyse des étages</h1>
              <div className="flex items-center sm:space-x-0 xl:space-x-4">
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
                        "flex items-center sm:text-xs xl:text-sm space-x-2 px-3 py-1 rounded-md transition-all",
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
          <div className="h-36 lg:h-2/4 w-full bg-neutral-800 rounded-md border">
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
                <div className="h-20 md:h-24 3xl:h-28 w-full overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-neutral-800 [&::-webkit-scrollbar-track]:bg-neutral-950">
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
                                  const isSelected = selectedMeasurements.some(m => m.id === measurementId);
                                  const matchingData = optimizedChartData.find(item => item.id.startsWith(measurementId));

                                  return (
                                    <MeasurementButton
                                      key={measurementId}
                                      measurementId={measurementId}
                                      isSelected={isSelected}
                                      matchingData={matchingData}
                                      onSelect={() => handleMeasurementSelect(activeBuilding, floor, measurementId)}
                                      onDoubleClick={() => handleMeasurementDoubleClick(activeBuilding, floor, measurementId)}
                                    />
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
        <div className="h-72 xl:h-2/4 hidden lg:block rounded-md relative">
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
      <div className="w-full lg:w-2/3 mt-36 md:mt-0 pt-4 md:pt-0 flex flex-col space-y-4 h-full overflow-visible md:overflow-hidden">
        {/* Graphique principal */}
        <motion.div
          className={cn(
            "bg-neutral-800 rounded-md border transition-all relative",
            isFullscreen ? "w-full h-screen absolute top-0 left-0 -mt-6 z-50 overflow-hidden" : expandedGraph === 2 ? "h-full" : expandedGraph !== null ? "h-2/4 md:h-1/4 cursor-pointer" : "h-96 md:h-3/4"
          )}


          onClick={() => !isFullscreen && handleGraphClick(2)}
          initial={false}
          animate={isFullscreen ? {
            scale: 1,
            opacity: 1,
          } : {
            scale: 1,
            opacity: 1,
          }}
          transition={{ duration: 0.2 }}
        >
          <FullscreenButton
            onClick={(event: React.MouseEvent) => {
              event.stopPropagation();
              setIsFullscreen(!isFullscreen);
            }}
          />
          <div className="h-full">
            <div className="w-full h-full bg-neutral-900 rounded-md flex items-center justify-center">
              <EtageGraph2
                floorData={floorData}
                isExpanded={expandedGraph === 2 || expandedGraph === null || isFullscreen}
                onTotalChange={(total) => setTotalEnergy(total.totalConsumption)}
                chartData={optimizedChartData}
              />
            </div>
          </div>
        </motion.div>

        {/* Graphiques secondaires */}
        <div className={cn(" space-x-4 transition-all hidden md:flex", expandedGraph !== null ? "h-full md:h-3/4" : "h-1/4")}>
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
                currentBuildingData={getCurrentBuildingData}
                selectedMeasurements={selectedMeasurements}
                availableMeasurements={availableMeasurements}
                chartData={optimizedChartData}
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
                totalConsumption={totalEnergy}
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

export default EtagesClient; 