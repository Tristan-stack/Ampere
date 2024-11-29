import React, { useState, useEffect } from 'react';

type RainbowProps = {
  hovered: boolean;
};

const Rainbow: React.FC<RainbowProps> = ({ hovered }) => {
  const [animationState, setAnimationState] = useState<'initial' | 'expanding' | 'frozen'>('initial');

  useEffect(() => {
    if (hovered) {
      setAnimationState('expanding');
      const timer = setTimeout(() => {
        setAnimationState('frozen');
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setAnimationState('initial');
    }
  }, [hovered]);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="rotate-90"
    >
      <path 
        d="M22 17a10 10 0 0 0-20 0" 
        className={`rainbow-path rainbow-outer 
          ${animationState === 'expanding' ? 'animate-expand' : ''} 
          ${animationState === 'frozen' ? 'frozen' : ''}`} 
      />
      <path 
        d="M6 17a6 6 0 0 1 12 0" 
        className={`rainbow-path rainbow-middle 
          ${animationState === 'expanding' ? 'animate-expand' : ''} 
          ${animationState === 'frozen' ? 'frozen' : ''}`} 
      />
      <path 
        d="M10 17a2 2 0 0 1 4 0" 
        className={`rainbow-path rainbow-inner 
          ${animationState === 'expanding' ? 'animate-expand' : ''} 
          ${animationState === 'frozen' ? 'frozen' : ''}`} 
      />
      <style jsx>{`
        .rainbow-path {
          stroke-dasharray: 30;
          animation: dash 3s linear infinite, colorChange 10s linear infinite;
          opacity: 1;
        }
        .animate-expand {
          animation: expand 1s ease-out;
          opacity: 1;
        }
        .frozen {
          animation: none;
          stroke: white;
          opacity: 1;
        }
        @keyframes expand {
          from {
            stroke-dashoffset: 60;
            opacity: 0;
          }
          to {
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }
        @keyframes dash {
          to {
            stroke-dashoffset: 60;
          }
        }
      `}</style>
    </svg>
  );
};

export default Rainbow;