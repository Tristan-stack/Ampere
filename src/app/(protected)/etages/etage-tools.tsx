import React, { useState } from 'react';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import CountUp from "@/components/countup";
import { ArrowDownLeft, ArrowUpRight, Star, StarOff, Calculator, NotebookPen, Bold, Italic, Underline, BellPlus, Pen, Download, PenTool, AlertCircle, Building2, Info } from "lucide-react";
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
import { useUser } from "@clerk/nextjs";

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
    lastTriggered?: number | null;
    measureId?: string;
    measureName?: string;
}

interface MeasureSelection {
    id: string;
    building: string;
    floor: string;
    measurementNumber: number;
    isSelected?: boolean;
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
    selectedMeasurements?: {
        id: string;
        building: string;
        floor: string;
        measurementNumber: number;
    }[];
    availableMeasurements?: {
        [building: string]: {
            [floor: string]: Set<string>;
        };
    };
    chartData?: {
        id: string;
        name: string;
        totalConsumption: number;
    }[];
}

export const EtageTools: React.FC<EtageToolsProps> = ({ onSavingsChange, onPriceChange, isExpanded, onToggleExpand, isAdmin = false, totalConsumption = 0, currentBuildingData = {}, selectedMeasurements = [], availableMeasurements = {}, chartData = [] }) => {
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
    const [selectedMeasure, setSelectedMeasure] = useState<string>('');
    const [isSelectingMeasure, setIsSelectingMeasure] = useState(false);
    const [activeSelectBuilding, setActiveSelectBuilding] = useState<string>('A');
    const [selectedMeasureForAlert, setSelectedMeasureForAlert] = useState<MeasureSelection | null>(null);
    const { user } = useUser();

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

            const consumption = alert.measureId ?
                chartData?.find(item => item.id.startsWith(alert.measureId || ''))?.totalConsumption :
                currentBuildingData[alert.building];

            if (!consumption) return;

            if (consumption >= alert.threshold && !alert.lastTriggered) {
                setAlerts(prev => prev.map(a =>
                    a.id === alert.id ? { ...a, lastTriggered: Date.now() } : a
                ));
            } else if (consumption < alert.threshold && alert.lastTriggered) {
                setAlerts(prev => prev.map(a =>
                    a.id === alert.id ? { ...a, lastTriggered: null } : a
                ));
            }
        });
    }, [alerts, currentBuildingData, chartData]);

    React.useEffect(() => {
        const timer = setInterval(checkAlerts, 5000);
        return () => clearInterval(timer);
    }, [checkAlerts]);

    const formatMeasureName = (measurement: MeasureSelection) => {
        const measureData = chartData.find(item => item.id.startsWith(measurement.id));
        return `${measureData?.name || `Mesure ${measurement.measurementNumber}`}`;
    };

    const MeasureSelector = () => {
        // Fonction pour vérifier si une mesure a déjà une alerte
        const hasExistingAlert = (measureId: string, building: string) => {
            return alerts.some(alert =>
                alert.measureId === measureId &&
                alert.building === building
            );
        };

        return (
            <Popover
                open={isSelectingMeasure}
                onOpenChange={setIsSelectingMeasure}
            >
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="bg-neutral-800 text-sm rounded-md px-2 py-1 text-neutral-200 flex-1 justify-start"
                    >
                        {selectedMeasureForAlert && !alerts.some(a => a.measureId === selectedMeasureForAlert.id) ? (
                            `${selectedMeasureForAlert.building} - ${selectedMeasureForAlert.floor} - ${formatMeasureName(selectedMeasureForAlert)}`
                        ) : (
                            "Sélectionner une mesure"
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-96 p-0 bg-neutral-900 border-neutral-800"
                    onInteractOutside={(e) => e.preventDefault()}
                >
                    <div className="p-4">
                        <Tabs value={activeSelectBuilding} onValueChange={setActiveSelectBuilding}>
                            <TabsList className="grid w-full grid-cols-3 mb-4">
                                {Object.keys(availableMeasurements).map((building) => (
                                    <TabsTrigger
                                        key={building}
                                        value={building}
                                        className="text-sm"
                                    >
                                        Bâtiment {building}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                                {Object.entries(availableMeasurements[activeSelectBuilding] || {}).map(([floor, measurements]) => (
                                    <div key={floor} className="space-y-1">
                                        <h3 className="text-sm text-neutral-400 flex items-center gap-2">
                                            <Building2 className="h-4 w-4" />
                                            {floor}
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {[...measurements].map((measureId) => {
                                                const measureData = chartData.find(item => item.id.startsWith(measureId));
                                                const isSelected = selectedMeasureForAlert?.id === measureId;
                                                const hasAlert = hasExistingAlert(measureId, activeSelectBuilding);

                                                return (
                                                    <button
                                                        key={measureId}
                                                        onClick={() => {
                                                            setSelectedMeasureForAlert({
                                                                id: measureId,
                                                                building: activeSelectBuilding,
                                                                floor,
                                                                measurementNumber: [...measurements].indexOf(measureId) + 1
                                                            });
                                                            setIsSelectingMeasure(false);
                                                        }}
                                                        className={cn(
                                                            "flex items-center gap-2 px-3 py-1.5 rounded-md",
                                                            "text-xs transition-all duration-200",
                                                            isSelected || hasAlert
                                                                ? "bg-neutral-700 text-white shadow-lg shadow-neutral-900/50"
                                                                : "bg-neutral-800/50 text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800",
                                                            "border border-neutral-700/50"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-1.5">
                                                            <div
                                                                className={cn(
                                                                    "w-2 h-2 rounded-full",
                                                                    isSelected || hasAlert ? "bg-green-500" : "bg-neutral-600"
                                                                )}
                                                            />
                                                            {measureData?.name || `Mesure ${[...measurements].indexOf(measureId) + 1}`}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Tabs>
                    </div>
                </PopoverContent>
            </Popover>
        );
    };

    const addAlert = async () => {
        // Vérifier si l'utilisateur est connecté et a un email
        if (!user) {
            toast.error("Vous devez être connecté pour créer une alerte");
            return;
        }

        const userEmail = user.emailAddresses[0]?.emailAddress;

        if (!selectedMeasureForAlert || !userEmail) {
            console.log("Données manquantes:", { selectedMeasureForAlert, userEmail });
            toast.error("Erreur : informations manquantes");
            return;
        }

        const measureData = chartData.find(item =>
            item.id.startsWith(selectedMeasureForAlert.id)
        );

        const newAlert = {
            threshold: newAlertThreshold,
            building: selectedMeasureForAlert.building,
            floor: selectedMeasureForAlert.floor,
            measureId: selectedMeasureForAlert.id,
            measureName: measureData?.name,
            isActive: true,
            lastTriggered: null
        };

        try {
            const response = await fetch('/api/alerts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'user-email': userEmail
                },
                body: JSON.stringify({
                    ...newAlert,
                    userEmail
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Erreur serveur:", errorData);
                toast.error('Erreur lors de la création de l\'alerte');
                return;
            }

            const data = await response.json();
            if (data.alert) {
                setAlerts(prev => [...prev, data.alert]);
                setSelectedMeasureForAlert(null);
                setNewAlertThreshold(1000);
                toast.success('Alerte créée avec succès');
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de l\'alerte:', error);
            toast.error('Erreur lors de la création de l\'alerte');
        }
    };

    const removeAlert = async (id: string) => {
        if (!user?.primaryEmailAddress?.emailAddress) return;

        try {
            await fetch(`/api/alerts/${id}`, {
                method: 'DELETE',
                headers: {
                    'user-email': user.primaryEmailAddress.emailAddress
                }
            });
            setAlerts(prev => prev.filter(alert => alert.id !== id));
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'alerte:', error);
            toast.error('Erreur lors de la suppression de l\'alerte');
        }
    };

    const toggleAlert = async (id: string) => {
        if (!user?.primaryEmailAddress?.emailAddress) return;

        try {
            const alert = alerts.find(a => a.id === id);
            if (!alert) return;

            const response = await fetch(`/api/alerts/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userEmail: user.primaryEmailAddress.emailAddress,
                    isActive: !alert.isActive,
                }),
            });

            const updatedAlert = await response.json();
            setAlerts(prev => prev.map(a =>
                a.id === id ? updatedAlert.alert : a
            ));
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'alerte:', error);
            toast.error('Erreur lors de la mise à jour de l\'alerte');
        }
    };

    React.useEffect(() => {
        setIsResizing(true);
        const timer = setTimeout(() => {
            setIsResizing(false);
        }, 150);
        return () => clearTimeout(timer);
    }, [isExpanded]);

    const visibleTools = tools;

    // Charger les alertes au montage du composant
    React.useEffect(() => {
        const loadAlerts = async () => {
            const userEmail = user?.primaryEmailAddress?.emailAddress;
            if (!userEmail) return;

            try {
                const response = await fetch('/api/alerts', {
                    headers: {
                        'user-email': userEmail
                    }
                });
                const data = await response.json();
                if (data.alerts) {
                    setAlerts(data.alerts);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des alertes:', error);
            }
        };

        loadAlerts();
    }, [user?.primaryEmailAddress?.emailAddress]);

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
                                        <div className="w-full flex flex-col gap-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-neutral-400">{tool.name}</span>
                                            </div>
                                            <div className="flex flex-col gap-2 bg-neutral-900/50 p-2 rounded-lg border border-neutral-800">
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        value={newAlertThreshold}
                                                        onChange={(e) => setNewAlertThreshold(Number(e.target.value))}
                                                        className="w-20 bg-neutral-800 text-xs h-7 rounded-md"
                                                        placeholder="Seuil (W)"
                                                    />
                                                    <MeasureSelector />
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            if (selectedMeasureForAlert) {
                                                                addAlert();
                                                            }
                                                        }}
                                                        className="bg-neutral-800 hover:bg-neutral-700 h-7 w-7 p-0 rounded-md flex items-center justify-center shrink-0"
                                                        disabled={!selectedMeasureForAlert}
                                                    >
                                                        <BellPlus className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                                <div className="h-[120px] overflow-y-auto scrollbar-thin bg-neutral-800/50 rounded-lg p-1">
                                                    {alerts.length === 0 ? (
                                                        <div className="flex flex-col items-center justify-center h-full text-neutral-400 text-xs gap-1">
                                                            <AlertCircle className="h-4 w-4 opacity-50" />
                                                            <p>Aucune alerte</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-1 pr-2">
                                                            {alerts.map(alert => {
                                                                const currentConsumption = alert.measureId ?
                                                                    chartData?.find(item => item.id.startsWith(alert.measureId || ''))?.totalConsumption :
                                                                    currentBuildingData[alert.building];

                                                                const isExceedingThreshold = currentConsumption && currentConsumption >= alert.threshold;

                                                                return (
                                                                    <div
                                                                        key={alert.id}
                                                                        className={cn(
                                                                            "flex items-center justify-between p-1.5 rounded-md transition-colors border",
                                                                            isExceedingThreshold
                                                                                ? "bg-red-950/50 border-red-900/50 text-red-200"
                                                                                : alert.isActive
                                                                                    ? "bg-neutral-800 border-neutral-700"
                                                                                    : "bg-neutral-800/50 border-neutral-700/50"
                                                                        )}
                                                                    >
                                                                        <div className="flex items-center gap-1.5">
                                                                            <div
                                                                                className={cn(
                                                                                    "w-1.5 h-1.5 rounded-full",
                                                                                    isExceedingThreshold
                                                                                        ? "bg-red-500"
                                                                                        : alert.isActive
                                                                                            ? "bg-green-500"
                                                                                            : "bg-neutral-600"
                                                                                )}
                                                                            />
                                                                            <span className="text-xs text-neutral-200 truncate max-w-[120px]">
                                                                                {alert.measureId ? (
                                                                                    `${alert.measureName}`
                                                                                ) : (
                                                                                    `Bât. ${alert.building}`
                                                                                )}
                                                                            </span>
                                                                            {isExceedingThreshold && (
                                                                                <TooltipProvider>
                                                                                    <Tooltip>
                                                                                        <TooltipTrigger>
                                                                                            <Info className="h-3 w-3 text-red-400" />
                                                                                        </TooltipTrigger>
                                                                                        <TooltipContent className="bg-neutral-900 border-red-900/50">
                                                                                            <p className="text-xs">
                                                                                                {`La mesure ${alert.measureName} du bâtiment ${alert.building} consomme ${currentConsumption?.toFixed(0)}W, `}
                                                                                                <br />
                                                                                                {`dépassant le seuil d'alerte fixé à ${alert.threshold}W`}
                                                                                            </p>
                                                                                        </TooltipContent>
                                                                                    </Tooltip>
                                                                                </TooltipProvider>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-0.5">
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => toggleAlert(alert.id)}
                                                                                className={cn(
                                                                                    "hover:bg-neutral-700 p-1 h-auto",
                                                                                    isExceedingThreshold && "text-red-400 hover:text-red-300"
                                                                                )}
                                                                            >
                                                                                {alert.isActive ? (
                                                                                    <BellPlus className="h-2.5 w-2.5" />
                                                                                ) : (
                                                                                    <AlertCircle className="h-2.5 w-2.5" />
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
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
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
                                        <div className="w-full flex flex-col gap-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-neutral-400">{tool.name}</span>
                                            </div>
                                            <div className="flex flex-col gap-2 bg-neutral-900/50 p-2 rounded-lg border border-neutral-800">
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        value={newAlertThreshold}
                                                        onChange={(e) => setNewAlertThreshold(Number(e.target.value))}
                                                        className="w-20 bg-neutral-800 text-xs h-7 rounded-md"
                                                        placeholder="Seuil (W)"
                                                    />
                                                    <MeasureSelector />
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            if (selectedMeasureForAlert) {
                                                                addAlert();
                                                            }
                                                        }}
                                                        className="bg-neutral-800 hover:bg-neutral-700 h-7 w-7 p-0 rounded-md flex items-center justify-center shrink-0"
                                                        disabled={!selectedMeasureForAlert}
                                                    >
                                                        <BellPlus className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                                <div className="h-[120px] overflow-y-auto scrollbar-thin bg-neutral-800/50 rounded-lg p-1">
                                                    {alerts.length === 0 ? (
                                                        <div className="flex flex-col items-center justify-center h-full text-neutral-400 text-xs gap-1">
                                                            <AlertCircle className="h-4 w-4 opacity-50" />
                                                            <p>Aucune alerte</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-1 pr-2">
                                                            {alerts.map(alert => {
                                                                const currentConsumption = alert.measureId ?
                                                                    chartData?.find(item => item.id.startsWith(alert.measureId || ''))?.totalConsumption :
                                                                    currentBuildingData[alert.building];

                                                                const isExceedingThreshold = currentConsumption && currentConsumption >= alert.threshold;

                                                                return (
                                                                    <div
                                                                        key={alert.id}
                                                                        className={cn(
                                                                            "flex items-center justify-between p-1.5 rounded-md transition-colors border",
                                                                            isExceedingThreshold
                                                                                ? "bg-red-950/50 border-red-900/50 text-red-200"
                                                                                : alert.isActive
                                                                                    ? "bg-neutral-800 border-neutral-700"
                                                                                    : "bg-neutral-800/50 border-neutral-700/50"
                                                                        )}
                                                                    >
                                                                        <div className="flex items-center gap-1.5">
                                                                            <div
                                                                                className={cn(
                                                                                    "w-1.5 h-1.5 rounded-full",
                                                                                    isExceedingThreshold
                                                                                        ? "bg-red-500"
                                                                                        : alert.isActive
                                                                                            ? "bg-green-500"
                                                                                            : "bg-neutral-600"
                                                                                )}
                                                                            />
                                                                            <span className="text-xs text-neutral-200 truncate max-w-[120px]">
                                                                                {alert.measureId ? (
                                                                                    `${alert.measureName}`
                                                                                ) : (
                                                                                    `Bât. ${alert.building}`
                                                                                )}
                                                                            </span>
                                                                            {isExceedingThreshold && (
                                                                                <TooltipProvider>
                                                                                    <Tooltip>
                                                                                        <TooltipTrigger>
                                                                                            <Info className="h-3 w-3 text-red-400" />
                                                                                        </TooltipTrigger>
                                                                                        <TooltipContent className="bg-neutral-900 border-red-900/50">
                                                                                            <p className="text-xs text-white">
                                                                                                {`La mesure ${alert.measureName} du bâtiment ${alert.building} consomme ${currentConsumption?.toFixed(0)}W, `}
                                                                                                <br />
                                                                                                {`dépassant le seuil d'alerte fixé à ${alert.threshold}W`}
                                                                                            </p>
                                                                                        </TooltipContent>
                                                                                    </Tooltip>
                                                                                </TooltipProvider>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-0.5">
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => toggleAlert(alert.id)}
                                                                                className={cn(
                                                                                    "hover:bg-neutral-700 p-1 h-auto",
                                                                                    isExceedingThreshold && "text-red-400 hover:text-red-300"
                                                                                )}
                                                                            >
                                                                                {alert.isActive ? (
                                                                                    <BellPlus className="h-2.5 w-2.5" />
                                                                                ) : (
                                                                                    <AlertCircle className="h-2.5 w-2.5" />
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
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
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