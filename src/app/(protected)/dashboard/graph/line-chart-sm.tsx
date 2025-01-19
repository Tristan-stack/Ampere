"use client"

import { TrendingUp } from "lucide-react"
import { CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
const chartData = [
    { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
    { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
    { browser: "firefox", visitors: 187, fill: "var(--color-firefox)" },
    { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
    { browser: "other", visitors: 90, fill: "var(--color-other)" },
]

const chartConfig = {
    visitors: {
        label: "Visitors",
        color: "hsl(var(--chart-2))",
    },
    chrome: {
        label: "Chrome",
        color: "hsl(var(--chart-1))",
    },
    safari: {
        label: "Safari",
        color: "hsl(var(--chart-2))",
    },
    firefox: {
        label: "Firefox",
        color: "hsl(var(--chart-3))",
    },
    edge: {
        label: "Edge",
        color: "hsl(var(--chart-4))",
    },
    other: {
        label: "Other",
        color: "hsl(var(--chart-5))",
    },
} satisfies ChartConfig

export function Linechartsm() {
    return (
        <Card className="bg-transparent border-none h-full w-full">
            <CardHeader>
                <CardTitle>Line Chart - Custom Label</CardTitle>
            </CardHeader>
            <CardContent className="h-36 w-full">
                <ChartContainer config={chartConfig} className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            accessibilityLayer
                            data={chartData}
                            margin={{
                                top: 24,
                                left: 24,
                                right: 24,
                            }}
                        >
                            <CartesianGrid vertical={false} />
                            <ChartTooltip
                                cursor={false}
                                content={
                                    <ChartTooltipContent
                                        indicator="line"
                                        nameKey="visitors"
                                        hideLabel
                                    />
                                }
                            />
                            <Line
                                dataKey="visitors"
                                type="natural"
                                stroke="var(--color-visitors)"
                                strokeWidth={2}
                                dot={{
                                    fill: "var(--color-visitors)",
                                }}
                                activeDot={{
                                    r: 6,
                                }}
                            >
                                <LabelList
                                    position="top"
                                    offset={12}
                                    className="fill-foreground"
                                    fontSize={12}
                                    dataKey="browser"
                                    formatter={(value: keyof typeof chartConfig) =>
                                        chartConfig[value]?.label
                                    }
                                />
                            </Line>
                        </LineChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}