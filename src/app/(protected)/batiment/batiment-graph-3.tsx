"use client"

import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { month: "January", desktop: 186, mobile: 160 },
  { month: "February", desktop: 185, mobile: 170 },
  { month: "March", desktop: 207, mobile: 180 },
  { month: "April", desktop: 173, mobile: 160 },
  { month: "May", desktop: 160, mobile: 190 },
  { month: "June", desktop: 174, mobile: 204 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "#00ff9d", // Vert néon
  },
  mobile: {
    label: "Mobile",
    color: "#4deeea", // Bleu néon
  },
} satisfies ChartConfig

export function Batimentgraph3() {
  return (
    <div className="h-full w-full rounded-md bg-black border">
      {/* SVG Filters for glow effects */}
      <svg width="0" height="0">
        <defs>
          <filter id="glow-radar">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <linearGradient id="radar-grid" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00ff9d" stopOpacity="0.1"/>
            <stop offset="100%" stopColor="#4deeea" stopOpacity="0.1"/>
          </linearGradient>
        </defs>
      </svg>

      <div className="h-full w-full p-6">
        <ChartContainer
          config={chartConfig}
          className="h-full w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData}>
            <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <PolarAngleAxis 
                dataKey="month" 
                tick={{ fill: '#4deeea', opacity: 0.7, fontSize: 12 }}
                axisLine={{ stroke: '#4deeea', opacity: 0.2 }}
              />
              <PolarGrid 
                radialLines={false}
                gridType="polygon"
                stroke="#00ff9d"
                strokeOpacity={0.15}
                className="filter drop-shadow-[0_0_2px_rgba(0,255,157,0.3)]"
              />
              <Radar
                dataKey="desktop"
                fill="#00ff9d"
                fillOpacity={0.1}
                stroke="#00ff9d"
                strokeWidth={2}
                className="filter drop-shadow-[0_0_8px_rgba(0,255,157,0.5)]"
              />
              <Radar
                dataKey="mobile"
                fill="#f87c00"
                fillOpacity={0.1}
                stroke="#f87c00"
                strokeWidth={2}
                className="filter drop-shadow-[0_0_8px_rgba(77,238,234,0.5)]"
              />
            </RadarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <div className="flex justify-center gap-4 pb-4 text-sm">
        <span className="text-[#00ff9d] filter drop-shadow-[0_0_8px_rgba(0,255,157,0.3)]">
          ● Desktop
        </span>
        <span className="text-[#4deeea] filter drop-shadow-[0_0_8px_rgba(77,238,234,0.3)]">
          ● Mobile
        </span>
      </div>
    </div>
  )
}