"use client"

import dynamic from 'next/dynamic';
import React, { useEffect, useState } from "react";

const NetworkGraph = dynamic(() => import('@/components/network-graph'), { ssr: false });

const CarteInterractive = () => {
  interface Node {
    id: string;
    group: number;
    consumption: number;
    floor?: string;
  }

  interface Link {
    source: string;
    target: string;
    value: number;
  }

  const [graphData, setGraphData] = useState<{ nodes: Node[], links: Link[] }>({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const buildGraphData = () => {
      const deviceKeys = [
        '4f887d23-3cf2-4d1c-8ae8-0f0bea45cf09',
        '510478e8-dbfe-40d1-8d2f-18562e4fb128',
        '14375bc7-eb4f-4cac-88f8-ae6be2dde5cd',
        'ca8bf525-9259-4cfa-9ebe-856b4356895e',
        '3b36f5d7-8abd-4e79-8154-72ccb92b9273',
        '5ef1fc4b-0bfd-4b13-a174-835d154a0744',
        '566fbe08-44fa-442a-9fb8-1eadf8f66da1',
        '131be744-6676-47c2-9d8d-c6b503c7220b',
        '22e195a1-30ca-4d2b-a533-0be1b4e93f23',
        '31cea110-6514-4cd2-8edf-add92b13bf17',
        '306e5d7a-fa63-4f86-b117-aa0da4830a80'
      ];

      const results = deviceKeys.map((key, index) => ({
        values: Array(10).fill(0).map(() => Math.random() * 1000),
        timestamps: Array(10).fill(0).map((_, i) => new Date(Date.now() - i * 3600000).toISOString())
      }));

      const buildingConsumption = { A: 0, B: 0, C: 0 };
      const deviceNodes = results.map((data, index) => {
        const deviceKey = deviceKeys[index];
        if (!deviceKey) return null;
        const deviceInfo = getDeviceInfoFromKey(deviceKey);
        const consumption = calculateConsumption(data.values, data.timestamps);
        buildingConsumption[deviceInfo.building] += consumption;
        return {
          id: deviceInfo.name,
          group: getBuildingGroup(deviceInfo.building),
          consumption,
          floor: deviceInfo.floor
        };
      });

      const nodes = [
        { id: "Bâtiment A", group: 1, consumption: buildingConsumption.A },
        { id: "Bâtiment B", group: 2, consumption: buildingConsumption.B },
        { id: "Bâtiment C", group: 3, consumption: buildingConsumption.C },
        ...deviceNodes.filter(node => node !== null) as Node[]
      ];

      const links = [
        { source: "Bâtiment A", target: "Bâtiment B", value: 1 },
        { source: "Bâtiment B", target: "Bâtiment C", value: 1 },
        { source: "Bâtiment C", target: "Bâtiment A", value: 1 },
        ...deviceNodes.filter(node => node !== null).map(node => ({
          source: `Bâtiment ${node!.id.charAt(0)}`,
          target: node!.id,
          value: 0.5
        }))
      ];

      setGraphData({ nodes, links });
      setIsLoading(false);
    };

    buildGraphData();
  }, []);

  interface ConsumptionData {
    values: number[];
    timestamps: string[];
  }

  const calculateConsumption = (values: number[], timestamps: string[]): number => {
    if (!values?.length || values.length < 2 || !timestamps?.length || timestamps.length < 2) return 0;

    return values.slice(0, -1).reduce((total, value, i) => {
      const currentPowerKw = value / 1000;
      const startTime = timestamps[i];
      const endTime = timestamps[i + 1];
      if (!startTime || !endTime) return total;
      const duration = (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 3600);
      return total + (currentPowerKw * duration);
    }, 0);
  };

  const getDeviceInfoFromKey = (key: string): { name: string, building: 'A' | 'B' | 'C', floor: string } => {
    const deviceMap: { [key: string]: { name: string, building: 'A' | 'B' | 'C', floor: string } } = {
      '4f887d23-3cf2-4d1c-8ae8-0f0bea45cf09': { name: 'A0/TDI/I-35-1@5', building: 'A', floor: 'Rez-de-chaussée' },
      '510478e8-dbfe-40d1-8d2f-18562e4fb128': { name: 'A1/TDI/I-35-1@5', building: 'A', floor: '1er étage' },
      '14375bc7-eb4f-4cac-88f8-ae6be2dde5cd': { name: 'A1/TDI/I-35-2@4', building: 'A', floor: '1er étage' },
      'ca8bf525-9259-4cfa-9ebe-856b4356895e': { name: 'A2/TDI/I-35-1@5', building: 'A', floor: '2ème étage' },
      '3b36f5d7-8abd-4e79-8154-72ccb92b9273': { name: 'A3/TDI/I-35-1@5', building: 'A', floor: '3ème étage' },
      '5ef1fc4b-0bfd-4b13-a174-835d154a0744': { name: 'B0/COFPV/I-43-1@5', building: 'B', floor: 'Rez-de-chaussée' },
      '566fbe08-44fa-442a-9fb8-1eadf8f66da1': { name: 'B0/TDI/I-35-1@2', building: 'B', floor: 'Rez-de-chaussée' },
      '131be744-6676-47c2-9d8d-c6b503c7220b': { name: 'B0/TD2/I-35-2@3', building: 'B', floor: 'Rez-de-chaussée' },
      '22e195a1-30ca-4d2b-a533-0be1b4e93f23': { name: 'B1/TD3/I-35-1@5', building: 'B', floor: '1er étage' },
      '31cea110-6514-4cd2-8edf-add92b13bf17': { name: 'C1/TDI/I-35-1@5', building: 'C', floor: '1er étage' },
      '306e5d7a-fa63-4f86-b117-aa0da4830a80': { name: 'C2/TDCTA/I-35-1@5', building: 'C', floor: '2ème étage' }
    };
    return deviceMap[key] || { name: 'Unknown', building: 'A', floor: 'Unknown' };
  };

  const getBuildingGroup = (building: 'A' | 'B' | 'C'): number => ({ 'A': 1, 'B': 2, 'C': 3 }[building] || 0);

  return (
    <>
      {!isLoading && <NetworkGraph data={graphData} />}
    </>
  );
};

export default CarteInterractive;