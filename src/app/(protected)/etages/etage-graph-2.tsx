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
  onTotalChange?: (total: { totalConsumption: number }) => void;
  chartData?: Array<{
    id: string;
    date: string;
    building: string;
    floor: string;
    totalConsumption: number;
    emissions: number;
    name: string;
  }>;
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
  groupByBuilding: boolean;
}

const W_TO_KWH = 1 / 1000; // Conversion W vers kWh (diviser par 1000)
const KWH_TO_MWH = 1 / 1000; // Conversion kWh vers MWh (diviser par 1000) 

// Remplacer les constantes d'émission actuelles par :
const EMISSION_COEFFICIENTS = {
  charbon: 0.986, // t CO2/MWh
  fioul: 0.777,   // t CO2/MWh
  gazTAC: 0.486,  // t CO2/MWh (turbine à combustion)
  gazCC: 0.352,   // t CO2/MWh (co-génération et cycle combiné)
  gazAutre: 0.583,// t CO2/MWh (autres installations gaz)
  dechets: 0.494  // t CO2/MWh (déchets ménagers)
} as const;

// Mix énergétique moyen en France (à ajuster selon les données réelles)
const ENERGY_MIX = {
  charbon: 0.01,    // 1%
  fioul: 0.01,      // 1%
  gazTAC: 0.02,     // 2%
  gazCC: 0.06,      // 6%
  gazAutre: 0.02,   // 2%
  dechets: 0.02     // 2%
} as const;

// Fonction pour calculer le coefficient moyen d'émission
const calculateAverageCO2Coefficient = () => {
  let coefficient = 0;
  Object.entries(ENERGY_MIX).forEach(([source, percentage]) => {
    coefficient += EMISSION_COEFFICIENTS[source as keyof typeof EMISSION_COEFFICIENTS] * percentage;
  });
  return coefficient * 1000; // Conversion en kg CO2/MWh
};

// Modifier la fonction aggregateDataByInterval pour réduire le nombre de points
const aggregateDataByInterval = (data: any[], interval: string) => {
  const aggregatedData: { [key: string]: { total: number, count: number } } = {};

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
      case "1w":
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setDate(date.getDate() - date.getDay());
        key = date.toISOString();
        break;
      case "1m":
        // Pour les mois, on agrège par 12h
        date.setHours(Math.floor(date.getHours() / 12) * 12);
        date.setMinutes(0);
        date.setSeconds(0);
        key = date.toISOString();
        break;
      default:
        key = date.toISOString();
    }

    if (!aggregatedData[key]) {
      aggregatedData[key] = { total: 0, count: 0 };
    }
    aggregatedData[key]!.total += item.totalConsumption;
    aggregatedData[key]!.count += 1;
  });

  return Object.entries(aggregatedData).map(([date, values]) => ({
    date,
    totalConsumption: values.total / values.count // Moyenne pour la période
  }));
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

// Ajouter une fonction pour déterminer l'intervalle basé sur la plage de temps visible
const determineIntervalFromTimeRange = (startDate: Date, endDate: Date): "5min" | "15min" | "30min" | "1h" | "1d" | "1w" | "1m" => {
  const timeSpanMs = endDate.getTime() - startDate.getTime();
  const daysDifference = timeSpanMs / (1000 * 60 * 60 * 24);

  if (daysDifference <= 0.5) return "5min";  // 12h ou moins
  if (daysDifference <= 1) return "15min";   // 1 jour ou moins
  if (daysDifference <= 3) return "30min";   // 3 jours ou moins
  if (daysDifference <= 7) return "1h";      // 1 semaine ou moins
  if (daysDifference <= 14) return "1d";    // 2 semaines ou moins
  if (daysDifference <= 31) return "1w";     // 1 mois ou moins
  if (daysDifference <= 90) return "1m";     // 3 mois ou moins
  return "1m";                               // Plus de 3 mois
};

