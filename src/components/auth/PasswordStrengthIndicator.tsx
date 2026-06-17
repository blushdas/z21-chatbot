import React from 'react';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
  strength: number; // 0-5
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ 
  password, 
  strength 
}) => {
  if (!password) return null;

  const getStrengthLabel = () => {
    if (strength === 0) return 'Very Weak';
    if (strength === 1) return 'Weak';
    if (strength === 2) return 'Fair';
    if (strength === 3) return 'Good';
    if (strength === 4) return 'Strong';
    return 'Very Strong';
  };

  const getStrengthColor = () => {
    if (strength <= 1) return 'bg-destructive';
    if (strength === 2) return 'bg-yellow-500';
    if (strength === 3) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              level <= strength ? getStrengthColor() : 'bg-muted'
            )}
          />
        ))}
      </div>
      <div className="space-y-1">
        <p className="text-xs">
          <span className="text-muted-foreground">Password strength: </span>
          <span className={cn(
            "font-semibold",
            strength <= 1 && "text-destructive",
            strength === 2 && "text-amber-600 dark:text-amber-500",
            strength === 3 && "text-blue-600 dark:text-blue-400",
            strength >= 4 && "text-green-600 dark:text-green-500"
          )}>
            {getStrengthLabel()}
          </span>
        </p>
        {strength < 2 && password && (
          <p className="text-xs text-amber-600 dark:text-amber-500 font-medium">
            ⚠️ Strength too low - add more character variety
          </p>
        )}
        {strength >= 2 && (
          <p className="text-xs text-green-700 dark:text-green-400">
            ✓ Meets minimum requirements
          </p>
        )}
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
