import * as React from "react"
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChartLine, Grid2x2 } from "lucide-react";
import { useData } from '@/app/(protected)/context/DataContext';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface PanelInfo {
  name: string;
  currentTotalPower: number;
  status: "active" | "inactive" | "maintenance";
  startDate: string;
  productionData?: { date: string; value: number }[];
}

const statusColors = {
  active: "bg-green-500",
  inactive: "bg-yellow-500",
  maintenance: "bg-yellow-500",
};

const calculateTotalPower = (panels: PanelInfo[]) => {
  let totalPower = 0;

  panels.forEach(panel => {
    if (panel.productionData && panel.productionData.length > 0) {
      const lastMeasure = panel.productionData[panel.productionData.length - 1];
      totalPower += lastMeasure?.value || 0;
    }
  });

  return Number(totalPower.toFixed(1));
};

const calculatePanelEnergy = (panel: PanelInfo) => {
  let totalEnergy = 0;

  if (panel.productionData && panel.productionData.length > 0) {
    panel.productionData.forEach((measure, index) => {
      if (index > 0) {
        const currentTime = new Date(measure.date).getTime();
        const previousTime = new Date(panel.productionData![index - 1]?.date ?? measure.date).getTime();
        const timeInterval = (currentTime - previousTime) / (1000 * 60 * 60); // en heures

        const avgPower = (measure.value + (panel.productionData![index - 1]?.value ?? 0)) / 2;
        totalEnergy += avgPower * timeInterval;
      }
    });
  }

  return Number(totalEnergy.toFixed(3));
};

const countPanelsByStatus = (panels: PanelInfo[]) =>
  panels.reduce((acc, panel) => ({
    ...acc,
    [panel.status]: (acc[panel.status] || 0) + 1
  }), {} as Record<string, number>);

const calculatePanelPower = (panel: PanelInfo) => {
  // Retourner la dernière valeur de production du panneau
  if (panel.productionData && panel.productionData.length > 0) {
    const lastMeasure = panel.productionData[panel.productionData.length - 1];
    return Number(lastMeasure?.value.toFixed(1) || 0);
  }
  return 0;
};

