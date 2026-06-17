import React from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TutorialModeToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export const TutorialModeToggle: React.FC<TutorialModeToggleProps> = ({
  enabled,
  onToggle,
}) => {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={enabled ? 'default' : 'ghost'}
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0"
          >
            <Info className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-sm">
            {enabled ? 'Hide help tooltips' : 'Show help tooltips'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
