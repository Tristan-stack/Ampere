import type React from "react";
import { useState } from "react";
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
  maintenance: "bg-yellow-500",
  inactive: "bg-red-500",
};

const calculateTotalPower = (panels: PanelInfo[]) => 
  panels.reduce((sum, panel) => sum + panel.currentTotalPower, 0);

const countPanelsByStatus = (panels: PanelInfo[]) => 
  panels.reduce((acc, panel) => ({
    ...acc,
    [panel.status]: (acc[panel.status] || 0) + 1
  }), {} as Record<string, number>);

const PanelSummary: React.FC<{ panels: PanelInfo[] }> = ({ panels }) => {
  const totalPower = calculateTotalPower(panels);
  const statusCount = countPanelsByStatus(panels);
  
  return (
    <div className="bg-background/20 w-full p-2 px-4 3xl:p-4 rounded-xl mb-2">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm text-gray-400">Production Totale</h3>
          <p className="text-lg 3xl:text-2xl font-bold text-white">{totalPower.toFixed(1)} kW</p>
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

const PanelCard: React.FC<{ panel: PanelInfo }> = ({ panel }) => (
  <div className="p-4 border rounded-xl h-full shadow-md bg-background/30">
    <h3 className="text-sm 3xl:text-md font-semibold text-white">{panel.name}</h3>
    <div className="mt-2 space-y-1">
      <p className="text-xs 3xl:text-sm text-gray-400">
        Production: <span className="text-white">{panel.currentTotalPower} kW</span>
      </p>
      <p className="text-xs 3xl:text-sm hidden 3xl:block text-gray-400">
        Début: <span className="text-white">{panel.startDate}</span>
      </p>
      <div className="flex items-center gap-2 mt-2">
        <div className={`w-3 h-3 rounded-full ${statusColors[panel.status]}`} />
        <span className="text-xs 3xl:text-sm text-gray-300 capitalize">{panel.status}</span>
      </div>
    </div>
  </div>
);

const chartConfig = {
  panneauDynamique1: {
    label: "Panneau dynamique 1",
    color: "hsl(var(--chart-1))",
  },
  panneauDynamique2: {
    label: "Panneau dynamique 2",
    color: "hsl(var(--chart-2))",
  },
  panneauStatique1: {
    label: "Panneau statique 1",
    color: "hsl(var(--chart-3))",
  },
  panneauStatique2: {
    label: "Panneau statique 2",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig

const chartColors = {
  grid: 'hsl(var(--border))',
  text: 'hsl(var(--foreground))',
  axis: 'hsl(var(--border))'
} as const;

const Batimentgraph4: React.FC = () => {
  const [isFirstDisplay, setIsFirstDisplay] = useState(true);
  const { panelData } = useData();
  
  const toggleDisplay = () => {
    setIsFirstDisplay(!isFirstDisplay);
  };

  // Modifier la fonction pour préparer les données du graphique
  const prepareChartData = (data: PanelInfo[]) => {
    const allDates = new Set<string>();
    const dataByPanel: { [key: string]: { date: string; value: number }[] } = {};
    
    // Initialiser les tableaux pour chaque panneau
    data.forEach(panel => {
      dataByPanel[panel.name] = [];
    });

    // Récupérer toutes les dates uniques
    data.forEach(panel => {
      const dates = panel.productionData?.map(d => d.date) || [];
      dates.forEach(date => allDates.add(date));
    });

    // Créer les points de données pour chaque panneau
    const sortedDates = Array.from(allDates).sort();
    const chartData = sortedDates.map(date => {
      const point: any = { date };
      data.forEach(panel => {
        const production = panel.productionData?.find(d => d.date === date)?.value || 0;
        point[panel.name.replace(/\s+/g, '')] = production;
      });
      return point;
    });

    return chartData;
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
                      tickFormatter={(value) => `${value} kW`}
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
