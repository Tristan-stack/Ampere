import React, { useState } from 'react';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import CountUp from "@/components/countup";
import { ArrowDownLeft, ArrowUpRight, Star, StarOff, Calculator, Lightbulb, Bold, Italic, Underline, BellPlus, Pen } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GradientText from '@/components/gradient-text';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Input } from "@/components/ui/input";

interface Tool {
    id: string;
    name: string;
    icon: React.ReactNode;
    description: string;
    isFavorite: boolean;
    adminOnly?: boolean;
}

interface EtageToolsProps {
    onSavingsChange: (savings: number) => void;
    onPriceChange: (price: number) => void;
    isExpanded: boolean;
    onToggleExpand: (event: React.MouseEvent) => void;
    isAdmin?: boolean;
    totalConsumption: number;
}

export const EtageTools: React.FC<EtageToolsProps> = ({ onSavingsChange, onPriceChange, isExpanded, onToggleExpand, isAdmin = false, totalConsumption = 0 }) => {
    const [savings, setSavings] = useState<number>(0);
    const [isSimulating, setIsSimulating] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [prevSavings, setPrevSavings] = useState(0);
    const [noteContent, setNoteContent] = useState("");
    const [tools, setTools] = useState<Tool[]>([
        {
            id: "savings",
            name: "Simulateur d'économies",
            icon: <Calculator className="h-4 w-4" />,
            description: "Simulez les économies d'énergie potentielles",
            isFavorite: true
        },
        {
            id: "notes",
            name: "Notes",
            icon: <Lightbulb className="h-4 w-4" />,
            description: "Prenez des notes sur vos analyses",
            isFavorite: false
        },
        {
            id: "alerts",
            name: "Alertes",
            icon: <BellPlus className="h-4 w-4" />,
            description: "Configurez vos alertes",
            isFavorite: false
        },
        {
            id: "write",
            name: "Dessiner",
            icon: <Pen className="h-4 w-4" />,
            description: "Dessinez vos analyses",
            isFavorite: false
        }
    ]);
    const toggleFavorite = (toolId: string) => {
        setTools(tools.map(tool =>
            tool.id === toolId ? { ...tool, isFavorite: !tool.isFavorite } : tool
        ));
    };

    const applyTextStyle = (style: 'bold' | 'italic' | 'underline') => {
        const textarea = document.getElementById('noteTextarea') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = noteContent.substring(start, end);

        let wrappedText = '';
        switch (style) {
            case 'bold':
                wrappedText = `**${selectedText}**`;
                break;
            case 'italic':
                wrappedText = `*${selectedText}*`;
                break;
            case 'underline':
                wrappedText = `_${selectedText}_`;
                break;
        }

        const newText = noteContent.substring(0, start) + wrappedText + noteContent.substring(end);
        setNoteContent(newText);
    };

    React.useEffect(() => {
        setIsResizing(true);
        const timer = setTimeout(() => {
            setIsResizing(false);
        }, 150);
        return () => clearTimeout(timer);
    }, [isExpanded]);

    const visibleTools = tools;

    if (!isExpanded) {
        const favoriteTools = visibleTools.filter(tool => tool.isFavorite);
        return (
            <div className="w-full h-full">
                {!isResizing && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col h-full w-full p-4 bg-neutral-900 rounded-md"
                    >
                        <div className="flex items-center justify-between mb-6 relative">
                            <div className="flex items-center gap-0">
                                <h3 className="text-lg font-medium text-neutral-200 mr-1">Outils</h3>
                                <GradientText
                                    colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]}
                                    animationSpeed={10}
                                    showBorder={false}
                                    className="text-xs px-2 py-1 rounded-md border border-neutral-800 bg-neutral-800 opacity-75 font-extrabold pointer-events-none"
                                >
                                    BETA
                                </GradientText>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onToggleExpand}
                                className="bg-neutral-800 hover:bg-neutral-700 px-1 py-1 h-auto 3xl:px-2 3xl:py-2 absolute -top-3 -right-3"
                            >
                                <ArrowUpRight className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex-1 space-y-4">
                            {favoriteTools.map(tool => (
                                <div key={tool.id} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-end gap-2 relative w-full">
                                            <span className="text-xs text-neutral-400">{tool.name}</span>
                                            <span className="text-sm font-medium text-neutral-200 text-right absolute right-0">
                                                {savings.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                    {tool.id === "savings" && (
                                        <>
                                            <Slider
                                                value={[savings]}
                                                max={30}
                                                step={0.5}
                                                onValueChange={(value) => {
                                                    if (value[0] !== undefined) {
                                                        setSavings(value[0]);
                                                    }
                                                }}
                                                onValueCommit={(value) => {
                                                    if (value[0] !== undefined) {
                                                        onSavingsChange(value[0]);
                                                    }
                                                }}
                                                className="w-full cursor-pointer"
                                            />
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        );
    }

    return (
        <div className="w-full h-full">
            {!isResizing && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col h-full w-full p-4 bg-neutral-900 rounded-md"
                >
                    <div className="flex items-center justify-between mb-4 relative">
                        <div className="flex items-center gap-2 ">
                            <h3 className="text-lg font-medium text-neutral-200">Outils</h3>
                            <GradientText
                                colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]}
                                animationSpeed={10}
                                showBorder={false}
                                className="text-sm px-2 py-1 rounded-md border border-neutral-800 bg-neutral-800 opacity-75 font-extrabold pointer-events-none"
                            >
                                BETA
                            </GradientText>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onToggleExpand}
                            className="bg-neutral-800 hover:bg-neutral-700 px-1 py-1 h-auto 3xl:px-2 3xl:py-2 absolute -top-3 -right-3"
                        >
                            <ArrowDownLeft className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-4 grid-rows-4 h-full gap-3">
                        {visibleTools.map(tool => (
                            <div
                                key={tool.id}
                                className={cn(
                                    "bg-neutral-800/50 rounded-lg p-3 hover:bg-neutral-800/70 transition-colors group relative",
                                    tool.id === "savings" ? "col-span-2" : "",
                                    tool.id === "notes" ? "col-span-2 row-span-3" : "",
                                    tool.id === "alerts" ? "col-span-2 row-span-2" : "",
                                    tool.id === "write" ? "col-span-1 row-span-2" : "",
                                )}>
                                <div className="flex flex-col items-start justify-start h-full gap-1">
                                    <div className="flex items-center justify-start gap-2 w-full">
                                        <div className="p-2 bg-neutral-800 rounded-md group-hover:bg-neutral-700 transition-colors">
                                            {tool.icon}
                                        </div>
                                        <span className="text-xs font-medium text-neutral-300">{tool.name}</span>
                                    </div>
                                    {tool.id === "savings" && (
                                        <div className="w-full px-2">
                                            <div className="text-right text-xs text-neutral-400 -mt-2">
                                                {savings.toFixed(1)}%
                                            </div>
                                            <Slider
                                                value={[savings]}
                                                max={30}
                                                step={0.5}
                                                onValueChange={(value) => {
                                                    if (value[0] !== undefined) {
                                                        setSavings(value[0]);
                                                    }
                                                }}
                                                onValueCommit={(value) => {
                                                    if (value[0] !== undefined) {
                                                        onSavingsChange(value[0]);
                                                    }
                                                }}
                                                className="w-full cursor-pointer"
                                            />
                                        </div>
                                    )}
                                    {tool.id === "notes" && (
                                        <div className="w-full h-full">
                                            <Textarea
                                                id="noteTextarea"
                                                value={noteContent}
                                                onChange={(e) => setNoteContent(e.target.value)}
                                                className="w-full h-full bg-neutral-800 rounded-lg p-2 text-sm text-neutral-200 resize-none focus:outline-none focus:ring-1 focus:ring-neutral-700"
                                                placeholder="Prenez vos notes ici..."
                                            />
                                        </div>
                                    )}
                                    {tool.id === "alerts" && (
                                        <div className="w-full h-full">
                                            <div className="w-full h-full bg-neutral-800 rounded-lg"></div>
                                        </div>
                                    )}
                                    {tool.id === "write" && (
                                        <div className="w-full h-full">
                                            <div className="w-full h-full bg-neutral-800 rounded-lg"></div>
                                        </div>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleFavorite(tool.id)}
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neutral-700 p-1 h-auto"
                                >
                                    {tool.isFavorite ? 
                                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" /> : 
                                        <StarOff className="h-3 w-3" />
                                    }
                                </Button>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
};