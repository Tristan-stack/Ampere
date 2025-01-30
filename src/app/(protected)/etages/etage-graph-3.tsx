import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type EtageEmissionsGraphProps = {
  floorData: any;
  isExpanded: boolean;
};

export const EtageEmissionsGraph: React.FC<EtageEmissionsGraphProps> = ({ floorData, isExpanded }) => {
  const data = {
    labels: Object.keys(floorData),
    datasets: [
      {
        label: "Emissions",
        data: Object.values(floorData).map((data: any) => data.reduce((sum: number, item: any) => sum + item.emissions, 0)),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="w-full h-full p-4">
      <Bar data={data} options={options} />
    </div>
  );
};