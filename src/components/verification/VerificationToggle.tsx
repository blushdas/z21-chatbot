import React from 'react';
import { Switch } from '@/components/ui/switch';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerificationToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

const VerificationToggle: React.FC<VerificationToggleProps> = ({ enabled, onToggle }) => (
  <div className="flex items-center gap-3">
    <ShieldCheck className={cn("h-5 w-5 transition-colors", enabled ? "text-accent" : "text-muted-foreground")} />
    <span className="text-sm font-medium text-foreground hidden sm:inline">Third-Party Verification</span>
    <Switch checked={enabled} onCheckedChange={onToggle} />
    <span className={cn(
      "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full transition-colors",
      enabled
        ? "bg-accent/20 text-accent"
        : "bg-muted text-muted-foreground"
    )}>
      {enabled ? 'Active' : 'Off'}
    </span>
  </div>
);

export default VerificationToggle;
