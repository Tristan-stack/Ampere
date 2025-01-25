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
import { Settings2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

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
  showDots: boolean
  curveType: "linear" | "monotone"
  timeInterval: "5min" | "15min" | "30min" | "1h" | "1d"
}

const aggregateDataByInterval = (data: any[], interval: string) => {
  // Si l'intervalle est 5min, retourner les données telles quelles
  if (interval === "5min") {
    return data;
  }

  const aggregatedData: { [key: string]: number } = {};
  
  data.forEach(item => {
    const date = new Date(item.date);
    let key: string;
    
    switch(interval) {
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
        key = item.date;
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

export function Batimentgraph2({ aggregatedData, loading }: Batimentgraph2Props) {
  const [prevTotal, setPrevTotal] = useState(0);
  const [prevMax, setPrevMax] = useState(0);
  const [prevMin, setPrevMin] = useState(0);
  const [chartOptions, setChartOptions] = useState<ChartOptions>({
    showDots: false,
    curveType: "monotone",
    timeInterval: "5min"
  });

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

      maxPoint = { ...maxValue, type: 'max' };
      minPoint = { ...minValue, type: 'min' };
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
    const dataByDate: { [key: string]: { [key: string]: number } & { date: string } } = {};

    // Agréger les données pour chaque bâtiment selon l'intervalle choisi
    Object.entries(aggregatedData).forEach(([building, data]) => {
      const aggregatedBuildingData = aggregateDataByInterval(data, chartOptions.timeInterval);
      
      aggregatedBuildingData.forEach(item => {
        allDates.add(item.date);
        if (!dataByDate[item.date]) {
          dataByDate[item.date] = {
            date: item.date,
          };
        }
        dataByDate[item.date][`consumption${building}`] = item.totalConsumption;
      });
    });

    return sortDataByDate(Object.values(dataByDate));
  };

  const chartData = React.useMemo(() => prepareChartData(), [aggregatedData, chartOptions.timeInterval]);

  // Modifier le formatage des dates selon l'intervalle
  const getDateFormatter = (interval: string) => {
    switch(interval) {
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
    <div className="relative h-full w-full rounded-md border">
      <div className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Consommation totale</h2>
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
                  <span className={chartOptions.curveType === "monotone" ? "font-bold" : ""}>
                    Courbe lisse
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setChartOptions(prev => ({ ...prev, curveType: "linear" }))}
                >
                  <span className={chartOptions.curveType === "linear" ? "font-bold" : ""}>
                    Ligne droite
                  </span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs">Intervalle temporel</DropdownMenuLabel>
                
                <DropdownMenuItem
                  onClick={() => setChartOptions(prev => ({ ...prev, timeInterval: "5min" }))}
                >
                  <span className={chartOptions.timeInterval === "5min" ? "font-bold" : ""}>
                    5 minutes
                  </span>
                </DropdownMenuItem>
                
                <DropdownMenuItem
                  onClick={() => setChartOptions(prev => ({ ...prev, timeInterval: "15min" }))}
                >
                  <span className={chartOptions.timeInterval === "15min" ? "font-bold" : ""}>
                    15 minutes
                  </span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setChartOptions(prev => ({ ...prev, timeInterval: "30min" }))}
                >
                  <span className={chartOptions.timeInterval === "30min" ? "font-bold" : ""}>
                    30 minutes
                  </span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setChartOptions(prev => ({ ...prev, timeInterval: "1h" }))}
                >
                  <span className={chartOptions.timeInterval === "1h" ? "font-bold" : ""}>
                    1 heure
                  </span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setChartOptions(prev => ({ ...prev, timeInterval: "1d" }))}
                >
                  <span className={chartOptions.timeInterval === "1d" ? "font-bold" : ""}>
                    1 jour
                  </span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs">Options</DropdownMenuLabel>
                
                <DropdownMenuItem
                  onClick={() => setChartOptions(prev => ({ ...prev, showDots: !prev.showDots }))}
                >
                  <span className={chartOptions.showDots ? "font-bold" : ""}>
                    Afficher les points
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-sm text-muted-foreground">
            Sur la période sélectionnée.
          </p>
        </div>
        <div className="flex">
          <div className="flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-l sm:border-t-0 sm:px-8 sm:py-2">
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
          <div className="flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-l sm:border-t-0 sm:px-8 sm:py-2">
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
          <div className="flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-l sm:border-t-0 sm:px-8 sm:py-2">
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
          <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 50, left: -10, bottom: 90 }}
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
                {Object.keys(aggregatedData).map((building) => (
                  <Line
                    key={building}
                    type={chartOptions.curveType}
                    dataKey={`consumption${building}`}
                    stroke={buildingColors[building as keyof typeof buildingColors]}
                    strokeWidth={2}
                    dot={chartOptions.showDots ? {
                      r: 4,
                      fill: "white",
                      stroke: buildingColors[building as keyof typeof buildingColors],
                      strokeWidth: 2
                    } : false}
                    name={`Bâtiment ${building}`}
                    animationDuration={750}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>
      </div>
    </div>
  )
}