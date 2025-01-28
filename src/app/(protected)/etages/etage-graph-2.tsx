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
  aggregatedData: {
    [key: string]: Array<{
      date: string;
      totalConsumption: number;
      emissions: number;
    }>;
  };
  isExpanded: boolean;
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

const CO2_COEFFICIENT = 0.67175; // Moyenne des coefficients (0.986 + 0.777 + 0.429 + 0.494) / 4
const KWH_TO_MWH = 0.001; // Conversion kWh vers MWh

export const EtageGraph2: React.FC<EtageGraph2Props> = ({ aggregatedData, isExpanded }) => {
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

  const togglePoint = (type: 'min' | 'max') => {
    setSelectedPoints(prev =>
      prev.includes(type)
        ? prev.filter(p => p !== type)
        : [...prev, type]
    );
  };

  const prepareChartData = () => {
    const allDates = [...new Set(
      Object.values(aggregatedData)
        .flat()
        .map(item => item.date)
    )].sort();

    return allDates.map(date => ({
      date,
      ...Object.entries(aggregatedData).reduce((acc, [building, data]) => {
        const consumption = data.find(item => item.date === date)?.totalConsumption || 0;
        return { ...acc, [building]: consumption };
      }, {}),
    }));
  };

  const total = React.useMemo(
    () => {
      const values = Object.values(aggregatedData).flat();
      return {
        totalConsumption: values.length > 0
          ? values.reduce((acc, curr) => acc + curr.totalConsumption, 0)
          : 0,
        maxConsumption: values.length > 0
          ? Math.max(...values.map(item => item.totalConsumption))
          : 0,
        minConsumption: values.length > 0
          ? Math.min(...values.map(item => item.totalConsumption))
          : 0,
      };
    },
    [aggregatedData]
  );

  const chartData = React.useMemo(() => prepareChartData(), [aggregatedData]);

  const getDateFormatter = (interval: string) => {
    return (value: string) => {
      const date = new Date(value);
      return date.toLocaleString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit"
      });
    };
  };

  useEffect(() => {
    setPrevTotal(total.totalConsumption);
    setPrevMax(total.maxConsumption);
    setPrevMin(total.minConsumption);
  }, [total]);

  useEffect(() => {
    if (chartData.length > 0 && brushStartIndex === null) {
      const endIndex = Math.min(100, chartData.length - 1);
      setBrushStartIndex(0);
      setBrushEndIndex(endIndex);
    }
  }, [chartData, brushStartIndex]);

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
    if (brushData.startIndex !== undefined && brushData.endIndex !== undefined) {
      setBrushStartIndex(brushData.startIndex);
      setBrushEndIndex(brushData.endIndex);
    }
  };

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
              <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-2">
                <div className="flex items-start justify-between flex-col">
                  <h2 className="text-lg font-bold">Consommation par étage</h2>

                </div>
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
                <div
                  className={`flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-l sm:border-t-0 sm:px-8 sm:py-2 cursor-pointer hover:bg-accent/50 transition-colors ${selectedPoints.includes('max') ? 'bg-accent/50' : ''
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
                  className={`flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-l sm:border-t-0 sm:px-8 sm:py-2 cursor-pointer hover:bg-accent/50 transition-colors ${selectedPoints.includes('min') ? 'bg-accent/50' : ''
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
            <div className="flex w-full h-full">
              <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-4 text-left even:border-l sm:px-8 sm:py-2">
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
                    to={total.totalConsumption / Object.keys(aggregatedData).length || 0}
                    separator=" "
                    duration={0.1}
                    className="count-up-text"
                  />
                  <span className="text-xs text-muted-foreground ml-1">kW</span>
                </span>
              </div>
              <div className="flex flex-1 flex-col justify-center gap-1 border-l px-6 py-4 text-left sm:px-8 sm:py-2">
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
                    to={(total.totalConsumption * KWH_TO_MWH * CO2_COEFFICIENT)}
                    separator=" "
                    duration={0.1}
                    className="count-up-text"
                  />
                  <span className="text-xs text-muted-foreground ml-1">t CO₂</span>
                </span>
              </div>
              <div className="flex flex-1 flex-col justify-center gap-1 border-l px-6 py-4 text-left sm:px-8 sm:py-2">
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
                    to={Math.round((total.totalConsumption * KWH_TO_MWH * CO2_COEFFICIENT) * 45)}
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
                <h2 className="text-lg font-bold">Consommation par étage</h2>
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
              <div
                className={`flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-l sm:border-t-0 sm:px-8 sm:py-2 cursor-pointer hover:bg-accent/50 transition-colors ${selectedPoints.includes('max') ? 'bg-accent/50' : ''
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
                className={`flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-l sm:border-t-0 sm:px-8 sm:py-2 cursor-pointer hover:bg-accent/50 transition-colors ${selectedPoints.includes('min') ? 'bg-accent/50' : ''
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
                  {Object.entries(aggregatedData).map(([building, data]) => {
                    const minPoint = data.reduce((min, curr) =>
                      curr.totalConsumption < min.totalConsumption ? curr : min
                    );
                    const maxPoint = data.reduce((max, curr) =>
                      curr.totalConsumption > max.totalConsumption ? curr : max
                    );

                    return (
                      <Line
                        key={building}
                        type={chartOptions.curveType}
                        dataKey={building}
                        stroke={buildingColors[building as keyof typeof buildingColors]}
                        strokeWidth={2}
                        name={`Bâtiment ${building}`}
                        dot={(props): ReactElement<SVGElement> | null => {
                          const isMinPoint = selectedPoints.includes('min') &&
                            props.payload.date === minPoint.date;
                          const isMaxPoint = selectedPoints.includes('max') &&
                            props.payload.date === maxPoint.date;

                          if (!isMinPoint && !isMaxPoint) return null;

                          return (
                            <circle
                              key={`${building}-${props.payload.date}-${isMinPoint ? 'min' : 'max'}`}
                              cx={props.cx}
                              cy={props.cy}
                              r={6}
                              fill="white"
                              stroke={buildingColors[building as keyof typeof buildingColors]}
                              strokeWidth={3}
                            />
                          );
                        }}
                        activeDot={{
                          r: 4,
                          fill: "white",
                          stroke: buildingColors[building as keyof typeof buildingColors],
                          strokeWidth: 2
                        }}
                        animationDuration={750}
                        connectNulls
                      />
                    );
                  })}
                  {chartData.length > 0 && brushStartIndex !== null && brushEndIndex !== null && (
                    <Brush
                      dataKey="date"
                      height={30}
                      stroke={chartColors.text}
                      tickFormatter={getDateFormatter(chartOptions.timeInterval)}
                      startIndex={brushStartIndex}
                      endIndex={brushEndIndex}
                      onChange={handleBrushChange}
                      className="mt-4 "
                      fill="hsl(var(--background))"
                      travellerWidth={8}
                      gap={1}
                    >
                      <LineChart>
                        {Object.entries(aggregatedData).map(([building, data]) => {
                          const minPoint = data.reduce((min, curr) =>
                            curr.totalConsumption < min.totalConsumption ? curr : min
                          );
                          const maxPoint = data.reduce((max, curr) =>
                            curr.totalConsumption > max.totalConsumption ? curr : max
                          );

                          return (
                            <Line
                              key={building}
                              type={chartOptions.curveType}
                              dataKey={building}
                              stroke={buildingColors[building as keyof typeof buildingColors]}
                              strokeWidth={1}
                              dot={(props): ReactElement<SVGElement> | null => {
                                const isMinPoint = selectedPoints.includes('min') &&
                                  props.payload.date === minPoint.date;
                                const isMaxPoint = selectedPoints.includes('max') &&
                                  props.payload.date === maxPoint.date;

                                if (!isMinPoint && !isMaxPoint) return null;

                                return (
                                  <circle
                                    key={`brush-${building}-${props.payload.date}-${isMinPoint ? 'min' : 'max'}`}
                                    cx={props.cx}
                                    cy={props.cy}
                                    r={6}
                                    fill="white"
                                    stroke={buildingColors[building as keyof typeof buildingColors]}
                                    strokeWidth={3}
                                  />
                                );
                              }}
                              activeDot={{
                                r: 4,
                                fill: "white",
                                stroke: buildingColors[building as keyof typeof buildingColors],
                                strokeWidth: 2
                              }}
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

          <div className="flex w-full border-t">
            <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-4 text-left even:border-l sm:px-8 sm:py-2">
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
                  to={total.totalConsumption / Object.keys(aggregatedData).length || 0}
                  separator=" "
                  duration={0.1}
                  className="count-up-text"
                />
                <span className="text-xs text-muted-foreground ml-1">kW</span>
              </span>
            </div>
            <div className="flex flex-1 flex-col justify-center gap-1 border-l px-6 py-4 text-left sm:px-8 sm:py-2">
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
                  to={(total.totalConsumption * KWH_TO_MWH * CO2_COEFFICIENT)}
                  separator=" "
                  duration={0.1}
                  className="count-up-text"
                />
                <span className="text-xs text-muted-foreground ml-1">t CO₂</span>
              </span>
            </div>
            <div className="flex flex-1 flex-col justify-center gap-1 border-l px-6 py-4 text-left sm:px-8 sm:py-2">
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
                  to={Math.round((total.totalConsumption * KWH_TO_MWH * CO2_COEFFICIENT) * 45)}
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