import React from 'react';
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SaveStatus } from '@/hooks/useSaveStatusIndicator';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  className?: string;
}

export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({ 
  status, 
  className 
}) => {
  if (status === 'idle') return null;

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all",
      status === 'saving' && "bg-[var(--color-info-soft)] text-[color:var(--color-info)]",
      status === 'success' && "bg-[var(--color-success-soft)] text-[color:var(--color-success)]",
      status === 'error' && "bg-[var(--color-error-soft)] text-[color:var(--color-error)]",
      className
    )}>
      {status === 'saving' && (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Saving...</span>
        </>
      )}
      {status === 'success' && (
        <>
          <Check className="h-3 w-3" />
          <span>Saved</span>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle className="h-3 w-3" />
          <span>Save failed</span>
        </>
      )}
    </div>
  );
};
