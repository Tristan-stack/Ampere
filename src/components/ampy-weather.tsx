import React, { useEffect, useState } from 'react';
import { Sparkles, Wind, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ShinyText from './shiny';
import { useData } from '@/app/(protected)/context/DataContext';

interface WeatherData {
    temperature: number;
    humidity: number;
    visibility: number;
    cloudCover: number;
    precipitation: number;
    date: string;
}

interface AmypWeatherProps {
    score: number;
}

const CO2_PER_KWH = 32; // gCO2/kWh en France

const AmpyWeather: React.FC<AmypWeatherProps> = ({ score }) => {
    const { filteredData } = useData();
    const [messages, setMessages] = useState<string[]>([]);
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
    const [previousDayEmissions, setPreviousDayEmissions] = useState<number | null>(null);

    const generateWeatherInsights = (data: WeatherData[], currentScore: number) => {
        const insights: string[] = [];
        const dailyData = data.reduce((acc: { [key: string]: WeatherData[] }, curr) => {
            const date = curr.date.split('T')[0];
            if (date) {
                if (!acc[date]) acc[date] = [];
                acc[date].push(curr);
            }
            return acc;
        }, {});

        // Messages liés au score
        for (const [date, dayData] of Object.entries(dailyData)) {
            const avgTemp = dayData.reduce((sum, d) => sum + d.temperature, 0) / dayData.length;
            const avgCloud = dayData.reduce((sum, d) => sum + d.cloudCover, 0) / dayData.length;
            const avgVisibility = dayData.reduce((sum, d) => sum + d.visibility, 0) / dayData.length;
            const dateStr = new Date(date).toLocaleDateString('fr-FR', { weekday: 'long' });

            if (avgTemp < 5) {
                insights.push(
                    currentScore < 5
                        ? `Le score plus bas peut s'expliquer par les conditions météo de ${dateStr} : temps froid nécessitant plus d'énergie.`
                        : `Malgré le temps froid de ${dateStr}, la consommation reste maîtrisée !`
                );
            }

            // Insights météo généraux
            insights.push(`${dateStr}, la température moyenne était de ${avgTemp.toFixed(1)}°C.`);

            if (avgCloud > 80) {
                insights.push(`${dateStr} était particulièrement nuageux avec ${avgCloud.toFixed(0)}% de couverture nuageuse.`);
            }

            if (avgVisibility < 5000) {
                insights.push(`La visibilité était réduite ${dateStr} (${(avgVisibility / 1000).toFixed(1)} km).`);
            }
        }

        // Trouver le jour le plus chaud/froid
        const avgTemps = Object.entries(dailyData).map(([date, data]) => ({
            date,
            temp: data.reduce((sum, d) => sum + d.temperature, 0) / data.length
        }));

        const hottest = avgTemps.reduce((prev, current) =>
            prev.temp > current.temp ? prev : current
        );
        const coldest = avgTemps.reduce((prev, current) =>
            prev.temp < current.temp ? prev : current
        );

        insights.push(`${new Date(hottest.date).toLocaleDateString('fr-FR', { weekday: 'long' })} était le jour le plus chaud avec ${hottest.temp.toFixed(1)}°C.`);
        insights.push(`${new Date(coldest.date).toLocaleDateString('fr-FR', { weekday: 'long' })} était le jour le plus froid avec ${coldest.temp.toFixed(1)}°C.`);

        return insights;
    };

    const calculateEmissions = (data: any[]) => {
        // Convertir Wh en kWh et multiplier par le facteur d'émission
        const totalConsumption = data.reduce((acc, item) => acc + item.totalConsumption, 0);
        return (totalConsumption / 1000) * CO2_PER_KWH;
    };

    const getCurrentDayEmissions = () => {
        const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
        const todayData = filteredData.filter(item =>
            new Date(item.date).toISOString().split('T')[0] === today
        );
        return calculateEmissions(todayData);
    };

    const getPreviousDayEmissions = () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const yesterdayData = filteredData.filter(item =>
            new Date(item.date).toISOString().split('T')[0] === yesterdayStr
        );
        return calculateEmissions(yesterdayData);
    };


    useEffect(() => {
        if (typeof window === 'undefined') return;

        const fetchWeatherData = async () => {
            try {
                const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=48.8156&longitude=7.7905&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,cloud_cover,visibility&past_days=7');
                const data = await response.json();
                const processedData: WeatherData[] = data.hourly.time.map((time: string, index: number) => ({
                    date: time,
                    temperature: data.hourly.temperature_2m[index],
                    humidity: data.hourly.relative_humidity_2m[index],
                    visibility: data.hourly.visibility[index],
                    cloudCover: data.hourly.cloud_cover[index],
                    precipitation: data.hourly.precipitation_probability[index]
                }));

                setWeatherData(processedData);
                setMessages(generateWeatherInsights(processedData, score));
            } catch (error) {
                console.error('Erreur lors de la récupération des données météo:', error);
            }
        };

        fetchWeatherData();
    }, [score]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
        }, 45000);

        return () => clearInterval(interval);
    }, [messages.length]);

    useEffect(() => {
        setPreviousDayEmissions(getPreviousDayEmissions());
    }, [filteredData]);

    const currentEmissions = getCurrentDayEmissions();
    const emissionsDiff = previousDayEmissions ?
        ((currentEmissions - previousDayEmissions) / previousDayEmissions) * 100 :
        null;

    if (!messages.length) return null;

    return (
        <div className="flex flex-col">
            {/* Section émissions de carbone */}
            <div className="flex flex-col gap-2 mb-3 3xl:mb-3">
                <p className="text-md 3xl:text-lg font-bold text-neutral-300">
                    Émissions de carbone (approx.)
                </p>
                <div className="flex items-center gap-3 -mt-3">
                    <Wind className="w-7 h-7 3xl:w-10 3xl:h-10 stroke-1 text-neutral-300" />
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl 3xl:text-4xl font-light text-neutral-300">
                            {currentEmissions.toFixed(0)} gCO₂
                        </span>
                        <div className="flex items-center gap-1">
                            {emissionsDiff === null ? (
                                <ArrowRight className="w-4 h-4 text-neutral-500" />
                            ) : emissionsDiff > 0 ? (
                                <TrendingUp className="w-4 h-4 text-red-500" />
                            ) : (
                                <TrendingDown className="w-4 h-4 text-emerald-500" />
                            )}
                            {emissionsDiff !== null && (
                                <span className={`text-lg ${emissionsDiff > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {Math.abs(emissionsDiff).toFixed(0)}%
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* Message météo */}
            <div className="flex items-center justify-center mt-0 3xl:mt-3 gap-3 text-base text-neutral-400 h-8">
                <Sparkles className="w-5 h-5 text-neutral-500" />
                <div className="relative h-8 flex-1">
                    <AnimatePresence mode="wait">

                        <motion.div
                            key={currentMessageIndex}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                            className="w-fit h-fit text-sm 3xl:text-md"
                        >
                            <ShinyText
                                text={messages[currentMessageIndex] ?? "Chargement..."}

                                disabled={false}
                                speed={3}
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

        </div>
    );
};

export default AmpyWeather; 