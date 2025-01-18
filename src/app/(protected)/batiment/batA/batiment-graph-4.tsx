"use client"

import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from "recharts"
import { motion } from "framer-motion"

const chartData = [
  { date: "Jan", price: 0.32 },
  { date: "Feb", price: 0.38 },
  { date: "Mar", price: 0.42 },
  { date: "Apr", price: 0.48 },
  { date: "May", price: 0.51 },
  { date: "Jun", price: 0.567 },
  { date: "Jul", price: 0.59 }
]

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg bg-black/90 p-2 shadow-lg border border-[#00ff9d]/20">
        <p className="text-xs text-[#00ff9d]">Jun 7, 2023, 12:53:31 a.m.</p>
        <p className="text-sm font-medium text-white">
          Price: {payload[0]?.value.toFixed(3)}
        </p>
      </div>
    )
  }
  return null
}

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: { date: string };
}

const CustomDot = ({ cx, cy, payload }: CustomDotProps) => {
  if (payload && payload.date === "Jun") {
    return (
      <g>
        {/* Inner dot */}
        <motion.circle 
          cx={cx} 
          cy={cy} 
          r={5} 
          fill="#00ff9d"
          filter="url(#glow)"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        />
        <motion.circle 
          cx={cx} 
          cy={cy} 
          r={16} 
          fill="transparent"
          stroke="#00ff9d"
          strokeWidth={2}
          filter="url(#gf"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        />
      </g>
    )
  }
  return null
}

export default function Batimentgraph4() {
  return (
    <div className="relative h-full w-full rounded-md bg-black border">
      {/* SVG Filters for glow effects */}
      <svg width="0" height="0">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
      </svg>
      <p className="absolute top-4 left-4 text-white text-sm z-10">
        Prédiction sur l'évolution de la consommation du bâtiment
      </p>
      {/* Chart */}
      <div className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 50, right: 20, left: 20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00ff9d" stopOpacity={0.4} />
                <stop offset="90%" stopColor="#00ff9d" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#4B5563', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#00ff9d"
              strokeWidth={2}
              fill="url(#colorPrice)"
              dot={<CustomDot />}
              className="filter drop-shadow-[0_0_30px_rgba(0,255,157,1)]"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}