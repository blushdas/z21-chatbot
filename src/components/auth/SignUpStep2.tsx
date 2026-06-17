import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, ArrowLeft, Shield, Eye, EyeOff, Check, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import { cn } from '@/lib/utils';

interface SignUpStep2Props {
  password: string;
  confirmPassword: string;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const SignUpStep2: React.FC<SignUpStep2Props> = ({
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
  onNext,
  onBack,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordRequirements = useMemo(() => [
    { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
    { label: "Contains special character", test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
  ], []);

  const requirementsMet = useMemo(() => 
    passwordRequirements.map(req => ({
      ...req,
      met: password ? req.test(password) : false
    })), 
    [password, passwordRequirements]
  );

  const passwordStrength = useMemo(() => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return strength;
  }, [password]);

  const meetsMinimumRequirements = password.length >= 8 && /[^a-zA-Z0-9]/.test(password);
  const canContinue = password && password === confirmPassword && meetsMinimumRequirements && passwordStrength >= 2;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canContinue) {
      onNext();
    }
  };

  const passwordsMatch = !confirmPassword || password === confirmPassword;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-heading font-semibold text-foreground">
          Create a Strong Password
        </h2>
        <p className="text-muted-foreground">
          Keep your account safe and secure 🔒
        </p>
      </div>

      <div className="bg-muted/50 border border-muted-foreground/20 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">Password Requirements:</p>
        </div>
        <div className="space-y-2">
          {requirementsMet.map((req, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              {req.met ? (
                <Check className="h-4 w-4 text-green-600 dark:text-green-500 flex-shrink-0" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <span className={cn(
                "transition-colors",
                req.met ? "text-green-700 dark:text-green-400 font-medium" : "text-muted-foreground"
              )}>
                {req.label}
              </span>
            </div>
          ))}
          <div className="flex items-start gap-2 text-xs pt-2 border-t border-muted-foreground/10">
            <Shield className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <span className="text-muted-foreground">
              Password will be verified against data breaches when you create your account
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              required
              autoFocus
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          <PasswordStrengthIndicator password={password} strength={passwordStrength} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => onConfirmPasswordChange(e.target.value)}
              required
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          {confirmPassword && !passwordsMatch && (
            <p className="text-xs text-destructive">Passwords do not match</p>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex-1">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!canContinue}
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </TooltipTrigger>
              {!canContinue && (
                <TooltipContent>
                  <p className="text-xs">Meet minimum requirements (8 characters, special character, Fair strength)</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
        {!canContinue && password && (
          <p className="text-xs text-center text-muted-foreground">
            Please meet minimum requirements to continue
          </p>
        )}
      </form>
    </div>
  );
};

export default SignUpStep2;
