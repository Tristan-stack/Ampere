'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

type ConsumptionData = {
  id: string;
  date: string;
  building: string;
  floor: string;
  totalConsumption: number;
  emissions: number;
  name: string;
};

type DataContextType = {
  chartData: ConsumptionData[];
  filteredData: ConsumptionData[];
  aggregatedData: {
    [key: string]: {
      date: string;
      totalConsumption: number;
      emissions: number;
      names: string[]; 
    }[]
  };
  isLoading: boolean;
  loadingProgress: number;
  selectedBuildings: string[];
  setSelectedBuildings: React.Dispatch<React.SetStateAction<string[]>>;
  deviceData: number[];
  labels: string[];
  unit: string;
  deviceName: string;
  efficiencyScore: number;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

const calculateEfficiencyScore = (currentWeekData: ConsumptionData[], previousWeekData: ConsumptionData[]): number => {
  // Si pas de données pour la semaine précédente ou la semaine actuelle, retourner un score neutre
  if (previousWeekData.length === 0 || currentWeekData.length === 0) {
    console.log('Données insuffisantes pour calculer le score, retour à la valeur neutre (5/10)');
    return 5;
  }

  // Calculer la consommation totale pour chaque semaine
  const currentTotal = currentWeekData.reduce((sum, data) => sum + data.totalConsumption, 0);
  const previousTotal = previousWeekData.reduce((sum, data) => sum + data.totalConsumption, 0);

  console.log('Consommation actuelle:', currentTotal);
  console.log('Consommation précédente:', previousTotal);

  // Si la consommation totale précédente est 0, retourner un score neutre
  if (previousTotal === 0) {
    console.log('Consommation précédente nulle, retour à la valeur neutre (5/10)');
    return 5;
  }

  // Calculer le pourcentage de changement
  const changePercent = ((currentTotal - previousTotal) / previousTotal) * 100;
  console.log(`Changement de consommation: ${changePercent.toFixed(2)}%`);

  // Convertir le pourcentage en score (entre 0 et 10)
  let score;
  if (changePercent <= -20) {
    score = 10; // Réduction de 20% ou plus
  } else if (changePercent >= 20) {
    score = 0; // Augmentation de 20% ou plus
  } else {
    // Interpolation linéaire entre -20% et +20%
    score = 5 - (changePercent / 4);
  }

  console.log('Score calculé:', score);
  return Math.round(score * 10) / 10; // Arrondir à une décimale
};

const fetchPreviousWeekData = async (fromTime: number, toTime: number): Promise<ConsumptionData[]> => {
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

  const previousWeekData: ConsumptionData[] = [];

  try {
    for (const device of deviceKeys) {
      console.log('Fetching previous data for device:', device.key);
      console.log('Time range:', new Date(fromTime * 1000), 'to', new Date(toTime * 1000));

      const response = await fetch('/api/getDeviceDataByKey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_key: device.key,
          from: Math.floor(fromTime),
          to: Math.floor(toTime)
        }),
      });

      const data = await response.json();

      if (data.values && data.timestamps) {
        const deviceData = data.timestamps.map((timestamp: string, idx: number) => ({
          id: `${device.key}-prev-${idx}`,
          date: timestamp,
          building: device.building,
          floor: device.floor,
          totalConsumption: data.values[idx],
          emissions: data.values[idx] * 50,
        }));

        previousWeekData.push(...deviceData);
      }
    }

    return previousWeekData;
  } catch (error) {
    console.error('Erreur lors de la récupération des données précédentes:', error);
    return [];
  }
};