// Modifier la fonction determineOptimalInterval pour ajuster les seuils
const determineOptimalInterval = (data: any[]): "5min" | "15min" | "30min" | "1h" | "1d" | "1w" | "1m" => {
  if (!data || data.length === 0) return "15min";

  const dates = data.map(item => new Date(item.date).getTime());
  const timeSpanMs = Math.max(...dates) - Math.min(...dates);
  const daysDifference = timeSpanMs / (1000 * 60 * 60 * 24);
  const pointCount = data.length;

  // Ajuster les seuils pour réduire le nombre de points
  if (pointCount > 500) {
    if (daysDifference > 60) return "1m";
    if (daysDifference > 14) return "1d";
    if (daysDifference > 7) return "1h";
    return "1h";
  }

  if (daysDifference <= 1) {
    if (pointCount > 200) return "30min";
    if (pointCount > 100) return "15min";
    return "5min";
  }

  if (daysDifference <= 7) return "1h";
  if (daysDifference <= 31) return "1d";
  return "1m";
};

// Ajouter la constante pour l'absorption des arbres
const TREE_CO2_ABSORPTION = 22; // kg de CO2 par arbre par an

// Ajouter ces types après les imports
interface MinMaxPoint {
  date: string;
  value: number;
  building: string;
  type: 'min' | 'max';
}

