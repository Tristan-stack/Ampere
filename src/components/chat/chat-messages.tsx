import { useWeather } from '@/app/(protected)/context/WeatherContext';

const calculateDailyAverages = (weatherData: any[]) => {
    const dailyData = weatherData.reduce((acc: any, curr: any) => {
        const date = new Date(curr.timestamp).toLocaleDateString();
        if (!acc[date]) {
            acc[date] = {
                temperatures: [],
                humidity: []
            };
        }
        acc[date].temperatures.push(curr.temperature);
        acc[date].humidity.push(curr.humidity);
        return acc;
    }, {});

    return Object.entries(dailyData).map(([date, data]: [string, any]) => ({
        date,
        avgTemperature: data.temperatures.reduce((a: number, b: number) => a + b, 0) / data.temperatures.length,
        avgHumidity: data.humidity.reduce((a: number, b: number) => a + b, 0) / data.humidity.length
    }));
};

export const ChatMessages = () => {
    const { weatherData } = useWeather();

    const handleSendMessage = async (message: string) => {
        // Ajouter les données météo au contexte du message
        const weatherContext = {
            currentWeather: weatherData[weatherData.length - 1],
            dailyAverages: calculateDailyAverages(weatherData),
        };

        // Envoyer le message avec le contexte météo
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                weatherContext
            })
        });
    };
}; 