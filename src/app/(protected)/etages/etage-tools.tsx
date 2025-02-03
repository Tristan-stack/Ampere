import React, { useState } from 'react';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import CountUp from "@/components/countup";
import { ArrowDownLeft, ArrowUpRight, Star, StarOff, Calculator, NotebookPen, Bold, Italic, Underline, BellPlus, Pen, Download, PenTool, AlertCircle } from "lucide-react";
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
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { toast } from 'react-toastify';

interface Tool {
    id: string;
    name: string;
    icon: React.ReactNode;
    description: string;
    isFavorite: boolean;
    adminOnly?: boolean;
}

interface Alert {
    id: string;
    threshold: number;
    building: string;
    isActive: boolean;
    lastTriggered?: number;
}

interface EtageToolsProps {
    onSavingsChange: (savings: number) => void;
    onPriceChange: (price: number) => void;
    isExpanded: boolean;
    onToggleExpand: (event: React.MouseEvent) => void;
    isAdmin?: boolean;
    totalConsumption: number;
    currentBuildingData?: {
        [key: string]: number;
    };
}

export const EtageTools: React.FC<EtageToolsProps> = ({ onSavingsChange, onPriceChange, isExpanded, onToggleExpand, isAdmin = false, totalConsumption = 0, currentBuildingData = {} }) => {
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
            name: "Commentaires",
            icon: <NotebookPen className="h-4 w-4" />,
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
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [newAlertThreshold, setNewAlertThreshold] = useState<number>(1000);
    const [selectedBuilding, setSelectedBuilding] = useState<string>('A');

    const handleSaveNotes = () => {
        const blob = new Blob([noteContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const today = new Date();
        const formattedDate = today.toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' });
        a.download = `AMPERE-commentaires-${formattedDate}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

    };

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

    const checkAlerts = React.useCallback(() => {
        alerts.forEach(alert => {
            if (!alert.isActive) return;

            const buildingConsumption = currentBuildingData[alert.building];
            if (!buildingConsumption) return;

            const now = Date.now();
            if (alert.lastTriggered && now - alert.lastTriggered < 5 * 60 * 1000) return;

            if (buildingConsumption >= alert.threshold) {
                toast.error(
                    `Le bâtiment ${alert.building} consomme ${buildingConsumption.toFixed(0)}W, dépassant le seuil de ${alert.threshold}W`,
                    {
                        position: "bottom-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: "dark",
                    }
                );

                setAlerts(prev => prev.map(a =>
                    a.id === alert.id ? { ...a, lastTriggered: now } : a
                ));
            }
        });
    }, [alerts, currentBuildingData]);

    React.useEffect(() => {
        checkAlerts();
    }, [currentBuildingData, checkAlerts]);

    const addAlert = () => {
        const newAlert: Alert = {
            id: Date.now().toString(),
            threshold: newAlertThreshold,
            building: selectedBuilding,
            isActive: true,
            lastTriggered: 0
        };
        setAlerts(prev => [...prev, newAlert]);

        const buildingConsumption = currentBuildingData[selectedBuilding];
        if (buildingConsumption && buildingConsumption >= newAlertThreshold) {
            toast.warning(
                `Le bâtiment ${selectedBuilding} consomme déjà ${buildingConsumption.toFixed(0)}W, dépassant le seuil de ${newAlertThreshold}W`,
                {
                    position: "bottom-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "dark",
                }
            );
        }
    };

    const removeAlert = (id: string) => {
        setAlerts(alerts.filter(alert => alert.id !== id));
    };

    const toggleAlert = (id: string) => {
        setAlerts(alerts.map(alert =>
            alert.id === id ? { ...alert, isActive: !alert.isActive } : alert
        ));
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
                        <div className=" flex justify-between items-start flex-row flex-wrap gap-24 h-auto sm:gap-2">
                            {favoriteTools.map(tool => (
                                <div
                                    key={tool.id}
                                    className={cn(
                                        "flex flex-col justify-start h-fit gap-2",
                                        favoriteTools.length === 1 ? "w-full" : " flex-1 sm:flex-none"
                                    )}
                                >
                                    {tool.id === "savings" && (
                                        <div className="flex flex-col gap-2 w-full  mb-4 relative">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-end gap-2 relative w-full">
                                                    <span className="text-xs text-neutral-400 w-full text-nowrap">{tool.name}</span>
                                                </div>
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
                                                className="cursor-pointer"
                                            />
                                            <span className="text-sm font-medium text-neutral-200 text-right absolute right-0 top-7">
                                                {savings.toFixed(1)}%
                                            </span>
                                        </div>
                                    )}
                                    {tool.id === "notes" && (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="ghost" size="icon" className="">
                                                    <NotebookPen className="h-4 w-4" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="bg-neutral-900 rounded-lg p-2">
                                                <div className="w-full h-52 flex flex-col">
                                                    <Textarea
                                                        id="noteTextarea"
                                                        value={noteContent}
                                                        onChange={(e) => setNoteContent(e.target.value)}
                                                        className="w-full flex-1 bg-neutral-800 rounded-lg p-2 text-sm text-neutral-200 resize-none focus:outline-none focus:ring-1 focus:ring-neutral-700 mb-2"
                                                        placeholder="Prenez vos commentaires ici..."
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={handleSaveNotes}
                                                        className="bg-neutral-800 hover:bg-neutral-700 flex items-center gap-2"
                                                        disabled={!noteContent}
                                                    >
                                                        <Download className="h-4 w-4" />
                                                        Sauvegarder
                                                    </Button>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                    {tool.id === "alerts" && (
                                        <div className="w-full h-full flex flex-col gap-2">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Input
                                                    type="number"
                                                    value={newAlertThreshold}
                                                    onChange={(e) => setNewAlertThreshold(Number(e.target.value))}
                                                    className="w-24 bg-neutral-800 text-sm"
                                                    placeholder="Seuil (W)"
                                                />
                                                <select
                                                    value={selectedBuilding}
                                                    onChange={(e) => setSelectedBuilding(e.target.value)}
                                                    className="bg-neutral-800 text-sm rounded-md px-2 py-1 text-neutral-200"
                                                >
                                                    <option value="A">Bâtiment A</option>
                                                    <option value="B">Bâtiment B</option>
                                                    <option value="C">Bâtiment C</option>
                                                </select>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={addAlert}
                                                    className="bg-neutral-800 hover:bg-neutral-700 ml-auto"
                                                >
                                                    <BellPlus className="h-4 w-4 mr-1" />
                                                    Ajouter
                                                </Button>
                                            </div>
                                            <div className="flex-1 overflow-y-auto">
                                                {alerts.length === 0 ? (
                                                    <div className="flex flex-col items-center justify-center h-full text-neutral-400 text-sm gap-2">
                                                        <AlertCircle className="h-8 w-8 opacity-50" />
                                                        <p>Aucune alerte configurée</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {alerts.map(alert => (
                                                            <div
                                                                key={alert.id}
                                                                className={cn(
                                                                    "flex items-center justify-between p-2 rounded-md transition-colors",
                                                                    alert.isActive ? "bg-neutral-800" : "bg-neutral-800/50"
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <div
                                                                        className={cn(
                                                                            "w-2 h-2 rounded-full",
                                                                            alert.isActive ? "bg-green-500" : "bg-neutral-600"
                                                                        )}
                                                                    />
                                                                    <span className="text-sm text-neutral-200">
                                                                        Bât. {alert.building} - {alert.threshold}W
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => toggleAlert(alert.id)}
                                                                        className="hover:bg-neutral-700 p-1 h-auto"
                                                                    >
                                                                        {alert.isActive ? (
                                                                            <BellPlus className="h-3 w-3" />
                                                                        ) : (
                                                                            <AlertCircle className="h-3 w-3" />
                                                                        )}
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => removeAlert(alert.id)}
                                                                        className="text-red-400 hover:text-red-300 hover:bg-neutral-700 p-1 h-auto"
                                                                    >
                                                                        ×
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {tool.id === "write" && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {/* Handle drawing */ }}
                                        >
                                            <Pen className="h-4 w-4" />
                                        </Button>
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
                                        <div className="w-full h-full flex flex-col">
                                            <Textarea
                                                id="noteTextarea"
                                                value={noteContent}
                                                onChange={(e) => setNoteContent(e.target.value)}
                                                className="w-full flex-1 bg-neutral-800 rounded-lg p-2 text-sm text-neutral-200 resize-none focus:outline-none focus:ring-1 focus:ring-neutral-700 mb-2"
                                                placeholder="Prenez vos commentaires ici..."
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleSaveNotes}
                                                className="bg-neutral-800 hover:bg-neutral-700 flex items-center gap-2"
                                                disabled={!noteContent}
                                            >
                                                <Download className="h-4 w-4" />
                                                Sauvegarder
                                            </Button>
                                        </div>
                                    )}
                                    {tool.id === "alerts" && (
                                        <div className="w-full h-full flex flex-col gap-2">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Input
                                                    type="number"
                                                    value={newAlertThreshold}
                                                    onChange={(e) => setNewAlertThreshold(Number(e.target.value))}
                                                    className="w-24 bg-neutral-800 text-sm"
                                                    placeholder="Seuil (W)"
                                                />
                                                <select
                                                    value={selectedBuilding}
                                                    onChange={(e) => setSelectedBuilding(e.target.value)}
                                                    className="bg-neutral-800 text-sm rounded-md px-2 py-1 text-neutral-200"
                                                >
                                                    <option value="A">Bâtiment A</option>
                                                    <option value="B">Bâtiment B</option>
                                                    <option value="C">Bâtiment C</option>
                                                </select>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={addAlert}
                                                    className="bg-neutral-800 hover:bg-neutral-700 ml-auto"
                                                >
                                                    <BellPlus className="h-4 w-4 mr-1" />
                                                    Ajouter
                                                </Button>
                                            </div>
                                            <div className="flex-1 overflow-y-auto">
                                                {alerts.length === 0 ? (
                                                    <div className="flex flex-col items-center justify-center h-full text-neutral-400 text-sm gap-2">
                                                        <AlertCircle className="h-8 w-8 opacity-50" />
                                                        <p>Aucune alerte configurée</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {alerts.map(alert => (
                                                            <div
                                                                key={alert.id}
                                                                className={cn(
                                                                    "flex items-center justify-between p-2 rounded-md transition-colors",
                                                                    alert.isActive ? "bg-neutral-800" : "bg-neutral-800/50"
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <div
                                                                        className={cn(
                                                                            "w-2 h-2 rounded-full",
                                                                            alert.isActive ? "bg-green-500" : "bg-neutral-600"
                                                                        )}
                                                                    />
                                                                    <span className="text-sm text-neutral-200">
                                                                        Bât. {alert.building} - {alert.threshold}W
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => toggleAlert(alert.id)}
                                                                        className="hover:bg-neutral-700 p-1 h-auto"
                                                                    >
                                                                        {alert.isActive ? (
                                                                            <BellPlus className="h-3 w-3" />
                                                                        ) : (
                                                                            <AlertCircle className="h-3 w-3" />
                                                                        )}
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => removeAlert(alert.id)}
                                                                        className="text-red-400 hover:text-red-300 hover:bg-neutral-700 p-1 h-auto"
                                                                    >
                                                                        ×
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
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