const PanelSummary: React.FC<{ panels: PanelInfo[] }> = ({ panels }) => {
  const totalPower = calculateTotalPower(panels);
  const statusCount = countPanelsByStatus(panels);

  return (
    <div className="bg-background/20 w-full p-2 px-4 3xl:p-4 rounded-xl mb-2">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm text-gray-400">Production Instantanée</h3>
          <p className="text-lg 3xl:text-2xl font-bold text-white">{totalPower} W</p>
        </div>
        <div>
          <h3 className="text-sm text-gray-400">État des panneaux</h3>
          <div className="flex gap-3 mt-1">
            {Object.entries(statusCount).map(([status, count]) => (
              <div key={status} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${statusColors[status as keyof typeof statusColors]}`} />
                <span className="text-sm text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const PanelCard: React.FC<{ panel: PanelInfo }> = ({ panel }) => {
  const currentPower = panel.productionData && panel.productionData.length > 0
    ? panel.productionData[panel.productionData.length - 1]?.value || 0
    : 0;

  // Déterminer le statut d'affichage en fonction de la production
  const displayStatus = currentPower === 0 ? "inactive" : panel.status;

  return (
    <div className="p-4 border rounded-xl h-full shadow-md bg-background/30">
      <h3 className="text-sm 3xl:text-md font-semibold text-white">{panel.name}</h3>
      <div className="mt-2 space-y-1">
        <p className="text-xs 3xl:text-sm text-gray-400">
          Production: <span className="text-white">{currentPower.toFixed(1)} W</span>
        </p>
        <p className="text-xs 3xl:text-sm hidden 3xl:block text-gray-400">
          Début: <span className="text-white">{panel.startDate}</span>
        </p>
        <div className="flex items-center gap-2 mt-2">
          <div className={`w-3 h-3 rounded-full ${statusColors[displayStatus]}`} />
          <span className="text-xs 3xl:text-sm text-gray-300 capitalize">{displayStatus}</span>
        </div>
      </div>
    </div>
  );
};

const chartConfig = {
  "Panneau dynamique 1": {
    label: "Panneau dynamique 1",
    color: "hsl(var(--chart-2) / 1)",
  },
  "Panneau dynamique 2": {
    label: "Panneau dynamique 2",
    color: "hsl(var(--chart-2) / 0.8)",
  },
  "Panneau statique 1": {
    label: "Panneau statique 1",
    color: "hsl(var(--chart-2) / 0.6)",
  },
  "Panneau statique 2": {
    label: "Panneau statique 2",
    color: "hsl(var(--chart-2) / 0.4)",
  },
} satisfies ChartConfig

const chartColors = {
  grid: 'hsl(var(--border))',
  text: 'hsl(var(--foreground))',
  axis: 'hsl(var(--border))'
} as const;

// Ajouter la fonction d'agrégation
const aggregateDataByInterval = (data: { date: string; value: number }[], interval: string) => {
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
      default:
        key = date.toISOString();
    }

    if (!aggregatedData[key]) {
      aggregatedData[key] = { total: 0, count: 0 };
    }
    aggregatedData[key]!.total += item.value;
    aggregatedData[key]!.count += 1;
  });

  return Object.entries(aggregatedData).map(([date, values]) => ({
    date,
    value: values.total / values.count // Moyenne pour la période
  }));
};
const Batimentgraph4: React.FC = () => {
  const [isFirstDisplay, setIsFirstDisplay] = useState(true);
  const { panelData } = useData();
  const [timeInterval, setTimeInterval] = useState<"5min" | "15min" | "30min" | "1h" | "1d">("15min");
  console.log('panelData', panelData)
  // Déterminer l'intervalle optimal
  const determineOptimalInterval = React.useCallback((data: PanelInfo[]) => {
    const allData = data.flatMap(panel => panel.productionData || []);
    if (!allData || allData.length === 0) return "15min";

    const dates = allData.map(item => new Date(item.date).getTime());
    const timeSpanMs = Math.max(...dates) - Math.min(...dates);
    const daysDifference = timeSpanMs / (1000 * 60 * 60 * 24);
    const pointCount = allData.length;

    if (pointCount > 500) {
      if (daysDifference > 14) return "1d";
      if (daysDifference > 7) return "1h";
      return "1h";
    }

    if (daysDifference <= 1) {
      if (pointCount > 200) return "30min";
      if (pointCount > 100) return "15min";
      return "5min";
    }

    return "1h";
  }, []);

  // Mettre à jour l'intervalle automatiquement
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const optimalInterval = determineOptimalInterval(panelData);
    setTimeInterval(optimalInterval);
  }, [panelData, determineOptimalInterval]);

  const prepareChartData = React.useCallback((data: PanelInfo[]) => {
    const allDates = new Set<string>();
    const dataByPanel: { [key: string]: { date: string; value: number }[] } = {};

    data.forEach(panel => {
      if (panel.productionData) {
        const normalizedData = panel.productionData.map(item => ({
          date: item.date,
          value: item.value > 100000 ? item.value / 1000 : item.value
        }));

        const aggregatedPanelData = aggregateDataByInterval(normalizedData, timeInterval);
        aggregatedPanelData.forEach(item => {
          allDates.add(item.date);
        });
        dataByPanel[panel.name] = aggregatedPanelData;
      }
    });

    const sortedDates = Array.from(allDates).sort();
    return sortedDates.map(date => {
      const point: any = { date };
      Object.entries(dataByPanel).forEach(([panelName, panelData]) => {
        const measure = panelData.find(d => d.date === date);
        point[panelName] = measure?.value || null;
      });
      return point;
    });
  }, [timeInterval]);

  const toggleDisplay = () => {
    setIsFirstDisplay(!isFirstDisplay);
  };

  return (
    <div
      className="relative w-full h-full p-2 rounded-lg"
    >
      <div
        className="absolute top-1 z-10 right-1"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleDisplay}
          className="bg-background hover:bg-neutral-800 py-2 px-2 h-auto 3xl:px-2 3xl:py-2"
        >
          <AnimatePresence mode="wait">
            {isFirstDisplay ? (
              <motion.div
                key="chart"
                initial={{ opacity: 0, rotate: -180 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 180 }}
                transition={{ duration: 0.2 }}
              >
                <ChartLine className="w-4 h-4" />
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0, rotate: -180 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 180 }}
                transition={{ duration: 0.2 }}
              >
                <Grid2x2 className="w-4 h-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </div>
      <AnimatePresence mode="wait">
        {isFirstDisplay ? (
          <motion.div
            key="display1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full z-0 h-full flex flex-col items-center justify-center"
          >
            <PanelSummary panels={panelData} />
            <div className="grid grid-cols-2 gap-2 w-full">
              {panelData.map((panel) => (
                <PanelCard key={panel.name} panel={panel} />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="display2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full flex flex-col"
          >
            <div className="text-white text-xl font-bold mb-4 px-4">
              Production Solaire
            </div>
            <div className="flex-1">
              <ChartContainer
                config={chartConfig}
                className="h-full w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={prepareChartData(panelData)}
                    margin={{ top: 20, right: 50, left: -10, bottom: 20 }}
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
                      tickFormatter={(value) => {
                        return new Date(value).toLocaleDateString("fr-FR", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        });
                      }}
                    />
                    <YAxis
                      tick={{ fill: chartColors.text }}
                      axisLine={{ stroke: chartColors.axis }}
                      tickLine={{ stroke: chartColors.axis }}
                      tickFormatter={(value) => `${value} W`}
                      domain={['auto', 'auto']}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          className="w-fit"
                          nameKey="production"
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
                    {Object.entries(chartConfig).map(([key, config]) => (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={config.color}
                        strokeWidth={2}
                        name={config.label}
                        animationDuration={750}
                        dot={false}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Batimentgraph4;
