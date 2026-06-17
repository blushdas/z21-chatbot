import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { REMEMBER_ME_KEY, setRememberMePreference } from '@/utils/sessionStorageAdapter';
import { safeRedirect } from '@/utils/safeRedirect';

const SignInForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  // Pre-fill checkbox based on last user preference
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem(REMEMBER_ME_KEY) !== 'false';
  });
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = safeRedirect(searchParams.get('redirect'));

  const validateEmailDomain = async (emailToValidate: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('validate-email-domain', {
        body: { email: emailToValidate }
      });
      
      if (error) {
        console.error('Domain validation error:', error);
        return false;
      }
      
      return data?.isAuthorized === true;
    } catch (err) {
      console.error('Domain validation failed:', err);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError(null);

    try {
      // Validate email domain before attempting login
      const isAuthorized = await validateEmailDomain(email);
      
      if (!isAuthorized) {
        toast.error('Access restricted to authorized organization emails only.');
        setIsLoading(false);
        return;
      }

      // Check IP/country access controls before attempting auth
      const { data: ipCheck, error: ipCheckError } = await supabase.functions.invoke('pre-auth-check', { body: {} });
      if (ipCheckError || ipCheck?.allowed === false) {
        toast.error('Access restricted. Contact your administrator.');
        setIsLoading(false);
        return;
      }

      // Set the "Remember Me" preference BEFORE signIn so the storage adapter uses it
      setRememberMePreference(rememberMe);

      const { error, twoFactor } = await signIn(email, password);
      
      if (error) {
        const msg = error.message || 'Invalid email or password.';
        setLoginError(msg);
        toast.error(msg);
        setIsLoading(false);
      } else if (twoFactor?.requires2FA) {
        // SECURITY: Redirect immediately to 2FA challenge - no toast here
        // User state is blocked by pending2FA flag, so no flash will occur
        navigate('/auth/2fa-challenge', { 
          state: { 
            userId: twoFactor.pendingUserId, 
            method: twoFactor.twoFactorMethod,
            email: twoFactor.pendingEmail,
            rememberMe: rememberMe, // Pass through 2FA flow
            returnTo: redirectTo,
          },
          replace: true
        });
        // Keep loading state during redirect
      } else {
        // Success without 2FA - navigate to chat directly.
        // Routing through '/' goes via RootRoute which renders a spinner
        // and then redirects to /chat, causing a visible flash.
        const target = redirectTo === '/' ? '/chat' : redirectTo;
        navigate(target, { replace: true });
      }
    } catch (err) {
      const msg = 'An unexpected error occurred. Please try again.';
      setLoginError(msg);
      toast.error(msg);
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              to="/forgot-password"
              className="text-sm text-brand-blue hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              disabled={isLoading}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground focus:outline-none"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {loginError && (
          <p className="text-sm text-destructive font-medium">{loginError}</p>
        )}

        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember-me"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked === true)}
            disabled={isLoading}
          />
          <Label 
            htmlFor="remember-me" 
            className="text-sm font-normal cursor-pointer text-muted-foreground"
          >
            Remember me
          </Label>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <Link to="/signup" className="text-brand-blue hover:underline font-medium">
          Sign up
        </Link>
      </p>
    </form>
  );
};

export default SignInForm;
