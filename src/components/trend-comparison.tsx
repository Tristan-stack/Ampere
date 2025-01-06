import React from 'react';
import {
    TrendingDown,
    TrendingUp
} from 'lucide-react';

const TrendComparison = ({ current, previous, type, unit }: { current: number, previous: number, type: string, unit: string }) => {
    const difference = current - previous;
    const percentChange = ((difference) / previous * 100).toFixed(1);
    const isImprovement = difference < 0;

    const displayValue = type === 'percent' ? `${isImprovement ? '-' : '+'}${Math.abs(Number(percentChange))}%` : `${isImprovement ? '-' : '+'}${Math.abs(difference)}`;

    return (
        <div className="flex items-center space-x-1">
            {isImprovement ? (
                <TrendingDown className="text-green-500" />
            ) : (
                <TrendingUp className="text-red-500" />
            )}
            <span className={`text-lg ${isImprovement ? 'text-green-500' : 'text-red-500'}`}>
                {displayValue} {unit}
            </span>
        </div>
    );
};

export default TrendComparison;