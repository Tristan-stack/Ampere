"use client";
import React, { useState, useEffect } from "react";
import { Batimentgraph2 } from "./batiment-graph-2";
import Batimentgraph4 from "./batiment-graph-4";
import { BatimentgraphTable } from "./batiment-graph-tableau";

type ConsumptionData = {
  id: string;
  date: string;
  building: string;
  floor: string;
  totalConsumption: number;
  emissions: number;
};

const BatA = () => {
  const [filteredData, setFilteredData] = useState<ConsumptionData[]>([]);
  const [chartData, setChartData] = useState<ConsumptionData[]>([]);
  const [aggregatedData, setAggregatedData] = useState<{ [key: string]: { date: string; totalConsumption: number; emissions: number }[] }>({});
  const [loading, setLoading] = useState(true);
  const [selectedBuildings, setSelectedBuildings] = useState<string[]>(["A", "B", "C"]);

  const getCookie = (name: string) => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i]?.trim();
      if (c?.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
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
        setLoading(false);
        return;
      }

      const { from, to } = JSON.parse(savedRange);
      const fromTime = new Date(from).getTime();
      const toTime = new Date(to).getTime();

      try {
        const allData: ConsumptionData[] = [];

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
            totalConsumption: data.values[filteredIndices[idx]],
            emissions: data.values[filteredIndices[idx]] * 50,
          }));

          allData.push(...deviceData);
        }

        setChartData(allData);
        updateFilteredAndAggregatedData(allData);
      } catch (error) {
        console.error('Erreur lors de la récupération des données du device :', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const updateFilteredAndAggregatedData = (data: ConsumptionData[]) => {
    const filtered = data.filter(item => selectedBuildings.includes(item.building));

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

  const handleBuildingSelection = (building: string) => {
    const updatedSelection = selectedBuildings.includes(building)
      ? selectedBuildings.filter(b => b !== building)
      : [...selectedBuildings, building];

    setSelectedBuildings(updatedSelection);
    updateFilteredAndAggregatedData(chartData);
  };

  return (
    <div className="w-full space-y-4 flex flex-col justify-center mx-auto">
      <div className="w-full h-1/2 flex space-x-4">
        <div className="w-1/3 bg-neutral-800 rounded-md p-4">
          <div className="h-full">
            <div className="w-full h-full bg-neutral-900 rounded-md p-4">
              <h3 className="text-white text-lg mb-4">Sélection des bâtiments</h3>
              <div className="flex flex-col space-y-2">
                {["A", "B", "C"].map(building => (
                  <label key={building} className="flex items-center space-x-2 text-white">
                    <input
                      type="checkbox"
                      checked={selectedBuildings.includes(building)}
                      onChange={() => handleBuildingSelection(building)}
                    />
                    <span>Bâtiment {building}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="w-2/3 bg-neutral-800 rounded-md">
          <div className="h-full">
            <div className="w-full h-full bg-neutral-900 rounded-md flex items-center justify-center">
              <Batimentgraph2 aggregatedData={aggregatedData} loading={loading} />
            </div>
          </div>
        </div>
      </div>
      <div className="w-full h-1/2 flex space-x-4">
        <div className="w-1/3 bg-neutral-800 rounded-md">
          <div className="h-full">
            <div className="w-full h-full bg-neutral-900 rounded-md">
              {/* Vous pouvez ajouter d'autres composants ou informations ici */}
            </div>
          </div>
        </div>
        <div className="w-2/3 h-full flex space-x-4">
          <div className="w-1/2 bg-neutral-800 rounded-md">
            <div className="h-full">
              <div className="w-full h-full bg-neutral-900 rounded-md">
                <BatimentgraphTable filteredData={filteredData} loading={loading} />
              </div>
            </div>
          </div>
          <div className="w-1/2 bg-neutral-900 rounded-md">
            <div className="h-full">
              <div className="w-full h-full rounded-md">
                <Batimentgraph4 />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatA;
