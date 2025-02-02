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
import { Settings2, Check } from "lucide-react"
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

const aggregateDataByInterval = (data: any[], interval: string) => {
  const aggregatedData: { [key: string]: number } = {};

  data.forEach(item => {
    const date = new Date(item.date);
    let key: string;

    switch (interval) {
      case "5min":
        date.setMinutes(Math.floor(date.getMinutes() / 5) * 5);
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
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setDate(1);
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
      default: // Par défaut, utiliser 15min
        date.setMinutes(Math.floor(date.getMinutes() / 15) * 15);
        date.setSeconds(0);
        key = date.toISOString();
    }

    if (!aggregatedData[key]) {
      aggregatedData[key] = 0;
    }
    aggregatedData[key] += item.totalConsumption;
  });

  return Object.entries(aggregatedData).map(([date, value]) => ({
    date,
    totalConsumption: value
  }));
};

interface MinMaxPoint {
  date: string;
  value: number;
  building: string;
  type: 'min' | 'max';
}

// Nouvelle fonction pour déterminer l'intervalle optimal
const determineOptimalInterval = (data: any[]): ChartOptions["timeInterval"] => {
  if (!data || data.length === 0) return "15min";

  const dates = data.map(item => new Date(item.date).getTime());
  const timeSpanMs = Math.max(...dates) - Math.min(...dates);
  const daysDifference = timeSpanMs / (1000 * 60 * 60 * 24);

  if (daysDifference <= 1) {
    const hoursDifference = timeSpanMs / (1000 * 60 * 60);
    if (hoursDifference <= 2) return "5min";
    if (hoursDifference <= 6) return "15min";
    return "30min";
  }
  if (daysDifference <= 7) return "1h";
  if (daysDifference <= 31) return "1d";
  if (daysDifference <= 90) return "1w";
  return "1m";
};

