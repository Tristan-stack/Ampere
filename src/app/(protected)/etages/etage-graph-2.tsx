"use client";

import React, { useState, useEffect, ReactElement, useRef } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Brush } from "recharts";
import CountUp from "@/components/countup";
import { motion } from "framer-motion";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Settings2, Check, Info } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSearchParams } from 'next/navigation'

const chartConfig = {
  total: {
    label: "Total",
    color: "hsl(var(--chart-1))",
  },
  byFloor: {
    label: "Par étages",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

interface EtageGraph2Props {
  floorData: {
    [key: string]: Array<{
      date: string;
      building: string;
      floor: string;
      totalConsumption: number;
      emissions: number;
      name: string;
    }>;
  };
  isExpanded: boolean;
  isAdmin?: boolean;
}

const buildingColors = {
  'A': 'hsl(var(--chart-1))',
  'B': 'hsl(var(--chart-2))',
  'C': 'hsl(var(--chart-3))'
} as const;

const chartColors = {
  grid: 'hsl(var(--border))',
  text: 'hsl(var(--foreground))',
  axis: 'hsl(var(--border))'
} as const;

interface ChartOptions {
  curveType: "linear" | "monotone";
  timeInterval: "5min" | "15min" | "30min" | "1h" | "1d";
}

const W_TO_KWH = 1 / 1000; // Conversion W vers kWh (diviser par 1000)
const KWH_TO_MWH = 1 / 1000; // Conversion kWh vers MWh (diviser par 1000) 
const CO2_COEFFICIENT = 671.75; // kg CO2/MWh (converti de 0.67175 tCO2/MWh en kg)
const TREE_CO2_ABSORPTION = 22; // kg de CO2 par arbre par an (converti de 0.022 tonnes)


// Ajouter cette fonction d'agrégation des données
const aggregateDataByInterval = (data: any[], interval: string) => {
  const aggregatedData: { [key: string]: any } = {};

  data.forEach(item => {
    const date = new Date(item.date);
    let key: string;

    switch (interval) {
      case "5min":
        date.setMinutes(Math.floor(date.getMinutes() / 5) * 5);
        date.setSeconds(0);
        key = date.toISOString();
        break;
      case "15min":
        date.setMinutes(Math.floor(date.getMinutes() / 15) * 15);
        date.setSeconds(0);
        key = date.toISOString();
        break;
      case "30min":
        date.setMinutes(Math.floor(date.getMinutes() / 30) * 30);
        date.setSeconds(0);
        key = date.toISOString();
        break;
      case "1h":
        date.setMinutes(0);
        date.setSeconds(0);
        key = date.toISOString();
        break;
      case "1d":
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        key = date.toISOString();
        break;
      default:
        date.setMinutes(Math.floor(date.getMinutes() / 15) * 15);
        date.setSeconds(0);
        key = date.toISOString();
    }

    if (!aggregatedData[key]) {
      aggregatedData[key] = { ...item, date: key };
    }
  });

  return Object.values(aggregatedData);
};

// Ajouter ces fonctions au début du fichier, après les imports
const adjustColorSaturation = (baseColor: string, index: number, total: number) => {
  // Convertir la couleur HSL en valeurs numériques
  const hslMatch = baseColor.match(/hsl\(var\((--chart-\d+)\)\)/);
  if (!hslMatch) return baseColor;

  // Calculer la saturation en fonction de l'index
  // On garde la même teinte mais on varie la saturation
  const saturationPercent = 100 - (index * 10);

  return `hsl(var(${hslMatch[1]}) / ${saturationPercent}%)`;
};

const getMeasureColor = (building: keyof typeof buildingColors, measureId: string, data: any) => {
  // Trouver toutes les mesures du même bâtiment
  const buildingMeasures = Object.keys(data).filter(key => key.split('-')[1] === building);
  const measureIndex = buildingMeasures.indexOf(measureId);

  const baseColor = buildingColors[building];
  return adjustColorSaturation(baseColor, measureIndex, buildingMeasures.length);
};

export const EtageGraph2: React.FC<EtageGraph2Props> = ({ floorData, isExpanded, isAdmin = false }) => {
  const [prevTotal, setPrevTotal] = useState(0);
  const [prevMax, setPrevMax] = useState(0);
  const [prevMin, setPrevMin] = useState(0);
  const [chartOptions, setChartOptions] = useState<ChartOptions>({
    curveType: "monotone",
    timeInterval: "5min"
  });
  const [selectedPoints, setSelectedPoints] = useState<('min' | 'max')[]>([]);
  const [brushStartIndex, setBrushStartIndex] = useState<number | null>(null);
  const [brushEndIndex, setBrushEndIndex] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const resizeTimeoutRef = useRef<NodeJS.Timeout>();
  const searchParams = useSearchParams()
  const isHighlighted = searchParams.get('highlight') === 'etage-graph-2'

  const togglePoint = (type: 'min' | 'max') => {
    setSelectedPoints(prev =>
      prev.includes(type)
        ? prev.filter(p => p !== type)
        : [...prev, type]
    );
  };

  // Modifier la fonction prepareChartData
  const prepareChartData = () => {
    if (!floorData || Object.keys(floorData).length === 0) return [];

    // Récupérer toutes les données et les agréger par intervalle
    const aggregatedDataByFloor: { [key: string]: any[] } = {};

    Object.entries(floorData).forEach(([key, data]) => {
      aggregatedDataByFloor[key] = aggregateDataByInterval(data, chartOptions.timeInterval);
    });

    // Récupérer toutes les dates uniques
    const allDates = [...new Set(
      Object.values(aggregatedDataByFloor)
        .flat()
        .map(item => item.date)
    )].sort();

    // Créer les points de données pour chaque date
    return allDates.map(date => {
      const dataPoint: any = { date };

      // Ajouter les données de chaque étage
      Object.entries(aggregatedDataByFloor).forEach(([key, data]) => {
        const pointForDate = data.find(item => item.date === date);
        if (pointForDate) {
          dataPoint[key] = pointForDate.totalConsumption;
        }
      });

      return dataPoint;
    });
  };

  const total = React.useMemo(() => {
    const allData = Object.values(floorData).flat();
    if (allData.length === 0) {
      return {
        totalConsumption: 0,
        maxConsumption: 0,
        minConsumption: 0,
        emissions: 0,
      };
    }
  
    const allConsumptions = allData.map(item => item.totalConsumption).filter(value =>
      typeof value === 'number' && !isNaN(value)
    );
  
    return {
      totalConsumption: Number(allConsumptions.reduce((acc, curr) => acc + curr, 0).toFixed(2)),
      maxConsumption: Number((allConsumptions.length > 0 ? Math.max(...allConsumptions) : 0).toFixed(2)),
      minConsumption: Number((allConsumptions.length > 0 ? Math.min(...allConsumptions) : 0).toFixed(2)),
      emissions: Number(allData.reduce((acc, curr) => acc + (curr.emissions || 0), 0).toFixed(2)),
    };
  }, [floorData]);

  const chartData = React.useMemo(() => prepareChartData(), [floorData]);

  const getDateFormatter = (interval: string) => {
    switch (interval) {
      case "5min":
      case "15min":
      case "30min":
        return (value: string) => {
          const date = new Date(value);
          return date.toLocaleString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit"
          });
        };
      case "1w":
        return (value: string) => {
          const date = new Date(value);
          return `Semaine ${date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`;
        };
      case "1m":
        return (value: string) => {
          const date = new Date(value);
          return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
        };
      case "1d":
        return (value: string) => {
          const date = new Date(value);
          return date.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short"
          });
        };
      case "1h":
        return (value: string) => {
          const date = new Date(value);
          return date.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit"
          });
        };
      default:
        return (value: string) => {
          const date = new Date(value);
          return date.toLocaleString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit"
          });
        };
    }
  };

  useEffect(() => {
    setPrevTotal(total.totalConsumption);
    setPrevMax(total.maxConsumption);
    setPrevMin(total.minConsumption);
  }, [total]);

  useEffect(() => {
    if (chartData.length > 0) {
      // Ajuster les index du brush si nécessaire
      const maxIndex = chartData.length - 1;

      if (brushStartIndex === null || brushEndIndex === null) {
        // Initialisation
        setBrushStartIndex(0);
        setBrushEndIndex(Math.min(100, maxIndex));
      } else {
        // Ajuster les index existants si nécessaire
        const safeStartIndex = Math.min(brushStartIndex, maxIndex);
        const safeEndIndex = Math.min(brushEndIndex, maxIndex);

        if (safeStartIndex !== brushStartIndex) {
          setBrushStartIndex(safeStartIndex);
        }
        if (safeEndIndex !== brushEndIndex) {
          setBrushEndIndex(safeEndIndex);
        }
      }
    }
  }, [chartData, brushStartIndex, brushEndIndex]);

  useEffect(() => {
    // Masquer le contenu pendant le redimensionnement
    setIsResizing(true);

    // Clear le timeout existant
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    // Réafficher le contenu après un court délai
    resizeTimeoutRef.current = setTimeout(() => {
      setIsResizing(false);
    }, 150); // Ajustez ce délai selon vos besoins

    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [isExpanded]); // Se déclenche quand le graphique est redimensionné

  const handleBrushChange = (brushData: any) => {
    if (!chartData.length) return;

    const maxIndex = chartData.length - 1;
    if (brushData.startIndex !== undefined && brushData.endIndex !== undefined) {
      // S'assurer que les index ne dépassent pas les limites
      const safeStartIndex = Math.min(Math.max(0, brushData.startIndex), maxIndex);
      const safeEndIndex = Math.min(Math.max(0, brushData.endIndex), maxIndex);

      setBrushStartIndex(safeStartIndex);
      setBrushEndIndex(safeEndIndex);
    }
  };

  const findMinMaxPoints = React.useMemo(() => {
    let maxPoint = { date: '', value: 0, building: '', type: 'max' as const };
    let minPoint = { date: '', value: Infinity, building: '', type: 'min' as const };

    Object.entries(floorData).forEach(([building, data]) => {
      data.forEach(point => {
        if (point.totalConsumption > maxPoint.value) {
          maxPoint = {
            date: point.date,
            value: point.totalConsumption,
            building,
            type: 'max'
          };
        }
        if (point.totalConsumption < minPoint.value) {
          minPoint = {
            date: point.date,
            value: point.totalConsumption,
            building,
            type: 'min'
          };
        }
      });
    });

    // Si aucune donnée n'a été trouvée, réinitialiser minPoint
    if (minPoint.value === Infinity) {
      minPoint = { date: '', value: 0, building: '', type: 'min' };
    }

    return { maxPoint, minPoint };
  }, [floorData]);

  if (!isExpanded) {
    return (
      <motion.div
        animate={isHighlighted ? {
          boxShadow: [
            "0 0 0 0px rgba(255,255,255,0)",
            "0 0 0 3px rgba(255,255,255,0.8)",
            "0 0 0 3px rgba(255,255,255,0)"
          ]
        } : {}}
        transition={{ duration: 1, times: [0, 0.5, 1] }}
        className="w-full h-full"
      >
        {!isResizing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between h-full w-full flex-col"
          >
            <div className="flex flex-col h-full items-stretch space-y-0 border-b p-0 sm:flex-row w-full">
              <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-3 sm:py-2">
                <div className="flex items-center justify-start gap-1">
                  
                <h2 className="md:text-sm xl:text-lg font-bold">Puissance par étages</h2>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-neutral-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        {/*Texte d'information sur comment lire le graphique et comment fonctionne le selecteur*/}
                        <p>Le graphique représente la puissance énergétique des mesures que vous selectionnez.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <div className="flex">
                <div className="flex flex-1 flex-col justify-center gap-1 border-l md:px-6 md:py-3 text-left px-2 py-2">
                  <span className="text-xs text-muted-foreground">Total</span>
                  <span className="text-xl font-bold leading-none 3xl:text-3xl whitespace-nowrap">
                    <CountUp
                      from={prevTotal}
                      to={total.totalConsumption}
                      separator=" "
                      direction="up"
                      decimals={2}
                      duration={0.1}
                      className="count-up-text"
                    />
                    <span className="text-xs text-muted-foreground ml-1">W</span>
                  </span>
                </div>
                <div
                  className={`flex flex-1 flex-col justify-center gap-1 border-l md:px-6 md:py-3 text-left px-2 py-2 cursor-pointer hover:bg-accent/50 transition-colors ${selectedPoints.includes('max') ? 'bg-accent/50' : ''
                    }`}
                  onClick={() => togglePoint('max')}
                >
                  <span className="text-xs text-muted-foreground">Maximum</span>
                  <span className="text-xl font-bold leading-none 3xl:text-3xl whitespace-nowrap">
                    <CountUp
                      from={prevMax}
                      to={total.maxConsumption}
                      separator=" "
                      direction="up"
                      decimals={2}
                      duration={0.1}
                      className="count-up-text"
                    />
                    <span className="text-xs text-muted-foreground ml-1">W</span>
                  </span>
                </div>
                <div
                  className={`flex flex-1 flex-col justify-center gap-1 border-l md:px-6 md:py-3 text-left px-2 py-2 cursor-pointer hover:bg-accent/50 transition-colors ${selectedPoints.includes('min') ? 'bg-accent/50' : ''
                    }`}
                  onClick={() => togglePoint('min')}
                >
                  <span className="text-xs text-muted-foreground">Minimum</span>
                  <span className="text-xl font-bold leading-none 3xl:text-3xl whitespace-nowrap">
                    <CountUp
                      from={prevMin}
                      to={total.minConsumption}
                      separator=" "
                      direction="up"
                      duration={0.1}
                      decimals={2}
                      className="count-up-text"
                    />
                    <span className="text-xs text-muted-foreground ml-1">W</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex w-full h-full">
              <div className="flex flex-1 flex-col justify-center gap-1 md:px-6 md:py-4 text-left px-2 py-2">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Moyenne</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Consommation moyenne des étages sélectionnés</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <span className="text-xl 3xl:text-3xl font-bold leading-none whitespace-nowrap">
                  <CountUp
                    from={0}
                    to={total.totalConsumption / Object.keys(floorData).length || 0}
                    separator=" "
                    duration={0.1}
                    decimals={2}
                    className="count-up-text"
                  />
                  <span className="text-xs text-muted-foreground ml-1">W</span>
                </span>
              </div>
              <div className="flex flex-1 flex-col justify-center gap-1 border-l md:px-6 md:py-4 text-left px-2 py-2">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Émissions CO₂</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[300px]">
                        <p>Estimation basée sur les coefficients moyens d'émission :</p>
                        <ul className="list-disc ml-4 mt-1">
                          <li>Charbon : 0,986 t CO₂/MWh</li>
                          <li>Fioul : 0,777 t CO₂/MWh</li>
                          <li>Gaz : 0,429 t CO₂/MWh</li>
                          <li>Bioénergies : 0,494 t CO₂/MWh</li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <span className="text-xl 3xl:text-3xl font-bold leading-none whitespace-nowrap">
                  <CountUp
                    from={0}
                    to={(total.totalConsumption * W_TO_KWH * KWH_TO_MWH * CO2_COEFFICIENT)}
                    decimals={2}
                    separator=" "
                    duration={0.1}
                    className="count-up-text"
                  />
                  <span className="text-xs text-muted-foreground ml-1">kg CO₂</span>
                </span>
              </div>
              <div className="flex flex-1 flex-col justify-center gap-1 border-l md:px-6 md:py-4 text-left px-2 py-2">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Équivalent arbres</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Nombre d'arbres nécessaires pour absorber ces émissions de CO₂ sur un an.</p>
                        <p className="mt-1">Un arbre absorbe en moyenne 22kg de CO₂ par an.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <span className="text-xl 3xl:text-3xl font-bold leading-none whitespace-nowrap">
                  <CountUp
                    from={0}
                    to={Math.ceil((total.totalConsumption * W_TO_KWH * KWH_TO_MWH * CO2_COEFFICIENT) / TREE_CO2_ABSORPTION)}
                    decimals={2}
                    separator=" "
                    duration={0.1}
                    className="count-up-text"
                  />
                  <span className="text-xs text-muted-foreground ml-1">arbres/an</span>
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      animate={isHighlighted ? {
        boxShadow: [
          "0 0 0 0px rgba(255,255,255,0)",
          "0 0 0 3px rgba(255,255,255,0.8)",
          "0 0 0 3px rgba(255,255,255,0)"
        ]
      } : {}}
      transition={{ duration: 1, times: [0, 0.5, 1] }}
      className="relative flex flex-col justify-between items-center h-full w-full rounded-md"
    >
      {!isResizing ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full flex justify-between flex-col"
        >
          <div className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row w-full">
            <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center justify-start gap-1">
                  <div className="flex items-start flex-col gap-1">
                    <h2 className="md:text-sm xl:text-lg font-bold">Puissance par étages</h2>
                    <p className="text-xs text-muted-foreground -mt-2">
                      Sur la période sélectionnée dans le menu période
                    </p>
                  </div>


                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>


                        <Info className="h-4 w-4 text-neutral-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Le graphique représente la puissance énergétique des mesures que vous selectionnez.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Personnalisation</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuLabel className="text-xs">Type de courbe</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => setChartOptions(prev => ({ ...prev, curveType: "monotone" }))}
                    >
                      <div className="flex items-center justify-between w-full">
                        Courbe lisse
                        {chartOptions.curveType === "monotone" && <Check className="h-4 w-4" />}
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setChartOptions(prev => ({ ...prev, curveType: "linear" }))}
                    >
                      <div className="flex items-center justify-between w-full">
                        Ligne droite
                        {chartOptions.curveType === "linear" && <Check className="h-4 w-4" />}
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex">
              <div className="flex flex-1 flex-col justify-center gap-1 border-t md:px-6 md:py-4 text-left even:border-l sm:border-l sm:border-t-0 px-4 py-2">
                <span className="text-xs text-muted-foreground">Total</span>
                <span className="text-xl font-bold leading-none 3xl:text-3xl whitespace-nowrap">
                  <CountUp
                    from={prevTotal}
                    to={total.totalConsumption}
                    separator=" "
                    direction="up"
                    duration={0.1}
                    decimals={2}
                    className="count-up-text"
                  />
                  <span className="text-xs text-muted-foreground ml-1">W</span>
                </span>
              </div>
              <div
                className={`flex flex-1 flex-col justify-center gap-1 border-t md:px-6 md:py-4 text-left even:border-l sm:border-l sm:border-t-0 px-4 py-2 cursor-pointer hover:bg-accent/50 transition-colors ${selectedPoints.includes('max') ? 'bg-accent/50' : ''
                  }`}
                onClick={() => togglePoint('max')}
              >
                <span className="text-xs text-muted-foreground">Maximum</span>
                <span className="text-xl font-bold leading-none 3xl:text-3xl whitespace-nowrap">
                  <CountUp
                    from={prevMax}
                    to={total.maxConsumption}
                    separator=" "
                    direction="up"
                    duration={0.1}
                    decimals={2}
                    className="count-up-text"
                  />
                  <span className="text-xs text-muted-foreground ml-1">W</span>
                </span>
              </div>
              <div
                className={`flex flex-1 flex-col justify-center gap-1 border-t md:px-6 md:py-4 text-left even:border-l sm:border-l sm:border-t-0 px-4 py-2 cursor-pointer hover:bg-accent/50 transition-colors ${selectedPoints.includes('min') ? 'bg-accent/50' : ''
                  }`}
                onClick={() => togglePoint('min')}
              >
                <span className="text-xs text-muted-foreground">Minimum</span>
                <span className="text-xl font-bold leading-none 3xl:text-3xl whitespace-nowrap">
                  <CountUp
                    from={prevMin}
                    to={total.minConsumption}
                    separator=" "
                    direction="up"
                    duration={0.1}
                    decimals={2}
                    className="count-up-text"
                  />
                  <span className="text-xs text-muted-foreground ml-1">W</span>
                </span>
              </div>
            </div>
          </div>
          <div className="h-[calc(100%-150px)] 3xl:h-[calc(100%-200px)] w-full">
            <ChartContainer
              config={chartConfig}
              className="h-full w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 0, right: 50, left: -10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={chartColors.grid}
                    opacity={0.5}
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tick={{ fill: chartColors.text }}
                    tickFormatter={getDateFormatter(chartOptions.timeInterval)}
                  />
                  <YAxis
                    tick={{ fill: chartColors.text }}
                    axisLine={{ stroke: chartColors.axis }}
                    tickLine={{ stroke: chartColors.axis }}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        className="w-fit transition-all duration-300"
                        nameKey="views"
                        labelFormatter={(value) => {
                          return new Date(value).toLocaleDateString("fr-FR", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })
                        }}
                      />
                    }
                  />
                  {Object.entries(floorData).map(([key, data]) => {
                    const parts = key.split("-");
                    const building = parts[1] as keyof typeof buildingColors; // Cast building to correct type
                    const floor = parts[2];
                    const lineColor = getMeasureColor(building, key, floorData);

                    return (
                      <Line
                        key={key}
                        type={chartOptions.curveType}
                        dataKey={`${key}`}
                        stroke={lineColor}
                        strokeWidth={2}
                        name={data[0]?.name ?? `${building} - ${floor}`}
                        dot={(props) => {
                          const isMax = selectedPoints.includes('max') && props.value === total.maxConsumption;
                          const isMin = selectedPoints.includes('min') && props.value === total.minConsumption;

                          if (isMax || isMin) {
                            return (
                              <circle
                                key={`dot-${key}-${props.cx}-${props.cy}`}
                                cx={props.cx}
                                cy={props.cy}
                                r={6}
                                fill="white"
                                stroke={lineColor}
                                strokeWidth={2}
                              />
                            );
                          }
                          return <g key={`empty-${key}-${props.cx}-${props.cy}`} />;
                        }}
                        activeDot={{
                          r: 4,
                          fill: "white",
                          stroke: lineColor,
                          strokeWidth: 2
                        }}
                        connectNulls
                      />
                    );
                  })}
                  {chartData.length > 0 && brushStartIndex !== null && brushEndIndex !== null && (
                    <Brush
                      data={chartData}
                      dataKey="date"
                      startIndex={brushStartIndex}
                      endIndex={brushEndIndex}
                      onChange={handleBrushChange}
                      fill="rgba(0, 0, 0, 0.2)"
                      tickFormatter={(value) => {
                        const dateStr = new Date(value).toLocaleDateString();
                        return dateStr;
                      }}
                    >
                      <LineChart>
                        {Object.entries(floorData).map(([key, data]) => {
                          const parts = key.split("-");
                          const building = parts[1] as keyof typeof buildingColors; // Cast building to correct type
                          const floor = parts[2];
                          const lineColor = getMeasureColor(building, key, floorData);

                          return (
                            <Line
                              key={key}
                              type={chartOptions.curveType}
                              dataKey={`${key}`}
                              stroke={lineColor}
                              strokeWidth={2}
                              dot={false}
                            />
                          );
                        })}
                      </LineChart>
                    </Brush>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          <div className="hidden md:flex w-full border-t">
            <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-4 text-left even:border-l sm:px-4 sm:py-2">
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Moyenne</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Consommation moyenne des étages sélectionnés</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-xl 3xl:text-3xl font-bold leading-none whitespace-nowrap">
                <CountUp
                  from={0}
                  to={total.totalConsumption / Object.keys(floorData).length || 0}
                  separator=" "
                  duration={0.1}
                  decimals={2}
                  className="count-up-text"
                />
                <span className="text-xs text-muted-foreground ml-1">W</span>
              </span>
            </div>
            <div className="flex flex-1 flex-col justify-center gap-1 border-l px-6 py-4 text-left sm:px-4 sm:py-2">
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Émissions CO₂</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px]">
                      <p>Estimation basée sur les coefficients moyens d'émission :</p>
                      <ul className="list-disc ml-4 mt-1">
                        <li>Charbon : 0,986 t CO₂/MWh</li>
                        <li>Fioul : 0,777 t CO₂/MWh</li>
                        <li>Gaz : 0,429 t CO₂/MWh</li>
                        <li>Bioénergies : 0,494 t CO₂/MWh</li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-xl 3xl:text-3xl font-bold leading-none whitespace-nowrap">
                <CountUp
                  from={0}
                  to={(total.totalConsumption * W_TO_KWH * KWH_TO_MWH * CO2_COEFFICIENT)}

                  separator=" "
                  duration={0.1}
                  decimals={2}
                  className="count-up-text"
                />
                <span className="text-xs text-muted-foreground ml-1">kg CO₂</span>
              </span>
            </div>
            <div className="flex flex-1 flex-col justify-center gap-1 border-l md:px-6 md:py-4 text-left px-2 py-2">
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Équivalent arbres</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Nombre d'arbres nécessaires pour absorber ces émissions de CO₂ sur un an.</p>
                      <p className="mt-1">Un arbre absorbe en moyenne 22kg de CO₂ par an.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-xl 3xl:text-3xl font-bold leading-none whitespace-nowrap">
                <CountUp
                  from={0}
                  to={Math.ceil((total.totalConsumption * W_TO_KWH * KWH_TO_MWH * CO2_COEFFICIENT) / TREE_CO2_ABSORPTION)}

                  separator=" "
                  duration={0.1}
                  decimals={2}
                  className="count-up-text"
                />
                <span className="text-xs text-muted-foreground ml-1">arbres/an</span>
              </span>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {/* Optionnel : Ajouter un indicateur de chargement ici */}
        </div>
      )}
    </motion.div>
  );
}