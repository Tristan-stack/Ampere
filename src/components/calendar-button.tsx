// GradientButton.tsx
import React from 'react';
import { Calendar } from 'lucide-react';

type GradientButtonProps = {
  onClick: () => void;
};

const GradientButton: React.FC<GradientButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-12 h-12 shadow-xl rounded-lg bg-neutral-800 ml-auto flex justify-center items-center hover:shadow-white/20 duration-300"
    >
      <Calendar />
    </button>
  );
};

export default GradientButton;