const fetchDataForPeriod = async (deviceKeys: Array<{ key: string, building: string, floor: string, name: string }>, fromTime: number, toTime: number): Promise<ConsumptionData[]> => {
  const allData: ConsumptionData[] = [];

  try {
    const promises = deviceKeys.map(device =>
      fetch('/api/getDeviceDataByKey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_key: device.key,
          from: Math.floor(fromTime),
          to: Math.floor(toTime)
        }),
      }).then(res => res.json())
        .then(data => {
          if (data.values && data.timestamps) {
            return data.timestamps.map((timestamp: string, idx: number) => ({
              id: `${device.key}-${idx}`,
              date: timestamp,
              building: device.building,
              floor: device.floor,
              totalConsumption: data.values[idx],
              emissions: data.values[idx] * 50,
              name: device.name,
            }));
          }
          return [];
        })
    );

    const results = await Promise.all(promises);
    results.forEach(deviceData => allData.push(...deviceData));

    return allData;
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    return [];
  }
};

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [chartData, setChartData] = useState<ConsumptionData[]>([]);
  const [filteredData, setFilteredData] = useState<ConsumptionData[]>([]);
  const [aggregatedData, setAggregatedData] = useState<{ [key: string]: { date: string; totalConsumption: number; emissions: number; names: string[] }[] }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedBuildings, setSelectedBuildings] = useState<string[]>(["A", "B", "C"]);
  const [isTestMode, setIsTestMode] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [efficiencyScore, setEfficiencyScore] = useState<number>(5);

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
    const result: { [key: string]: { date: string; totalConsumption: number; emissions: number; names: string[] }[] } = {};

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
        if (!existingDateEntry.names.includes(item.name)) {
          existingDateEntry.names.push(item.name);
        }
      } else {
        result[item.building]?.push({
          date: item.date,
          totalConsumption: item.totalConsumption,
          emissions: item.emissions,
          names: [item.name],
        });
      }
    });


    return result;
  };

  useEffect(() => {
    // Définir la plage de dates par défaut (7 derniers jours)
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    // Sauvegarder la plage par défaut dans les cookies si aucune n'existe
    const savedRange = getCookie('dateRange');
    if (!savedRange) {
      const defaultRange = {
        from: sevenDaysAgo.toISOString(),
        to: now.toISOString()
      };
      document.cookie = `dateRange=${JSON.stringify(defaultRange)}; path=/`;
    }
  }, []);

  const fetchData = async () => {
    if (isInitialLoad) {
      setIsLoading(true);
      setLoadingProgress(0);
    }

    const deviceKeys = [
      { key: '4f887d23-3cf2-4d1c-8ae8-0f0bea45cf09', building: 'A', floor: 'RDC', name: 'A0 Mesure 1' },
      { key: '510478e8-ddfe-40d1-8d2f-f8562e4fb128', building: 'A', floor: '1er étage', name: 'A1 Mesure 1' },

      { key: 'ca8bf525-9259-4cfa-9ebe-856b4356895e', building: 'A', floor: '2e étage', name: 'A2 Mesure 1' },
      { key: '3b36f6d7-8abd-4e79-8154-72ccb92b9273', building: 'A', floor: '3e étage', name: 'A3 Mesure 1' },

      { key: '5ef1fc4b-0bfd-4b13-a174-835d154a0744', building: 'B', floor: 'RDC', name: 'Panneau kibouj 1' },
      { key: '85d14dac-8e5c-477b-a0f8-3e7768fcc8ee', building: 'B', floor: 'RDC', name: 'Panneau statique 1' },

      { key: 'b3195f2e-7071-4729-babd-47ca4f3e252e', building: 'B', floor: 'RDC', name: 'Panneau kibouj 2' },      
      { key: '14ca1560-66ec-417a-99ee-5f7e4ac8e4a1', building: 'B', floor: 'RDC', name: 'Panneau statique 2' },


      { key: '566fbe08-44fa-442a-9fb8-1eadf8f66da1', building: 'B', floor: 'RDC', name: 'B0 Mesure 1' },  
      { key: '01db2140-19c7-4698-9b19-959f8a8f63a9', building: 'B', floor: 'RDC', name: 'B0 Mesure 2' },

      { key: 'eba9db95-7b31-44cf-a715-08bc75d3976c', building: 'B', floor: 'RDC', name: 'B0 Mesure 2' },
      { key: '131be744-6676-47c2-9d8d-c6b503c7220b', building: 'B', floor: 'RDC', name: 'B0 Mesure 4' },

      { key: '22e195a1-30ca-4d2b-a533-0be1b4e93f23', building: 'B', floor: '1er étage', name: 'B1 Mesure 1' },

      { key: '31cea110-651d-4cd2-8edf-add92b13bf17', building: 'C', floor: '1er étage', name: 'C1 Mesure 1' },
      { key: '306e5d7a-fa63-4f86-b117-aa0da4830a80', building: 'C', floor: '2e étage', name: 'C2 VMC/Compresseur QLIO' },

    ];

    const savedRange = getCookie('dateRange');
    if (!savedRange) {
      console.warn('Pas de dateRange dans les cookies.');
      setIsLoading(false);
      setIsInitialLoad(false);
      return;
    }

    try {
      const { from, to } = JSON.parse(savedRange);
      const fromTime = new Date(from).getTime() / 1000;
      const toTime = new Date(to).getTime() / 1000;

      // Fetch des données actuelles
      const currentData = await fetchDataForPeriod(deviceKeys, fromTime, toTime);

      // Fetch des données de la semaine précédente
      const previousFromTime = fromTime - 7 * 24 * 60 * 60;
      const previousToTime = toTime - 7 * 24 * 60 * 60;
      const previousData = await fetchDataForPeriod(deviceKeys, previousFromTime, previousToTime);

      setChartData(currentData);
      updateFilteredAndAggregatedData(currentData, selectedBuildings);

      // Calculer et mettre à jour le score
      const newScore = calculateEfficiencyScore(currentData, previousData);
      console.log('Score brut:', newScore);
      setEfficiencyScore(newScore);

    } catch (error) {
      console.error('Erreur:', error);
      setEfficiencyScore(5);
    } finally {
      setLoadingProgress(100);
      setTimeout(() => {
        setIsLoading(false);
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
      deviceName: '',
      efficiencyScore: Math.max(0, Math.min(10, efficiencyScore)),
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