export const EtageGraph2: React.FC<EtageGraph2Props> = ({ floorData, isExpanded, isAdmin = false, onTotalChange, chartData }) => {
  const [prevTotal, setPrevTotal] = useState(0);
  const [prevMax, setPrevMax] = useState(0);
  const [prevMin, setPrevMin] = useState(0);
  const [timeInterval, setTimeInterval] = useState<"5min" | "15min" | "30min" | "1h" | "1d" | "1w" | "1m">("15min");
  const [chartOptions, setChartOptions] = useState<ChartOptions>({
    curveType: "monotone",
    groupByBuilding: false,
  });
  const [selectedPoints, setSelectedPoints] = useState<('min' | 'max')[]>([]);
  const [brushStartIndex, setBrushStartIndex] = useState<number | null>(null);
  const [brushEndIndex, setBrushEndIndex] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const resizeTimeoutRef = useRef<NodeJS.Timeout>();

  const togglePoint = (type: 'min' | 'max') => {
    setSelectedPoints(prev =>
      prev.includes(type)
        ? prev.filter(p => p !== type)
        : [...prev, type]
    );
  };

  // Optimiser l'agrégation des données avec useMemo
  const processedData = React.useMemo(() => {
    const allData = Object.values(floorData).flat();
    const optimalInterval = determineOptimalInterval(allData);
    
    // Agréger les données une seule fois avec l'intervalle optimal
    const result: { [key: string]: any[] } = {};
    Object.entries(floorData).forEach(([key, data]) => {
      result[key] = aggregateDataByInterval(data, optimalInterval);
    });
    
    return {
      data: result,
      interval: optimalInterval
    };
  }, [floorData]); // Ne dépend que des données d'entrée

  // Utiliser l'intervalle optimal calculé
  useEffect(() => {
    setTimeInterval(processedData.interval);
  }, [processedData.interval]);

  // 1. Optimiser la préparation des données avec useMemo
  const prepareChartData = React.useMemo(() => {
    if (!processedData.data || Object.keys(processedData.data).length === 0) return [];

    const allDates = new Set<string>();
    const dataByDate: { [key: string]: any } = {};

    // Pré-allouer les dates
    Object.values(processedData.data).forEach(data => {
      data.forEach(item => allDates.add(item.date));
    });

    // Initialiser toutes les dates
    allDates.forEach(date => {
      dataByDate[date] = { date };
    });

    if (chartOptions.groupByBuilding) {
      // Grouper par bâtiment
      const buildingData: { [building: string]: { 
        [date: string]: number,
        lastKnownValue: number 
      } } = {};
      
      // Initialiser les données par bâtiment
      Object.entries(processedData.data).forEach(([key, data]) => {
        const building = key.split("-")[1];
        if (!buildingData[building]) {
          buildingData[building] = { lastKnownValue: 0 };
        }
      });

      // Trier les dates pour assurer un traitement chronologique
      const sortedDates = Array.from(allDates).sort();

      // Pour chaque date, calculer la somme par bâtiment
      sortedDates.forEach(date => {
        Object.keys(buildingData).forEach(building => {
          let sumForBuilding = 0;
          let hasNewValue = false;

          // Parcourir toutes les mesures de ce bâtiment
          Object.entries(processedData.data).forEach(([key, data]) => {
            if (key.split("-")[1] === building) {
              const measure = data.find(item => item.date === date);
              if (measure) {
                sumForBuilding += measure.totalConsumption;
                hasNewValue = true;
              } else {
                // Si pas de nouvelle valeur, utiliser la dernière valeur connue
                const lastValue = data.reduce((last, item) => {
                  if (new Date(item.date) <= new Date(date)) {
                    return item.totalConsumption;
                  }
                  return last;
                }, buildingData[building]?.lastKnownValue || 0);
                sumForBuilding += lastValue;
              }
            }
          });

          // Mettre à jour la dernière valeur connue si on a une nouvelle mesure
          if (hasNewValue) {
            buildingData[building]!.lastKnownValue = sumForBuilding;
          }

          // Stocker la valeur dans dataByDate
          dataByDate[date][`building-${building}`] = sumForBuilding;
        });
      });
    } else {
      // Comportement normal, sans groupement
      // Garder une trace de la dernière valeur connue pour chaque mesure
      const lastKnownValues: { [key: string]: number } = {};

      Array.from(allDates).sort().forEach(date => {
        Object.entries(processedData.data).forEach(([key, data]) => {
          const measure = data.find(item => item.date === date);
          if (measure) {
            dataByDate[date][key] = measure.totalConsumption;
            lastKnownValues[key] = measure.totalConsumption;
          } else if (lastKnownValues[key] !== undefined) {
            // Utiliser la dernière valeur connue
            dataByDate[date][key] = lastKnownValues[key];
          }
        });
      });
    }

    return Array.from(allDates)
      .sort()
      .map(date => dataByDate[date]);
  }, [processedData.data, chartOptions.groupByBuilding]);

  // Modifier findMinMaxPoints pour utiliser les données agrégées
  const findMinMaxPoints = React.useMemo(() => {
    let maxPoint = { date: '', value: -Infinity, building: '', type: 'max' as const };
    let minPoint = { date: '', value: Infinity, building: '', type: 'min' as const };

    // Utiliser les données agrégées au lieu des données brutes
    Object.entries(processedData.data).forEach(([key, data]) => {
      data.forEach((point: any) => {
        Object.entries(point).forEach(([dataKey, value]) => {
          // Ignorer la propriété 'date'
          if (dataKey === 'date' || typeof value !== 'number') return;
          
          if (value > maxPoint.value) {
            maxPoint = {
              date: point.date,
              value: value,
              building: key,
              type: 'max'
            };
          }
          if (value < minPoint.value) {
            minPoint = {
              date: point.date,
              value: value,
              building: key,
              type: 'min'
            };
          }
        });
      });
    });

    // Si aucune donnée n'a été trouvée, réinitialiser les points
    if (minPoint.value === Infinity) {
      minPoint = { date: '', value: 0, building: '', type: 'min' };
    }
    if (maxPoint.value === -Infinity) {
      maxPoint = { date: '', value: 0, building: '', type: 'max' };
    }

    return { maxPoint, minPoint };
  }, [processedData.data]);

  // Maintenant renderLines peut utiliser findMinMaxPoints
  const renderLines = React.useMemo(() => {
    if (chartOptions.groupByBuilding) {
      // Rendu des lignes groupées par bâtiment
      return Object.keys(buildingColors).map(building => {
        const key = `building-${building}`;
        return (
          <Line
            key={key}
            type={chartOptions.curveType}
            dataKey={key}
            stroke={buildingColors[building as keyof typeof buildingColors]}
            strokeWidth={2}
            name={`Bâtiment ${building}`}
            dot={(props: any) => {
              // Vérifier que les coordonnées sont valides
              if (typeof props.cx !== 'number' || typeof props.cy !== 'number' || 
                  isNaN(props.cx) || isNaN(props.cy) || 
                  props.value === undefined || props.payload?.date === undefined) {
                return null;
              }

              const isMinPoint = selectedPoints.includes('min') && 
                props.payload.date === findMinMaxPoints.minPoint.date && 
                Math.abs(props.value - findMinMaxPoints.minPoint.value) < 0.01;
              
              const isMaxPoint = selectedPoints.includes('max') && 
                props.payload.date === findMinMaxPoints.maxPoint.date && 
                Math.abs(props.value - findMinMaxPoints.maxPoint.value) < 0.01;

              if (isMinPoint || isMaxPoint) {
                // Récupérer la couleur de la ligne correspondante
                const pointBuilding = isMaxPoint ? findMinMaxPoints.maxPoint.building : findMinMaxPoints.minPoint.building;
                const pointColor = getMeasureColor(
                  pointBuilding.split('-')[1] as keyof typeof buildingColors,
                  pointBuilding,
                  processedData.data
                );

                return (
                  <g>
                    {/* Cercle d'animation */}
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={12}
                      fill={pointColor}
                      opacity={0.2}
                    >
                      <animate
                        attributeName="r"
                        from="8"
                        to="12"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        from="0.6"
                        to="0"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    {/* Point principal */}
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={6}
                      fill={pointColor}
                      stroke="white"
                      strokeWidth={2}
                    />
                  </g>
                );
              }
              return null;
            }}
            isAnimationActive={false}
            connectNulls
          />
        );
      });
    }

    // Rendu normal des lignes
    return Object.entries(processedData.data).map(([key, data]) => {
      const parts = key.split("-");
      const building = parts[1] as keyof typeof buildingColors;
      const lineColor = getMeasureColor(building, key, processedData.data);
      
      const measureData = Object.values(floorData)
        .flat()
        .find(item => item.id.startsWith(parts[0]));

      const displayName = `${measureData?.name}`;

      return (
        <Line
          key={key}
          type={chartOptions.curveType}
          dataKey={key}
          stroke={lineColor}
          strokeWidth={2}
          name={displayName}
          dot={(props: any) => {
            // Vérifier que les coordonnées sont valides
            if (typeof props.cx !== 'number' || typeof props.cy !== 'number' || 
                isNaN(props.cx) || isNaN(props.cy) || 
                props.value === undefined || props.payload?.date === undefined) {
              return null;
            }

            const isMinPoint = selectedPoints.includes('min') && 
              props.payload.date === findMinMaxPoints.minPoint.date && 
              Math.abs(props.value - findMinMaxPoints.minPoint.value) < 0.01;
            
            const isMaxPoint = selectedPoints.includes('max') && 
              props.payload.date === findMinMaxPoints.maxPoint.date && 
              Math.abs(props.value - findMinMaxPoints.maxPoint.value) < 0.01;

            if (isMinPoint || isMaxPoint) {
              // Récupérer la couleur de la ligne correspondante
              const pointBuilding = isMaxPoint ? findMinMaxPoints.maxPoint.building : findMinMaxPoints.minPoint.building;
              const pointColor = getMeasureColor(
                pointBuilding.split('-')[1] as keyof typeof buildingColors,
                pointBuilding,
                processedData.data
              );

              return (
                <g>
                  {/* Cercle d'animation */}
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={12}
                    fill={pointColor}
                    opacity={0.2}
                  >
                    <animate
                      attributeName="r"
                      from="8"
                      to="12"
                      dur="1.5s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      from="0.6"
                      to="0"
                      dur="1.5s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  {/* Point principal */}
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={6}
                    fill={pointColor}
                    stroke="white"
                    strokeWidth={2}
                  />
                </g>
              );
            }
            return null;
          }}
          isAnimationActive={false}
          connectNulls
        />
      );
    });
  }, [processedData.data, chartOptions.curveType, floorData, selectedPoints, findMinMaxPoints, chartOptions.groupByBuilding]);

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

    // Filtrer et trier les mesures valides par date
    const validMeasures = allData
      .filter(item => typeof item.totalConsumption === 'number' && !isNaN(item.totalConsumption))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Vérifier que les mesures et leurs dates existent
    if (!validMeasures[0]?.date || !validMeasures[validMeasures.length - 1]?.date) {
      return {
        totalConsumption: 0,
        maxConsumption: 0,
        minConsumption: 0,
        emissions: 0,
      };
    }

    const startDate = new Date(validMeasures[0].date);
    const endDate = new Date(validMeasures[validMeasures.length - 1]?.date || new Date());
    const periodHours = (endDate.getTime() - startDate.getTime()) / (1000 * 3600);

    // Calcul de l'énergie totale
    let totalEnergy = 0;
    for (let i = 0; i < validMeasures.length - 1; i++) {
      const currentMeasure = validMeasures[i];
      const nextMeasure = validMeasures[i + 1];
      
      if (!currentMeasure?.date || !nextMeasure?.date) continue;
      
      // Durée entre deux mesures en heures
      const duration = (new Date(nextMeasure.date).getTime() - new Date(currentMeasure.date).getTime()) / (1000 * 3600);
      
      if (!currentMeasure?.totalConsumption || !nextMeasure?.totalConsumption) continue;
      
      // Puissance moyenne sur l'intervalle (en W)
      const avgPower = (currentMeasure.totalConsumption + nextMeasure.totalConsumption) / 2;
      
      // Énergie en Wh pour cet intervalle
      const intervalEnergy = avgPower * duration;
      totalEnergy += intervalEnergy;
    }

    // Conversion en kWh
    const totalEnergyKWh = Math.round(totalEnergy / 1000);

    // Calculs statistiques sur la puissance
    const maxConsumption = Math.max(...validMeasures.map(item => item.totalConsumption));
    const minConsumption = Math.min(...validMeasures.map(item => item.totalConsumption));
    const averagePower = validMeasures.reduce((sum, item) => sum + item.totalConsumption, 0) / validMeasures.length;
    
    // Calcul des émissions avec le mix énergétique
    const averageCO2Coefficient = calculateAverageCO2Coefficient();
    const emissions = totalEnergyKWh * (averageCO2Coefficient / 1000); // Division par 1000 pour convertir MWh en kWh
    
    return {
      totalConsumption: totalEnergyKWh,
      maxConsumption: Number(maxConsumption.toFixed(2)),
      minConsumption: Number(minConsumption.toFixed(2)),
      emissions: Number(emissions.toFixed(2)),
    };
  }, [floorData]);

  const getDateFormatter = (interval: string) => {
    // Détermine si on doit afficher l'heure en fonction de l'intervalle
    const shouldShowTime = (interval: string) => {
      return ["5min", "15min", "30min", "1h"].includes(interval);
    };

    switch (interval) {
      case "5min":
      case "15min":
      case "30min":
      case "1h":
        return (value: string) => {
          const date = new Date(value);
          return shouldShowTime(interval) 
            ? date.toLocaleString("fr-FR", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit"
              })
            : date.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short"
              });
        };
      case "1d":
        return (value: string) => {
          const date = new Date(value);
          return date.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short"
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
      default:
        return (value: string) => {
          const date = new Date(value);
          return date.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short"
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
    if (prepareChartData.length > 0) {
      // Ajuster les index du brush si nécessaire
      const maxIndex = prepareChartData.length - 1;

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
  }, [prepareChartData, brushStartIndex, brushEndIndex]);

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

  // Simplifier la fonction handleBrushChange
  const handleBrushChange = (brushData: any) => {
    if (!prepareChartData.length) return;

    const maxIndex = prepareChartData.length - 1;
    if (brushData.startIndex !== undefined && brushData.endIndex !== undefined) {
      const safeStartIndex = Math.min(Math.max(0, brushData.startIndex), maxIndex);
      const safeEndIndex = Math.min(Math.max(0, brushData.endIndex), maxIndex);

      setBrushStartIndex(safeStartIndex);
      setBrushEndIndex(safeEndIndex);
    }
  };

  useEffect(() => {
    if (onTotalChange) {
      onTotalChange(total);
    }
  }, [total, onTotalChange]);

  if (!isExpanded) {
    return (
      <div className="w-full h-full ">
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
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground text-nowrap pr-1">Énergie totale</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-neutral-500" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[300px]">
                          <p>Énergie totale consommée sur la période.</p>
                          <p className="mt-1">Calculée en intégrant la puissance sur le temps.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-xl font-bold leading-none 3xl:text-3xl whitespace-nowrap">
                    <CountUp
                      from={prevTotal}
                      to={total.totalConsumption}
                      separator=" "
                      direction="up"
                      decimals={0}
                      duration={0.1}
                      className="count-up-text"
                    />
                    <span className="text-xs text-muted-foreground ml-1">kWh</span>
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
                      decimals={0}
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
                      decimals={0}
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
                    decimals={0}
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
                        <p>Estimation basée sur le mix énergétique suivant :</p>
                        <ul className="list-disc ml-4 mt-1">
                        <li>Charbon : ({EMISSION_COEFFICIENTS.charbon} t CO₂/MWh)</li>
                        <li>Fioul : ({EMISSION_COEFFICIENTS.fioul} t CO₂/MWh)</li>
                        <li>Gaz (TAC) : ({EMISSION_COEFFICIENTS.gazTAC} t CO₂/MWh)</li>
                        <li>Gaz (CC) : ({EMISSION_COEFFICIENTS.gazCC} t CO₂/MWh)</li>
                        <li>Gaz (Autre) : ({EMISSION_COEFFICIENTS.gazAutre} t CO₂/MWh)</li>
                        <li>Déchets : ({EMISSION_COEFFICIENTS.dechets} t CO₂/MWh)</li>
                      </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <span className="text-xl 3xl:text-3xl font-bold leading-none whitespace-nowrap">
                  <CountUp
                    from={0}
                    to={total.emissions}
                    decimals={0}
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
                    to={Math.ceil(total.emissions / TREE_CO2_ABSORPTION)}
                    decimals={0}
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
      </div>
    );
  }

  return (
    <div className="relative flex flex-col justify-between items-center h-full w-full rounded-md">
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

                    <DropdownMenuSeparator />
                    
                    <DropdownMenuLabel className="text-xs">Groupement</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => setChartOptions(prev => ({ ...prev, groupByBuilding: !prev.groupByBuilding }))}
                    >
                      <div className="flex items-center justify-between w-full">
                        Grouper par bâtiment
                        {chartOptions.groupByBuilding && <Check className="h-4 w-4" />}
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex">
              <div className="flex flex-1 flex-col justify-center gap-1 border-t md:px-6 md:py-4 text-left even:border-l sm:border-l sm:border-t-0 px-4 py-2">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground text-nowrap pr-1">Énergie totale</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-neutral-500" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[300px]">
                        <p>Énergie totale consommée sur la période.</p>
                        <p className="mt-1">Calculée en intégrant la puissance sur le temps.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <span className="text-xl font-bold leading-none 3xl:text-3xl whitespace-nowrap">
                  <CountUp
                    from={prevTotal}
                    to={total.totalConsumption}
                    separator=" "
                    direction="up"
                    decimals={0}
                    duration={0.1}
                    className="count-up-text"
                  />
                  <span className="text-xs text-muted-foreground ml-1">kWh</span>
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
                    decimals={0}
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
                    decimals={0}
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
                  data={prepareChartData}
                  margin={{ top: 0, right: 50, left: -10, bottom: 10 }}
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
                    tickFormatter={getDateFormatter(processedData.interval)}
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
                          return new Date(value).toLocaleString("fr-FR", {
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
                  {renderLines}
                  <Brush
                    dataKey="date"
                    height={50}
                    stroke="hsl(var(--border))"
                    fill="rgba(0, 0, 0, 0.4)"
                    startIndex={brushStartIndex}
                    endIndex={brushEndIndex}
                    onChange={handleBrushChange}
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    travellerWidth={10}
                    gap={1}
                  />
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
                  decimals={0}
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
                      <p>Estimation basée sur le mix énergétique suivant :</p>
                      <ul className="list-disc ml-4 mt-1">
                        <li>Charbon : ({EMISSION_COEFFICIENTS.charbon} t CO₂/MWh)</li>
                        <li>Fioul : ({EMISSION_COEFFICIENTS.fioul} t CO₂/MWh)</li>
                        <li>Gaz (TAC) : ({EMISSION_COEFFICIENTS.gazTAC} t CO₂/MWh)</li>
                        <li>Gaz (CC) : ({EMISSION_COEFFICIENTS.gazCC} t CO₂/MWh)</li>
                        <li>Gaz (Autre) : ({EMISSION_COEFFICIENTS.gazAutre} t CO₂/MWh)</li>
                        <li>Déchets : ({EMISSION_COEFFICIENTS.dechets} t CO₂/MWh)</li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-xl 3xl:text-3xl font-bold leading-none whitespace-nowrap">
                <CountUp
                  from={0}
                  to={total.emissions}
                  decimals={0}
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
                  to={Math.ceil(total.emissions / TREE_CO2_ABSORPTION)}
                  decimals={0}
                  separator=" "
                  duration={0.1}
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
    </div>
  );
}