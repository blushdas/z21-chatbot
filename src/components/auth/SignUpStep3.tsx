import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface SignUpStep3Props {
  phone: string;
  termsAccepted: boolean;
  onPhoneChange: (value: string) => void;
  onTermsChange: (value: boolean) => void;
  onSubmit: () => void;
  onBack: () => void;
  isLoading: boolean;
}

const SignUpStep3: React.FC<SignUpStep3Props> = ({
  phone,
  termsAccepted,
  onPhoneChange,
  onTermsChange,
  onSubmit,
  onBack,
  isLoading,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (termsAccepted) {
      onSubmit();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-heading font-semibold text-foreground">
          Almost There!
        </h2>
        <p className="text-muted-foreground">
          Help us personalize your experience ✨
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">
            Phone Number <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            For two-factor authentication and account recovery
          </p>
        </div>

        <div className="flex items-start space-x-2 pt-2">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={(checked) => onTermsChange(checked === true)}
            disabled={isLoading}
          />
          <Label
            htmlFor="terms"
            className="text-sm font-normal leading-snug cursor-pointer"
          >
            I agree to the{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">
              Terms & Conditions
            </a>{' '}
            and{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">
              Privacy Policy
            </a>
          </Label>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isLoading}
            className="flex-1"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            type="submit"
            disabled={!termsAccepted || isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground pt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-blue hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default SignUpStep3;
