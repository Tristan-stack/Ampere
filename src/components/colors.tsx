"use client"

import React, { useState, useCallback } from "react"
import { Paintbrush } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type HSLColor = {
  h: number
  s: number
  l: number
}

const ColorPicker = () => {
  const [colors, setColors] = useState<HSLColor[]>([
    { h: 220, s: 70, l: 50 }, // chart-1
    { h: 328, s: 85, l: 45 }, // chart-2
    { h: 30, s: 80, l: 55 }, // chart-3
  ])

  const updateColor = useCallback((colorIndex: number, property: keyof HSLColor, value: number) => {
    setColors((prevColors) => {
      const newColors = [...prevColors]
      newColors[colorIndex] = {
        h: newColors[colorIndex]?.h ?? 0,
        s: newColors[colorIndex]?.s ?? 0,
        l: newColors[colorIndex]?.l ?? 0,
        [property]: value
      }

      document.documentElement.style.setProperty(
        `--chart-${colorIndex + 1}`,
        `${newColors[colorIndex]?.h} ${newColors[colorIndex]?.s}% ${newColors[colorIndex]?.l}%`,
      )

      return newColors
    })
  }, [])

  const ColorControl = React.memo(({ index, label }: { index: number; label: string }) => {
    const [localColor, setLocalColor] = useState(colors[index])

    const handleSliderChange = (prop: keyof HSLColor, value: number) => {
      setLocalColor((prev) => {
        if (!prev) return { h: 0, s: 0, l: 0 }
        return { ...prev, [prop]: value }
      })
    }

    const handleSliderCommit = (prop: keyof HSLColor, value: number) => {
      updateColor(index, prop, value)
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: `hsl(${localColor?.h} ${localColor?.s}% ${localColor?.l}%)` }}
          />
          <Label className="text-sm font-medium">{label}</Label>
        </div>

        {(["h", "s", "l"] as const).map((prop) => (
          <div key={prop}>
            <Label className="text-xs">
              {prop === "h" ? "Couleur" : prop === "s" ? "Saturation" : "Luminosité"}: {localColor?.[prop] ?? 0}
              {prop === "h" ? "°" : "%"}
            </Label>
            <Slider
              value={[localColor?.[prop] ?? 0]}
              min={0}
              max={prop === "h" ? 360 : 100}
              step={1}
              onValueChange={(value) => handleSliderChange(prop, value[0] ?? 0)}
              onValueCommit={(value) => handleSliderCommit(prop, value[0] ?? 0)}
              className="mt-1"
            />
          </div>
        ))}
      </div>
    )
  })

  ColorControl.displayName = "ColorControl"

  return (
    <Popover>
      <PopoverTrigger asChild>
      <Paintbrush className="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent className="w-80" sideOffset={5}>
        <Tabs defaultValue="chart-1" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chart-1">Bâtiment A</TabsTrigger>
            <TabsTrigger value="chart-2">Bâtiment B</TabsTrigger>
            <TabsTrigger value="chart-3">Bâtiment C</TabsTrigger>
          </TabsList>
          {colors.map((_, index) => (
            <TabsContent key={index} value={`chart-${index + 1}`}>
              <Card>
                <CardContent className="pt-6">
                  <ColorControl index={index} label={`Bâtiment ${String.fromCharCode(65 + index)}`} />
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}

export default ColorPicker