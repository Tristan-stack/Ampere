'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

type ConsumptionData = {
  id: string;
  date: string;
  building: string;
  floor: string;
  totalConsumption: number;
  emissions: number;
};

type DataContextType = {
  chartData: ConsumptionData[];
  filteredData: ConsumptionData[];
  aggregatedData: { [key: string]: { date: string; totalConsumption: number; emissions: number }[] };
  isLoading: boolean;
  loadingProgress: number;
  selectedBuildings: string[];
  setSelectedBuildings: React.Dispatch<React.SetStateAction<string[]>>;
  deviceData: number[];
  labels: string[];
  unit: string;
  deviceName: string;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [chartData, setChartData] = useState<ConsumptionData[]>([]);
  const [filteredData, setFilteredData] = useState<ConsumptionData[]>([]);
  const [aggregatedData, setAggregatedData] = useState<{ [key: string]: { date: string; totalConsumption: number; emissions: number }[] }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedBuildings, setSelectedBuildings] = useState<string[]>(["A", "B", "C"]);
  const [isTestMode, setIsTestMode] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const getCookie = (name: string) => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i]?.trim();
      if (c?.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  const updateFilteredAndAggregatedData = (data: ConsumptionData[], buildings: string[]) => {
    const filtered = data.filter(item => buildings.includes(item.building));

    const aggregated: { [key: string]: ConsumptionData } = {};
    filtered.forEach(item => {
      const key = `${item.building}-${item.floor}`;
      if (!aggregated[key]) {
        aggregated[key] = { ...item, totalConsumption: 0, emissions: 0 };
      }
      aggregated[key].totalConsumption += item.totalConsumption;
      aggregated[key].emissions += item.emissions;
    });

    setFilteredData(Object.values(aggregated));
    setAggregatedData(aggregateDataByBuildingAndDate(filtered));
  };

  const aggregateDataByBuildingAndDate = (data: ConsumptionData[]) => {
    const result: { [key: string]: { date: string; totalConsumption: number; emissions: number }[] } = {};

    data.forEach(item => {
      if (!result[item.building]) {
        result[item.building] = [];
      }
    });

    data.forEach(item => {
      const existingDateEntry = result[item.building]?.find(entry => entry.date === item.date);
      if (existingDateEntry) {
        existingDateEntry.totalConsumption += item.totalConsumption;
        existingDateEntry.emissions += item.emissions;
      } else {
        result[item.building]?.push({
          date: item.date,
          totalConsumption: item.totalConsumption,
          emissions: item.emissions,
        });
      }
    });

    return result;
  };

  const fetchData = async () => {
    if (isInitialLoad) {
      setIsLoading(true);
      setLoadingProgress(0);
    }

    const deviceKeys = [
      { key: '4f887d23-3cf2-4d1c-8ae8-0f0bea45cf09', building: 'A', floor: 'Rez-de-chaussée' },
      { key: '510478e8-ddfe-40d1-8d2f-f8562e4fb128', building: 'A', floor: '1er étage' },
      { key: 'ca8bf525-9259-4cfa-9ebe-856b4356895e', building: 'A', floor: '2e étage' },
      { key: '3b36f6d7-8abd-4e79-8154-72ccb92b9273', building: 'A', floor: '3e étage' },
      { key: '5ef1fc4b-0bfd-4b13-a174-835d154a0744', building: 'B', floor: 'Rez-de-chaussée' },
      { key: '85d14dac-8e5c-477b-a0f8-3e7768fcc8ee', building: 'B', floor: 'Rez-de-chaussée' },
      { key: 'b3195f2e-7071-4729-babd-47ca4f3e252e', building: 'B', floor: 'Rez-de-chaussée' },
      { key: '14ca1560-66ec-417a-99ee-5f7e4ac8e4a1', building: 'B', floor: 'Rez-de-chaussée' },
      { key: '566fbe08-44fa-442a-9fb8-1eadf8f66da1', building: 'B', floor: 'Rez-de-chaussée' },
      { key: '01db2140-19c7-4698-9b19-959f8a8f63a9', building: 'B', floor: 'Rez-de-chaussée' },
      { key: 'eba9db95-7b31-44cf-a715-08bc75d3976c', building: 'B', floor: 'Rez-de-chaussée' },
      { key: '131be744-6676-47c2-9d8d-c6b503c7220b', building: 'B', floor: 'Rez-de-chaussée' },
      { key: '22e195a1-30ca-4d2b-a533-0be1b4e93f23', building: 'B', floor: '1er étage' },
      { key: '31cea110-651d-4cd2-8edf-add92b13bf17', building: 'C', floor: '1er étage' },
      { key: '306e5d7a-fa63-4f86-b117-aa0da4830a80', building: 'C', floor: '2e étage' },
    ];

    const savedRange = getCookie('dateRange');
    if (!savedRange) {
      console.warn('Pas de dateRange dans les cookies.');
      setIsLoading(true);
      setIsInitialLoad(false);
      return;
    }

    const { from, to } = JSON.parse(savedRange);
    const fromTime = new Date(from).getTime();
    const toTime = new Date(to).getTime();

    try {
      const allData: ConsumptionData[] = [];
      const totalDevices = deviceKeys.length;
      let loadedDevices = 0;

      for (const device of deviceKeys) {
        const response = await fetch('/api/getDeviceDataByKey', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            device_key: device.key,
          }),
        });

        const data = await response.json();

        const filteredTimestamps = data.timestamps.filter((timestamp: string) => {
          const recordTime = new Date(timestamp).getTime();
          return recordTime >= fromTime && recordTime <= toTime;
        });

        const filteredIndices = filteredTimestamps.map((timestamp: string) =>
          data.timestamps.indexOf(timestamp)
        );

        const deviceData = filteredTimestamps.map((timestamp: string, idx: number) => ({
          id: `${device.key}-${filteredIndices[idx]}`,
          date: timestamp,
          building: device.building,
          floor: device.floor,
          totalConsumption: isTestMode ? 
            data.values[filteredIndices[idx]] * 0.9 :
            data.values[filteredIndices[idx]],
          emissions: isTestMode ?
            data.values[filteredIndices[idx]] * 50 * 0.9 :
            data.values[filteredIndices[idx]] * 50,
        }));

        allData.push(...deviceData);
        loadedDevices++;
        setLoadingProgress(Math.floor((loadedDevices / totalDevices) * 100));
      }

      setChartData(allData);
      updateFilteredAndAggregatedData(allData, selectedBuildings);
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
    } finally {
      setLoadingProgress(100);
      setTimeout(() => {
        setIsLoading(true);
      }, 1500);
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    if (isTestMode) {
      const timer = setTimeout(() => {
        console.log("Rafraîchissement des données avec les vraies valeurs...");
        setIsTestMode(false);
        fetchData();
      }, 20000);
      return () => clearTimeout(timer);
    }

    const interval = setInterval(() => {
      fetchData();
    }, 6 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isTestMode]);

  useEffect(() => {
    updateFilteredAndAggregatedData(chartData, selectedBuildings);
  }, [selectedBuildings, chartData]);

  return (
    <DataContext.Provider value={{ 
      chartData, 
      filteredData, 
      aggregatedData, 
      isLoading,
      loadingProgress,
      selectedBuildings, 
      setSelectedBuildings,
      deviceData: [],
      labels: [],
      unit: '',
      deviceName: ''
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData doit être utilisé à l\'intérieur d\'un DataProvider');
  }
  return context;
}; 