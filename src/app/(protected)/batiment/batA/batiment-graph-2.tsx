"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  total: {
    label: "Total",
    color: "hsl(var(--chart-1))",
  },
  byBuilding: {
    label: "Par bâtiments",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

interface Batimentgraph2Props {
  aggregatedData: { [key: string]: { date: string; totalConsumption: number; emissions: number }[] }
  loading: boolean
}

export function Batimentgraph2({ aggregatedData, loading }: Batimentgraph2Props) {
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("total")

  const total = React.useMemo(
    () => ({
      totalConsumption: Object.values(aggregatedData).flat().reduce((acc, curr) => acc + curr.totalConsumption, 0),
      emissions: Object.values(aggregatedData).flat().reduce((acc, curr) => acc + curr.emissions, 0),
    }),
    [aggregatedData]
  )

  const buildings = Object.keys(aggregatedData)
console.log(aggregatedData)
  return (
    <div className="relative border rounded-lg shadow-sm w-full h-full flex flex-col">
      <div className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-2">
          <h2 className="text-lg font-bold">Line Chart - Interactive</h2>
          <p className="text-sm text-muted-foreground">
            Showing total consumption and emissions for the last 3 months
          </p>
        </div>
        <div className="flex">
          {["total", "byBuilding"].map((key) => {
            const chart = key as keyof typeof chartConfig
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-2"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-xs text-muted-foreground">
                  {chartConfig[chart].label}
                </span>
                <span className="text-lg font-bold leading-none sm:text-3xl">
                  {total.totalConsumption.toLocaleString()}
                </span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex-1 p-4">
        <ChartContainer
          config={chartConfig}
          className="h-full w-full"
        >
          <div style={{ width: '100%', height: '100%' }}>
            <LineChart
              width={725}
              height={180}
              data={activeChart === "total" ? Object.values(aggregatedData).flat() : []}
              margin={{
                top: 20,
                right: 20,
                left: -20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }}
              />
              <YAxis />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[150px]"
                    nameKey="views"
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    }}
                  />
                }
              />
              {activeChart === "total" && (
                <Line
                  dataKey="totalConsumption"
                  type="monotone"
                  stroke={`var(--color-total)`}
                  strokeWidth={2}
                  dot={false}
                />
              )}
              {activeChart === "byBuilding" && buildings.map((building, index) => (
                <Line
                  key={building}
                  dataKey="totalConsumption"
                  data={aggregatedData[building]}
                  name={building}
                  type="monotone"
                  stroke={`hsl(var(--chart-${index + 1}))`}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </div>
        </ChartContainer>
      </div>
    </div>
  )
}