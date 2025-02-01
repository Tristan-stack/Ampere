'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface WeatherData {
    temperature: number;
    humidity: number;
    visibility: number;
    cloudCover: number;
    precipitation: number;
    date: string;
}

interface WeatherContextType {
    weatherData: WeatherData[];
    isLoading: boolean;
    error: string | null;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

export const WeatherProvider = ({ children }: { children: React.ReactNode }) => {
    const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWeatherData = async () => {
            try {
                const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=48.8156&longitude=7.7905&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,cloud_cover,visibility&past_days=7');
                const data = await response.json();

                const now = new Date();
                const processedData = data.hourly.time
                    .map((time: string, index: number) => {
                        if (!time) return null;
                        return {
                            date: time,
                            temperature: data.hourly.temperature_2m[index],
                            humidity: data.hourly.relative_humidity_2m[index],
                            visibility: data.hourly.visibility[index],
                            cloudCover: data.hourly.cloud_cover[index],
                            precipitation: data.hourly.precipitation_probability[index]
                        };
                    })
                    .filter((item: WeatherData | null): item is WeatherData => item !== null && new Date(item.date) <= now);

                setWeatherData(processedData);
            } catch (error) {
                setError('Erreur lors de la récupération des données météo');
            } finally {
                setIsLoading(false);
            }
        };

        fetchWeatherData();
        const interval = setInterval(fetchWeatherData, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <WeatherContext.Provider value={{ weatherData, isLoading, error }}>
            {children}
        </WeatherContext.Provider>
    );
};

export const useWeather = () => {
    const context = useContext(WeatherContext);
    if (context === undefined) {
        throw new Error('useWeather doit être utilisé à l\'intérieur d\'un WeatherProvider');
    }
    return context;
}; 