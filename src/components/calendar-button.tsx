// GradientButton.tsx
import React from 'react';
import { Calendar } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type GradientButtonProps = {
  onClick: () => void;
};

const GradientButton: React.FC<GradientButtonProps> = ({ onClick }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className="w-8 h-8 shadow-xl rounded-lg bg-neutral-800 ml-auto flex justify-center items-center hover:shadow-white/20 duration-300"
          >
            <Calendar className='h-4' />
          </button>
        </TooltipTrigger>
        <TooltipContent className='bg-background'>
          <span className="text-xs text-neutral-400 mr-1">Selecteur de périodes</span>
          <kbd className="pointer-events-none ml-auto hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">Ctrl</span>D
          </kbd>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default GradientButton;