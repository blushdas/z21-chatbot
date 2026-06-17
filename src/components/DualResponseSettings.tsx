import React, { useState } from 'react';
import { Sparkles, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DualResponseSettingsProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export const DualResponseSettings: React.FC<DualResponseSettingsProps> = ({
  enabled,
  onToggle
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`flex items-center gap-2 ${enabled ? 'text-primary' : ''}`}
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">Dual Responses</span>
          {enabled && <span className="w-2 h-2 bg-primary rounded-full"></span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Dual Response Mode</h4>
            <p className="text-sm text-muted-foreground">
              Get two different responses to every question, then choose your favorite approach.
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="dual-responses"
              checked={enabled}
              onCheckedChange={(checked) => {
                console.group('🔍 DUAL RESPONSE TOGGLE');
                console.log('Toggle clicked:', { 
                  from: enabled, 
                  to: checked,
                  timestamp: new Date().toISOString()
                });
                
                // Prevent scroll position change when toggling
                const currentScrollTop = document.documentElement.scrollTop || document.body.scrollTop;
                
                onToggle(checked);
                console.log('onToggle callback executed');
                
                // Restore scroll position after toggle
                requestAnimationFrame(() => {
                  console.log('RAF executed - scroll restored to:', currentScrollTop);
                  console.groupEnd();
                  window.scrollTo(0, currentScrollTop);
                });
              }}
            />
            <Label htmlFor="dual-responses" className="text-sm font-normal">
              Enable dual responses
            </Label>
          </div>
          
          {enabled && (
            <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded border border-blue-200">
              <strong className="text-blue-700">Active:</strong> Your next messages will generate two responses for comparison.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};