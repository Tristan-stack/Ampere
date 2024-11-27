// ProgressBorder.tsx
import React from 'react';

type ProgressBorderProps = {
    percentage: number;
};

const ProgressBorder: React.FC<ProgressBorderProps> = ({ percentage }) => {
    return (
        <div className="relative w-24 h-28 flex items-center justify-center">
            {/* Conteneur pour la bordure avec progression */}
            <div className="relative w-full h-full rounded-full flex items-center justify-center">
                {/* Progression sur la bordure arrondie */}
                <div
                    className="absolute inset-0 rounded-full border-2"
                    style={{
                        borderImage: `conic-gradient(
              yellow ${percentage * 3.6}deg, 
              transparent ${percentage * 3.6}deg
            ) 1`,
                        borderStyle: 'solid',
                    }}
                ></div>

                {/* Contenu intérieur avec fond transparent */}
                <div className="absolute inset-0 rounded-full bg-transparent flex flex-col items-center justify-center space-y-2">
                    <p className="text-2xl text-white">{percentage}%</p>
                    <p className="text-xs text-white/60">P/M-1</p>
                </div>
            </div>
        </div>
    );
};

export default ProgressBorder;