"use client"

import { TrendingUp } from "lucide-react"
import { PolarGrid, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts"

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
    { browser: "chrome", visitors: 275, fill: "#06DE8F" },
    { browser: "safari", visitors: 200, fill: "#265DCB" },
    { browser: "firefox", visitors: 187, fill: "#DF7B0A" },
    { browser: "edge", visitors: 173, fill: "#C70039" },
    { browser: "other", visitors: 90, fill: "#900C3F" },
]

const chartConfig = {
    visitors: {
        label: "Visitors",
    },
    chrome: {
        label: "Chrome",
        color: "#06DE8F",
    },
    safari: {
        label: "Safari",
        color: "#265DCB",
    },
    firefox: {
        label: "Firefox",
        color: "#DF7B0A",
    },
    edge: {
        label: "Edge",
        color: "#C70039",
    },
    other: {
        label: "Other",
        color: "#900C3F",
    },
} satisfies ChartConfig

export function RadialChart() {
    return (
        <Card className="flex flex-col bg-transparent border-none h-32 w-full">
            <CardHeader className="items-center pb-0">
                <CardTitle>Radial Chart - Grid</CardTitle>
                <CardDescription>January - June 2024</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto h-26 w-full"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart data={chartData} innerRadius={30} outerRadius={100}>
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent hideLabel nameKey="browser" />}
                            />
                            <PolarGrid gridType="circle" />
                            <RadialBar
                                dataKey="visitors"
                                background
                                cornerRadius={10}
                                className="radial-bar-glow"
                            />
                        </RadialBarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}