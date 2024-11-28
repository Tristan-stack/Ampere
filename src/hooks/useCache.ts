// src/hooks/useCache.ts
import { useState } from "react";

const useCache = <T,>(key: string, initialValue: T) => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            const parsed = item ? JSON.parse(item) : initialValue;
            console.log(`Initializing useCache for key "${key}":`, parsed);
            return parsed;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue = (value: T) => {
        try {
            setStoredValue(value);
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(error);
        }
    };

    const remove = () => {
        try {
            window.localStorage.removeItem(key);
            setStoredValue(initialValue);
        } catch (error) {
            console.error(error);
        }
    };

    return { storedValue, setValue, remove };
};

export default useCache;