export function Batimentgraph2({ aggregatedData, loading }: Batimentgraph2Props) {
  const [prevTotal, setPrevTotal] = useState(0);
  const [prevMax, setPrevMax] = useState(0);
  const [prevMin, setPrevMin] = useState(0);
  const [chartOptions, setChartOptions] = useState<ChartOptions>(() => ({
    curveType: "monotone",
    timeInterval: determineOptimalInterval(Object.values(aggregatedData).flat()),
    displayMode: "separate"
  }));
  const [selectedPoints, setSelectedPoints] = useState<('min' | 'max')[]>([]);
  const searchParams = useSearchParams()
  const isHighlighted = searchParams.get('highlight') === 'batiment-graph-2'

  const togglePoint = (type: 'min' | 'max') => {
    setSelectedPoints(prev =>
      prev.includes(type)
        ? prev.filter(p => p !== type)
        : [...prev, type]
    );
  };

  // Trouver les points min et max
  const findMinMaxPoints = React.useMemo(() => {
    let maxPoint: MinMaxPoint = { date: '', value: 0, building: '', type: 'max' };
    let minPoint: MinMaxPoint = { date: '', value: 0, building: '', type: 'min' };

    const allValues = Object.entries(aggregatedData).flatMap(([building, data]) =>
      data.map(point => ({
        date: point.date,
        value: point.totalConsumption,
        building,
      }))
    ).filter(point => point.value !== null && !isNaN(point.value));

    if (allValues.length > 0) {
      const maxValue = allValues.reduce((max, point) =>
        point.value > (max?.value ?? 0) ? point : max
        , allValues[0]);

      const minValue = allValues.reduce((min, point) =>
        point.value < (min?.value ?? 0) ? point : min
        , allValues[0]);

      maxPoint = {
        date: maxValue?.date || '',
        value: maxValue?.value || 0,
        building: maxValue?.building || '',
        type: 'max'
      };
      minPoint = {
        date: minValue?.date || '',
        value: minValue?.value || 0,
        building: minValue?.building || '',
        type: 'min'
      };
    }

    return { maxPoint, minPoint };
  }, [aggregatedData]);

  const total = React.useMemo(
    () => ({
      totalConsumption: Object.values(aggregatedData).flat().reduce((acc, curr) => acc + curr.totalConsumption, 0),
      maxConsumption: findMinMaxPoints.maxPoint.value,
      minConsumption: findMinMaxPoints.minPoint.value,
      emissions: Object.values(aggregatedData).flat().reduce((acc, curr) => acc + curr.emissions, 0),
    }),
    [aggregatedData, findMinMaxPoints]
  );

  console.log((aggregatedData))

  useEffect(() => {
    setPrevTotal(total.totalConsumption);
    setPrevMax(total.maxConsumption);
    setPrevMin(total.minConsumption);
  }, [total]);

  // Fonction pour trier les données par date
  const sortDataByDate = (data: any[]) => {
    return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Préparer les données pour le graphique
  const prepareChartData = () => {
    const allDates = new Set<string>();
    const dataByDate: { [key: string]: ChartDataPoint } = {};

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
        }

        dataByDate[item.date]!.totalConsumption += item.totalConsumption;
        dataByDate[item.date]![`consumption${building}`] = item.totalConsumption;
      });
    });

    return sortDataByDate(Object.values(dataByDate));
  };

  const chartData = React.useMemo(() => prepareChartData(), [aggregatedData, chartOptions.timeInterval]);

  // Modifier le formatage des dates selon l'intervalle
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
                  className="cursor-pointer"
                  onClick={() => setChartOptions(prev => ({ ...prev, curveType: "monotone" }))}
                >
                  <div className="flex items-center justify-between w-full">

                    Courbe lisse
                    {chartOptions.curveType === "monotone" && <Check className="h-4 w-4" />}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setChartOptions(prev => ({ ...prev, curveType: "linear" }))}
                >
                  <div className="flex items-center justify-between w-full">
                    Ligne droite

                    {chartOptions.curveType === "linear" && <Check className="h-4 w-4" />}
                  </div>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs">Intervalle temporel</DropdownMenuLabel>

                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setChartOptions(prev => ({ ...prev, timeInterval: "5min" }))}
                >
                  <div className="flex items-center justify-between w-full">
                    5 minutes

                    {chartOptions.timeInterval === "5min" && <Check className="h-4 w-4" />}
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setChartOptions(prev => ({ ...prev, timeInterval: "15min" }))}
                >
                  <div className="flex items-center justify-between w-full">
                    15 minutes

                    {chartOptions.timeInterval === "15min" && <Check className="h-4 w-4" />}
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setChartOptions(prev => ({ ...prev, timeInterval: "30min" }))}
                >
                  <div className="flex items-center justify-between w-full">
                    30 minutes

                    {chartOptions.timeInterval === "30min" && <Check className="h-4 w-4" />}
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setChartOptions(prev => ({ ...prev, timeInterval: "1h" }))}
                >
                  <div className="flex items-center justify-between w-full">
                    1 heure

                    {chartOptions.timeInterval === "1h" && <Check className="h-4 w-4" />}
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setChartOptions(prev => ({ ...prev, timeInterval: "1d" }))}
                >
                  <div className="flex items-center justify-between w-full">
                    1 jour

                    {chartOptions.timeInterval === "1d" && <Check className="h-4 w-4" />}
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setChartOptions(prev => ({ ...prev, timeInterval: "1w" }))}
                >
                  <div className="flex items-center justify-between w-full">
                    1 semaine

                    {chartOptions.timeInterval === "1w" && <Check className="h-4 w-4" />}
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setChartOptions(prev => ({ ...prev, timeInterval: "1m" }))}
                >
                  <div className="flex items-center justify-between w-full">
                    1 mois

                    {chartOptions.timeInterval === "1m" && <Check className="h-4 w-4" />}
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
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="text-xl font-bold leading-none 3xl:text-3xl whitespace-nowrap">
              <CountUp
                from={prevTotal}
                to={total.totalConsumption}
                separator=" "
                direction="up"
                duration={0.1}
                className="count-up-text"
              />
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
                to={total.maxConsumption}
                separator=" "
                direction="up"
                duration={0.1}
                className="count-up-text"
              />
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
                to={total.minConsumption}
                separator=" "
                direction="up"
                duration={0.1}
                className="count-up-text"
              />
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
                        dot={(props) => {
                          const isMinPoint = selectedPoints.includes('min') &&
                            props.payload.date === findMinMaxPoints.minPoint.date &&
                            `consumption${findMinMaxPoints.minPoint.building}` === props.dataKey;
                          const isMaxPoint = selectedPoints.includes('max') &&
                            props.payload.date === findMinMaxPoints.maxPoint.date &&
                            `consumption${findMinMaxPoints.maxPoint.building}` === props.dataKey;

                          if (!isMinPoint && !isMaxPoint) return false;

                          const pointType = isMinPoint ? 'min' : 'max';
                          const uniqueKey = `${building}-${props.payload.date}-${pointType}`;

                          return (
                            <g key={uniqueKey}>
                              <circle
                                cx={props.cx}
                                cy={props.cy}
                                r={isMinPoint || isMaxPoint ? 6 : 4}
                                fill="white"
                                stroke={buildingColors[building as keyof typeof buildingColors]}
                                strokeWidth={isMinPoint || isMaxPoint ? 3 : 2}
                              />
                              {(isMinPoint || isMaxPoint) && (
                                <text
                                  x={props.cx + 15}
                                  y={props.cy + 4}
                                  textAnchor="start"
                                  fill="white"
                                  fontSize="12"
                                  fontWeight="normal"
                                  stroke={buildingColors[building as keyof typeof buildingColors]}
                                  strokeWidth={3}
                                  paintOrder="stroke"
                                >
                                  {isMinPoint ? 'MIN' : 'MAX'}
                                </text>
                              )}
                            </g>
                          ) as any;
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