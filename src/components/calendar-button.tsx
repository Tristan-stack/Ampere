// GradientButton.tsx
import React from 'react';
import { Calendar } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from './ui/button';
import { cn } from "@/lib/utils"

type GradientButtonProps = {
  onClick: () => void;
};

const GradientButton: React.FC<GradientButtonProps> = ({ onClick }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={onClick}
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-9 fixed top-3 right-6 z-50",
              "bg-neutral-800 hover:bg-neutral-700",
              "shadow-[0_0_15px_rgba(255,255,255,0.2)]",
              "hover:shadow-[0_0_20px_rgba(255,255,255,0.25)]"
            )}
          >
            <Calendar className='h-4 w-4' />
          </Button>
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