import React from 'react';

const EnergyPerformanceBar = ({ value }: { value: number }) => {
  const getColor = (val: number) => {
    if (val >= 80) return 'bg-green-500/80';
    if (val >= 60) return 'bg-yellow-500/80';
    return 'bg-red-600/80';
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center text-sm text-white/70">
        <span>Performance énergétique</span>
        <span>{value}%</span>
      </div>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden drop-shadow-[0_0_10px_rgba(200,255,255,0.3)]">
        <div 
          className={`h-full ${getColor(value)} transition-all duration-500 drop-shadow-[0_0_10px_rgba(200,255,255,1)]`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};

export default EnergyPerformanceBar;