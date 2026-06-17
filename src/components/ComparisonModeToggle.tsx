import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Zap, Sparkles } from 'lucide-react';

interface DualResponseModeToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export const DualResponseModeToggle: React.FC<DualResponseModeToggleProps> = ({
  enabled,
  onToggle
}) => {
  return (
    <div className="flex items-center space-x-3 p-4 border rounded-lg bg-background hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <div className="flex flex-col">
          <Label htmlFor="dual-response-mode" className="text-sm font-medium cursor-pointer">
            Dual Response Mode
          </Label>
          <span className="text-xs text-muted-foreground">
            Get two different responses to compare and choose from
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-2 ml-auto">
        {enabled && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Zap className="h-3 w-3" />
            <span>Active</span>
          </div>
        )}
        <Switch
          id="dual-response-mode"
          checked={enabled}
          onCheckedChange={onToggle}
        />
      </div>
    </div>
  );
};