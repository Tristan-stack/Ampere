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
    { browser: "chrome", visitors: 275, fill: "#00ff9d" },    // Vert néon
    { browser: "safari", visitors: 200, fill: "#4deeea" },    // Bleu néon
    { browser: "firefox", visitors: 187, fill: "#f87c00" },   // Orange néon
    { browser: "edge", visitors: 173, fill: "#ff00ff" },      // Rose néon
    { browser: "other", visitors: 90, fill: "#7b61ff" },      // Violet néon
]

const chartConfig = {
    visitors: {
        label: "Visitors",
    },
    chrome: {
        label: "Chrome",
        color: "#00ff9d",
    },
    safari: {
        label: "Safari",
        color: "#4deeea",
    },
    firefox: {
        label: "Firefox",
        color: "#f87c00",
    },
    edge: {
        label: "Edge",
        color: "#ff00ff",
    },
    other: {
        label: "Other",
        color: "#7b61ff",
    },
} satisfies ChartConfig

// ... existing code ...

export function RadialChart() {
    return (
        <Card className="flex flex-col bg-transparent border-none h-full">
            {/* SVG Filters pour les effets de lueur */}
            <svg width="0" height="0">
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
            </svg>

            <CardHeader className="items-center py-2">
                <CardTitle className="text-lg text-left ">
                    Statistiques des Navigateurs
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 w-full min-h-0 pt-0">
                <ChartContainer
                    config={chartConfig}
                    className="h-full w-full"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            data={chartData}
                            innerRadius={30}
                            outerRadius={90}
                            barSize={15}
                            cx="50%"
                            cy="50%"
                            startAngle={0}
                            endAngle={360}
                        >
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent hideLabel nameKey="browser" />}
                            />
                            <PolarGrid
                                gridType="circle"
                                stroke="#4deeea"
                                strokeOpacity={0.15}
                                className="filter drop-shadow-[0_0_2px_rgba(77,238,234,0.3)]"
                            />
                            <RadialBar
                                dataKey="visitors"
                                background
                                cornerRadius={10}
                                label={{
                                    position: 'insideStart',
                                    fill: '#fff',
                                    className: "filter drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]"
                                }}
                                className="filter drop-shadow-[0_0_8px_rgba(0,255,157,0.3)]"
                            />
                        </RadialBarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}