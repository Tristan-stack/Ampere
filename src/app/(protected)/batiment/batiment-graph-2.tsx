"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import CountUp from "@/components/countup"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useState, useEffect } from "react"
import { Settings2, Check, Info } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import BounceLoader from "react-spinners/BounceLoader"
import { motion } from "framer-motion"
import { useSearchParams } from 'next/navigation'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const EMISSION_COEFFICIENTS = {
  charbon: 0.986, // t CO2/MWh
  fioul: 0.777,   // t CO2/MWh
  gazTAC: 0.486,  // t CO2/MWh (turbine à combustion)
  gazCC: 0.352,   // t CO2/MWh (co-génération et cycle combiné)
  gazAutre: 0.583,// t CO2/MWh (autres installations gaz)
  dechets: 0.494  // t CO2/MWh (déchets ménagers)
} as const;

// Mix énergétique moyen en France
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

const chartConfig = {
  total: {
    label: "Total",
    color: "hsl(var(--chart-1))",
  },
  byBuilding: {
    label: "Par bâtiments",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

interface Batimentgraph2Props {
  aggregatedData: { [key: string]: { date: string; totalConsumption: number; emissions: number }[] }
  loading: boolean
}
interface ChartDataPoint {
  date: string;
  totalConsumption: number;
  [key: `consumption${string}`]: number;
}
const buildingColors = {
  'A': 'hsl(var(--chart-1))',
  'B': 'hsl(var(--chart-2))',
  'C': 'hsl(var(--chart-3))'
} as const;

// Ajout des couleurs pour les éléments du graphique
const chartColors = {
  grid: 'hsl(var(--border))',
  text: 'hsl(var(--foreground))',
  axis: 'hsl(var(--border))'
} as const;

interface ChartOptions {
  curveType: "linear" | "monotone"
  timeInterval: "5min" | "15min" | "30min" | "1h" | "1d" | "1w" | "1m"
  displayMode: "combined" | "separate"
}

// Ajouter la fonction determineIntervalFromTimeRange
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

// Modifier la fonction determineOptimalInterval
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

interface MinMaxPoint {
  date: string;
  value: number;
  building: string;
  type: 'min' | 'max';
}

export function Batimentgraph2({ aggregatedData, loading }: Batimentgraph2Props) {
  // Déplacer les hooks ici
  const [prevTotal, setPrevTotal] = useState(0);
  const [prevMax, setPrevMax] = useState(0);
  const [prevMin, setPrevMin] = useState(0);
  const [timeInterval, setTimeInterval] = useState<"5min" | "15min" | "30min" | "1h" | "1d" | "1w" | "1m">("15min");
  const [chartOptions, setChartOptions] = useState<ChartOptions>(() => {
    const allData = Object.values(aggregatedData).flat();
    return {
      curveType: "monotone",
      timeInterval: determineOptimalInterval(allData),
      displayMode: "separate"
    };
  });
  const [selectedPoints, setSelectedPoints] = useState<('min' | 'max')[]>([]);
  const searchParams = useSearchParams();
  const isHighlighted = searchParams.get('highlight') === 'batiment-graph-2';

  const togglePoint = (type: 'min' | 'max') => {
    setSelectedPoints(prev =>
      prev.includes(type)
        ? prev.filter(p => p !== type)
        : [...prev, type]
    );
  };

  // Ajouter les fonctions utilitaires à l'intérieur du composant
  const aggregateDataByInterval = React.useCallback((data: any[], interval: string) => {
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
          date.setDate(1);
          date.setHours(0);
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
  }, []);

  // Préparer les données pour le graphique
  const prepareChartData = React.useCallback(() => {
    // Déplacer la logique d'intervalle optimal en dehors de cette fonction
    const dataByDate: { [key: string]: ChartDataPoint } = {};
    const allDates = new Set<string>();

    Object.entries(aggregatedData).forEach(([building, data]) => {
      const aggregatedBuildingData = aggregateDataByInterval(data, chartOptions.timeInterval);

      aggregatedBuildingData.forEach(item => {
        allDates.add(item.date);
        if (!dataByDate[item.date]) {
          dataByDate[item.date] = {
            date: item.date,
            totalConsumption: 0,
            [`consumption${building}`]: 0
          } as ChartDataPoint;
        }

        if (chartOptions.displayMode === "combined") {
          dataByDate[item.date]!.totalConsumption += item.totalConsumption;
        } else {
          dataByDate[item.date]![`consumption${building}`] = item.totalConsumption;
        }
      });
    });

    return Object.values(dataByDate);
  }, [aggregatedData, chartOptions.timeInterval, chartOptions.displayMode]);

  // 2. Optimiser le calcul de l'intervalle optimal
  const optimalInterval = React.useMemo(() => {
    const allData = Object.values(aggregatedData).flat();
    const dates = allData.map(item => new Date(item.date));
    const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const endDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    return determineIntervalFromTimeRange(startDate, endDate);
  }, [aggregatedData]);

  // 3. Mettre à jour l'intervalle de manière optimisée
  React.useEffect(() => {
    if (optimalInterval !== chartOptions.timeInterval) {
      setChartOptions(prev => ({ ...prev, timeInterval: optimalInterval }));
    }
  }, [optimalInterval, chartOptions.timeInterval]);

  // 4. Optimiser le calcul des données du graphique
  const chartData = React.useMemo(() => prepareChartData(), [prepareChartData]);

  // Modifier la fonction findMinMaxPoints
  const findMinMaxPoints = React.useMemo(() => {
    let maxPoint: MinMaxPoint = { date: '', value: 0, building: '', type: 'max' };
    let minPoint: MinMaxPoint = { date: '', value: 0, building: '', type: 'min' };

    if (chartData.length > 0) {
      if (chartOptions.displayMode === "combined") {
        // Pour le mode combiné, chercher dans totalConsumption
        const validPoints = chartData.filter(point => 
          typeof point.totalConsumption === 'number' && 
          !isNaN(point.totalConsumption)
        );

        if (validPoints.length > 0) {
          const maxValue = validPoints.reduce((max, point) => 
            point.totalConsumption > (max?.totalConsumption ?? 0) ? point : max
          , validPoints[0]);

          const minValue = validPoints.reduce((min, point) => 
            point.totalConsumption < (min?.totalConsumption ?? 0) ? point : min
          , validPoints[0]);

          maxPoint = {
            date: maxValue?.date ?? '',
            value: maxValue?.totalConsumption ?? 0,
            building: 'total',
            type: 'max'
          };

          minPoint = {
            date: minValue?.date ?? '',
            value: minValue?.totalConsumption ?? 0,
            building: 'total',
            type: 'min'
          };
        }
      } else {
        // Pour le mode séparé, chercher dans chaque bâtiment
        let globalMax = { value: -Infinity, point: null as any };
        let globalMin = { value: Infinity, point: null as any };

        // Filtrer les points valides pour chaque bâtiment
        chartData.forEach(point => {
          Object.entries(point).forEach(([key, value]) => {
            if (key.startsWith('consumption') && 
                typeof value === 'number' && 
                !isNaN(value) && 
                value !== 0) { // Ignorer les valeurs nulles
              const building = key.replace('consumption', '');
              
              if (value > globalMax.value) {
                globalMax = {
                  value,
                  point: {
                    date: point.date,
                    value,
                    building,
                    type: 'max'
                  }
                };
              }
              
              if (value < globalMin.value) {
                globalMin = {
                  value,
                  point: {
                    date: point.date,
                    value,
                    building,
                    type: 'min'
                  }
                };
              }
            }
          });
        });

        if (globalMax.point) maxPoint = globalMax.point;
        if (globalMin.point) minPoint = globalMin.point;
      }
    }

    return { maxPoint, minPoint };
  }, [chartData, chartOptions.displayMode]);

  // Modifier la fonction getDateFormatter
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
    };
  };

  const total = React.useMemo(() => {
    
    const allData = Object.values(aggregatedData).flat();
    
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
  }, [aggregatedData]);

  useEffect(() => {
    setPrevTotal(total.totalConsumption);
    setPrevMax(total.maxConsumption);
    setPrevMin(total.minConsumption);
  }, [total]);
  // Fonction pour trier les données par date
  const sortDataByDate = (data: any[]) => {
    return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

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
      className="relative h-full w-full rounded-md border"
    >
      <div className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-2 md:px-6 py-1 pb-2 md:py-5 sm:py-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm xl:text-lg font-bold">Consommation totale</h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="w-8 p-2 h-8">
                  <Settings2 className="h-2 w-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Personnalisation</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuLabel className="text-xs">Mode d'affichage</DropdownMenuLabel>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setChartOptions(prev => ({ ...prev, displayMode: "separate" }))}
                >
                  <div className="flex items-center justify-between w-full">
                    Par bâtiment
                    {chartOptions.displayMode === "separate" && <Check className="h-4 w-4" />}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setChartOptions(prev => ({ ...prev, displayMode: "combined" }))}
                >
                  <div className="flex items-center justify-between w-full">
                    Combiné
                    {chartOptions.displayMode === "combined" && <Check className="h-4 w-4" />}
                  </div>
                </DropdownMenuItem>

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
          <p className="text-xs xl:text-sm text-muted-foreground">
            Sur la période sélectionnée.
          </p>
        </div>
        <div className="flex">
          <div className="flex flex-1 flex-col justify-center gap-1 border-t md:px-6 md:py-4 text-left even:border-l sm:border-l sm:border-t-0 px-2 py-1">
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
            className={`flex flex-1 flex-col justify-center gap-1 border-t border-r md:border-r-0 md:px-6 md:py-4 text-left even:border-l sm:border- sm:border-t-0 px-2 py-2 cursor-pointer hover:bg-accent/50 transition-colors ${selectedPoints.includes('max') ? 'bg-accent/50' : ''
              }`}
            onClick={() => togglePoint('max')}
          >
            <span className="text-xs text-muted-foreground">Maximum</span>
            <span className="text-xl font-bold leading-none 3xl:text-3xl whitespace-nowrap">
              <CountUp
                from={prevMax}
                to={findMinMaxPoints.maxPoint.value}
                separator=" "
                direction="up"
                duration={0.1}
                className="count-up-text"
              />
              <span className="text-xs text-muted-foreground ml-1">W</span>
            </span>
          </div>
          <div

            className={`flex flex-1 flex-col justify-center gap-1 border-t md:px-6 md:py-4 text-left even:border-l sm:border-l sm:border-t-0 px-2 py-1 cursor-pointer hover:bg-accent/50 transition-colors ${selectedPoints.includes('min') ? 'bg-accent/50' : ''
              }`}
            onClick={() => togglePoint('min')}
          >
            <span className="text-xs text-muted-foreground">Minimum</span>
            <span className="text-xl font-bold leading-none 3xl:text-3xl whitespace-nowrap">
              <CountUp
                from={prevMin}
                to={findMinMaxPoints.minPoint.value}
                separator=" "
                direction="up"
                duration={0.1}
                className="count-up-text"
              />
              <span className="text-xs text-muted-foreground ml-1">W</span>
            </span>
          </div>
        </div>
      </div>

      <div className="h-full w-full">
        <ChartContainer
          config={chartConfig}
          className="h-full w-full"
        >
          {loading ? (
            <div className="flex justify-center items-center -mt-8 h-full">
              <BounceLoader color='#00ff96' size={25} className='drop-shadow-[0_0_10px_rgba(47,173,121,1)]' />
            </div>
          ) : (
            <div className="h-full w-full ">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 20, right: 50, left: -10, bottom: 100 }}
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
                  {chartOptions.displayMode === "combined" ? (
                    <Line
                      type={chartOptions.curveType}
                      dataKey="totalConsumption"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      name="Consommation totale"
                      animationDuration={750}
                      connectNulls
                    />
                  ) : (
                    Object.keys(aggregatedData).map((building) => (
                      <Line
                        key={building}
                        type={chartOptions.curveType}
                        dataKey={`consumption${building}`}
                        stroke={buildingColors[building as keyof typeof buildingColors]}
                        strokeWidth={2}
                        dot={(props: any) => {
                          // Vérifier que les coordonnées sont valides
                          if (typeof props.cx !== 'number' || typeof props.cy !== 'number' || 
                              isNaN(props.cx) || isNaN(props.cy) || 
                              props.value === undefined || props.payload?.date === undefined) {
                            return <circle cx={0} cy={0} r={0} fill="none" />;
                          }

                          const isMinPoint = selectedPoints.includes('min') && 
                            props.payload.date === findMinMaxPoints.minPoint.date && 
                            Math.abs(props.value - findMinMaxPoints.minPoint.value) < 0.01;
                          
                          const isMaxPoint = selectedPoints.includes('max') && 
                            props.payload.date === findMinMaxPoints.maxPoint.date && 
                            Math.abs(props.value - findMinMaxPoints.maxPoint.value) < 0.01;

                          // N'afficher que les points min/max quand ils sont sélectionnés
                          if (!isMinPoint && !isMaxPoint) {
                            return <circle cx={0} cy={0} r={0} fill="none" />;
                          }

                          // Afficher un point plus gros pour les min/max sélectionnés
                          return (
                            <circle
                              cx={props.cx}
                              cy={props.cy}
                              r={6}
                              fill={isMaxPoint ? "red" : "blue"}
                              stroke="white"
                              strokeWidth={2}
                            />
                          );
                        }}
                        name={`Bâtiment ${building}`}
                        animationDuration={750}
                        connectNulls
                      />
                    ))
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartContainer>
      </div>
    </motion.div>
  )
}