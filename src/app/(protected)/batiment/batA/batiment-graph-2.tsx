"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import CountUp from "@/components/countup"
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
  const total = React.useMemo(
    () => ({
      totalConsumption: Object.values(aggregatedData).flat().reduce((acc, curr) => acc + curr.totalConsumption, 0),
      emissions: Object.values(aggregatedData).flat().reduce((acc, curr) => acc + curr.emissions, 0),
      maxConsumption: Math.max(...Object.values(aggregatedData).flat().map(d => d.totalConsumption), 0),
      minConsumption: Math.min(...Object.values(aggregatedData).flat().map(d => d.totalConsumption), 0),
    }),
    [aggregatedData]
  )

  return (
    <div className="relative h-full w-full rounded-md border">
      <div className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-2">
          <h2 className="text-lg font-bold">Consommation totale</h2>
          <p className="text-sm text-muted-foreground">
           Sur la période sélectionnée
          </p>
        </div>
        <div className="flex">
          <div className="flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-l sm:border-t-0 sm:px-8 sm:py-2">
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="text-xl font-bold leading-none 3xl:text-3xl whitespace-nowrap">
              <CountUp
                from={0}
                to={total.totalConsumption}
                separator=" "
                direction="up"
                duration={0.1}
                className="count-up-text"
              />
            </span>
          </div>
          <div className="flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-l sm:border-t-0 sm:px-8 sm:py-2">
            <span className="text-xs text-muted-foreground">Max.</span>
            <span className="text-xl font-bold leading-none 3xl:text-3xl whitespace-nowrap">
              <CountUp
                from={0}
                to={total.maxConsumption}
                separator=" "
                direction="up"
                duration={0.1}
                className="count-up-text"
              />
            </span>
          </div>
          <div className="flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-l sm:border-t-0 sm:px-8 sm:py-2">
            <span className="text-xs text-muted-foreground">Min.</span>
            <span className="text-xl font-bold leading-none 3xl:text-3xl whitespace-nowrap">
              <CountUp
                from={0}
                to={total.minConsumption}
                separator=" "
                direction="up"
                duration={0.1}
                className="count-up-text"
              />
            </span>
          </div>
        </div>
      </div>
      <div className="h-full w-full">
        <ChartContainer
          config={chartConfig}
          className="h-full w-full"
        >
          <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={Object.values(aggregatedData).flat()}
                margin={{ top: 20, right: 50, left: -10, bottom: 90 }}
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
                    return date.toLocaleDateString("fr-FR", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })
                  }}
                />
                <YAxis />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="w-fit transition-all duration-300"
                      nameKey="views"
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
                <Line
                  dataKey="totalConsumption"
                  type="monotone"
                  stroke={`var(--color-total)`}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartContainer>
      </div>
    </div>
  )
}