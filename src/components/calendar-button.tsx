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
      className="w-12 h-12 shadow-xl rounded-lg bg-gradient-to-br from-lime-700 via-neutral-900 to-neutral-900 ml-auto flex justify-center items-center hover:shadow-lime-500/20 duration-300"
    >
      <Calendar />
    </button>
  );
};

export default GradientButton;