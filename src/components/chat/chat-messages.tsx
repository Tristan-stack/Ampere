import { useWeather } from '@/app/(protected)/context/WeatherContext';

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