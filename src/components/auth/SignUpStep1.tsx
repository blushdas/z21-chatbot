import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, AlertCircle, Info, Check, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { supabase } from '@/integrations/supabase/client';

// List of authorized domains (also validated server-side)
const AUTHORIZED_DOMAINS = [
  'rival.re',
  'correctcraft.com',
  'rootedpursuits.com',
  'solvholdings.com',
  'revivehomebrands.com',
  'ambassador-enterprises.com',
  'ambassadorenterprises.com',
  'ae.com',
  'crownjewelapps.com',
  'crownjewelpro.com',
  'astraapplications.com',
  'gopersonify.com',
  'dodenlegacy.com',
  'emporiaventures.com'
];

interface SignUpStep1Props {
  name: string;
  email: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onNext: () => void;
}

const SignUpStep1: React.FC<SignUpStep1Props> = ({
  name,
  email,
  onNameChange,
  onEmailChange,
  onNext,
}) => {
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailCheckResult, setEmailCheckResult] = useState<'valid' | 'invalid' | null>(null);

  // Real-time email format validation
  const isValidEmailFormat = useMemo(() => {
    if (!email) return false;
    // Standard email regex pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, [email]);

  // Check if email domain is authorized (client-side quick check)
  const isAuthorizedDomain = useMemo(() => {
    if (!email) return false;
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;
    return AUTHORIZED_DOMAINS.includes(domain);
  }, [email]);

  // Debounced background check for existing accounts and domain validation
  useEffect(() => {
    // Reset states when email changes
    setEmailCheckResult(null);
    setEmailError(null);

    // Only check if email format is valid
    if (!isValidEmailFormat) {
      return;
    }

    // Quick client-side domain check first
    if (!isAuthorizedDomain) {
      setEmailError('unauthorized_domain');
      setEmailCheckResult('invalid');
      return;
    }

    // Debounce the check by 800ms
    const timeoutId = setTimeout(async () => {
      setIsCheckingEmail(true);

      try {
        // Validate domain via edge function (bypasses RLS for unauthenticated users)
        const { data: domainResult, error: domainError } = await supabase.functions.invoke('validate-email-domain', {
          body: { email: email.toLowerCase() }
        });

        if (domainError || !domainResult?.isAuthorized) {
          setEmailError('unauthorized_domain');
          setEmailCheckResult('invalid');
          setIsCheckingEmail(false);
          return;
        }

        // Check if email already exists in profiles
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('email')
          .eq('email', email.toLowerCase())
          .maybeSingle();

        if (existingProfile) {
          setEmailError('account_exists');
          setEmailCheckResult('invalid');
          setIsCheckingEmail(false);
          return;
        }

        // Email is valid and available
        setEmailCheckResult('valid');
      } catch (error) {
        console.error('Background validation error:', error);
        // Don't show error for background checks, just don't mark as valid
        setEmailCheckResult(null);
      } finally {
        setIsCheckingEmail(false);
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [email, isValidEmailFormat, isAuthorizedDomain]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim()) {
      return;
    }

    // If background check already validated, proceed immediately
    if (emailCheckResult === 'valid') {
      onNext();
      return;
    }

    // Otherwise, do the validation now
    setIsValidating(true);

    try {
      // Check if email already exists in profiles (which means account exists)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (existingProfile) {
        setEmailError('account_exists');
        setEmailCheckResult('invalid');
        setIsValidating(false);
        return;
      }

      // Email is valid and available
      setEmailCheckResult('valid');

      // Proceed to next step
      setEmailCheckResult('valid');
      onNext();
    } catch (error) {
      console.error('Validation error:', error);
      setEmailError('An error occurred during validation');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Beta Exclusive Notice */}
      <Alert className="border-brand-yellow bg-brand-yellow/10">
        <Info className="h-4 w-4 text-brand-yellow" />
        <AlertDescription className="text-sm">
          <strong className="font-semibold">Welcome to the Daryle.AI Beta</strong>
          <p className="mt-1 text-muted-foreground">
            This early-access beta is exclusively available to Ambassador Enterprises 
            employees and approved AE affiliates/partners. If you were invited to 
            participate, please complete the form below.
          </p>
        </AlertDescription>
      </Alert>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-heading font-semibold text-foreground">
          Create Your Beta Account
        </h2>
        <p className="text-muted-foreground">
          Start your leadership development journey 🚀
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            required
            autoFocus
            disabled={isValidating}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">
            Email * <span className="text-xs text-muted-foreground">(AE or approved affiliate)</span>
          </Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              placeholder="you@ambassador-enterprises.com"
              value={email}
              onChange={(e) => {
                onEmailChange(e.target.value);
                setEmailError(null);
                setEmailCheckResult(null);
              }}
              required
              disabled={isValidating}
              className={emailError ? 'border-destructive pr-10' : 'pr-10'}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isCheckingEmail && (
                <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
              )}
              {!isCheckingEmail && emailCheckResult === 'valid' && (
                <Check className="h-5 w-5 text-green-600 dark:text-green-500" />
              )}
              {!isCheckingEmail && isValidEmailFormat && !emailCheckResult && !emailError && (
                <Check className="h-5 w-5 text-muted-foreground/40" />
              )}
            </div>
          </div>
          {email && !isValidEmailFormat && !emailError && (
            <p className="text-xs text-muted-foreground">
              Please enter a valid email address
            </p>
          )}
          {isCheckingEmail && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Checking email availability...
            </p>
          )}
          {!isCheckingEmail && emailCheckResult === 'valid' && !emailError && (
            <p className="text-xs text-green-700 dark:text-green-400 flex items-center gap-1">
              <Check className="h-3 w-3" />
              Email is available and authorized
            </p>
          )}
          {emailError && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {emailError === 'account_exists' ? (
                  <div className="space-y-2">
                    <p className="font-semibold">This account already exists.</p>
                    <p>An account with this email is already registered. Please sign in instead.</p>
                    <Link to="/login" className="inline-block mt-2 underline font-medium hover:text-destructive-foreground">
                      Go to Sign In →
                    </Link>
                  </div>
                ) : emailError === 'unauthorized_domain' ? (
                  <div className="space-y-2">
                    <p className="font-semibold">Email domain not authorized.</p>
                    <p>Only approved organization email addresses can sign up. Please use your work email from an authorized domain.</p>
                  </div>
                ) : (
                  emailError
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full mt-6" 
          disabled={isValidating || isCheckingEmail || !name.trim() || !email.trim() || !isValidEmailFormat}
        >
          {isValidating ? (
            <span className="animate-pulse">Validating...</span>
          ) : (
            <>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {/* Beta Access Details */}
      <div className="mt-6 pt-6 border-t">
        <p className="text-xs text-muted-foreground">
          <strong>Your beta access includes:</strong>
        </p>
        <ul className="text-xs text-muted-foreground mt-2 space-y-1 ml-4 list-disc">
          <li>Personalized coaching modeled on Daryl Doden's leadership principles</li>
          <li>Multiple conversation modes (Coach, Strategic, Legacy, AE Ambassador)</li>
          <li>Early access to new features before public release</li>
        </ul>
      </div>
    </div>
  );
};

export default SignUpStep1;
