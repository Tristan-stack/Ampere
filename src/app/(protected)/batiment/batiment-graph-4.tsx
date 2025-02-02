import type React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChartLine, Grid2x2 } from "lucide-react";

interface PanelInfo {
  name: string;
  currentTotalPower: number;
  status: "active" | "inactive" | "maintenance";
  startDate: string;
}

const panels: PanelInfo[] = [
  { name: "Panneau statique 1", currentTotalPower: 0.8, status: "active", startDate: "2024-01-01" },
  { name: "Panneau statique 2", currentTotalPower: 0.7, status: "active", startDate: "2024-01-01" },
  { name: "Panneau dynamique 1", currentTotalPower: 0.0, status: "maintenance", startDate: "2024-01-01" },
  { name: "Panneau dynamique 2", currentTotalPower: 0.9, status: "active", startDate: "2024-01-01" },
];

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

const Batimentgraph4: React.FC = () => {
  const [isFirstDisplay, setIsFirstDisplay] = useState(true);
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
            <PanelSummary panels={panels} />
            <div className="grid grid-cols-2 gap-2 w-full">
              {panels.map((panel) => (
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
            className="w-full h-full flex items-center justify-center text-white text-2xl font-bold"
          >
            Affichage Alternatif
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Batimentgraph4;
