import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentStep, totalSteps }) => {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <React.Fragment key={step}>
          <div
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300',
              step < currentStep && 'bg-brand-blue text-brand-offwhite',
              step === currentStep && 'bg-brand-yellow text-brand-blue ring-2 ring-brand-yellow ring-offset-2',
              step > currentStep && 'bg-muted text-muted-foreground'
            )}
          >
            {step < currentStep ? (
              <Check className="w-4 h-4" />
            ) : (
              <span className="text-sm font-medium">{step}</span>
            )}
          </div>
          {step < totalSteps && (
            <div
              className={cn(
                'h-0.5 w-12 transition-all duration-300',
                step < currentStep ? 'bg-brand-blue' : 'bg-muted'
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default ProgressIndicator;
