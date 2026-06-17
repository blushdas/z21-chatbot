import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Shield, Mail, Smartphone, Key, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { setRememberMePreference } from '@/utils/sessionStorageAdapter';
import { clearPendingTwoFactor, useAuth } from '@/context/SupabaseAuthContext';
import { safeRedirect } from '@/utils/safeRedirect';

interface LocationState {
  userId?: string;
  method?: 'email' | 'totp';
  email?: string;
  tempPassword?: string;
  rememberMe?: boolean;
  returnTo?: string;
}

interface ChallengeState {
  userId: string;
  method: 'email' | 'totp';
  email: string;
  rememberMe?: boolean;
  returnTo?: string;
}

const TwoFactorChallengePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as LocationState | null;
  const { completeTwoFactor, pendingTwoFactor } = useAuth();
  const state: ChallengeState | null = pendingTwoFactor
    ? {
        ...pendingTwoFactor,
        rememberMe: routeState?.rememberMe,
        returnTo: routeState?.returnTo,
      }
    : null;

  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Redirect if no state (direct navigation)
  useEffect(() => {
    if (!state?.userId || !state?.method) {
      navigate('/login', { replace: true });
    }
  }, [state, navigate]);

  // Cooldown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Send email code on mount if method is email
  useEffect(() => {
    if (state?.method === 'email' && state?.userId) {
      sendEmailCode();
    }
    // Preserve "Remember Me" preference through 2FA flow
    if (state?.rememberMe !== undefined) {
      setRememberMePreference(state.rememberMe);
    }
  }, []);

  const sendEmailCode = async () => {
    if (!state?.userId) return;
    
    setIsResending(true);
    try {
      const { error } = await supabase.functions.invoke('send-2fa-email-code', {
        body: { userId: state.userId }
      });

      if (error) throw error;
      
      toast.success('Verification code sent to your email');
      setResendCooldown(60);
    } catch (error: any) {
      console.error('Error sending 2FA code:', error);
      toast.error('Failed to send verification code');
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!state?.userId || !code.trim()) return;

    setIsVerifying(true);
    try {
      const verifyMethod = useBackupCode ? 'backup' : state.method;
      
      const { data, error } = await supabase.functions.invoke('verify-2fa', {
        body: { 
          userId: state.userId, 
          code: code.trim(),
          method: verifyMethod
        }
      });

      if (error || !data?.verified) {
        throw new Error(data?.error || 'Verification failed');
      }

      clearPendingTwoFactor();
      await completeTwoFactor();

      toast.success('Two-factor authentication successful!');
      const target = safeRedirect(state.returnTo);
      navigate(target === '/' ? '/chat' : target, { replace: true });
    } catch (error: any) {
      console.error('2FA verification error:', error);
      toast.error(error.message || 'Invalid verification code');
      setCode('');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!state) {
    return null;
  }

  const methodIcon = state.method === 'email' ? Mail : Smartphone;
  const MethodIcon = methodIcon;

  return (
    <div className="auth-theme-stable min-h-screen bg-brand-blue flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link 
            to="/login" 
            className="inline-flex items-center text-sm text-brand-offwhite hover:text-brand-offwhite/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Login
          </Link>
        </div>

        <Card className="w-full bg-white border-0 shadow-xl">
          <CardHeader className="text-center pb-6 bg-gradient-to-b from-brand-blue to-brand-blue/90">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-white">
              Two-Factor Authentication
            </CardTitle>
            <CardDescription className="text-brand-offwhite/95 text-base">
              {useBackupCode ? (
                'Enter one of your backup codes'
              ) : state.method === 'email' ? (
                <>Enter the 6-digit code sent to <strong>{state.email}</strong></>
              ) : (
                'Enter the 6-digit code from your authenticator app'
              )}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-8 pb-6 px-8">
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 mb-4">
                  {useBackupCode ? (
                    <Key className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <MethodIcon className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {useBackupCode ? 'Backup Code' : state.method === 'email' ? 'Email Code' : 'Authenticator Code'}
                  </span>
                </div>
                
                <Input
                  type="text"
                  inputMode={useBackupCode ? 'text' : 'numeric'}
                  pattern={useBackupCode ? undefined : '[0-9]*'}
                  maxLength={useBackupCode ? 20 : 6}
                  placeholder={useBackupCode ? 'Enter backup code' : '000000'}
                  value={code}
                  onChange={(e) => setCode(useBackupCode ? e.target.value : e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                  autoFocus
                  autoComplete="one-time-code"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-brand-yellow hover:bg-brand-yellow/90 text-brand-blue font-semibold h-12"
                disabled={isVerifying || (useBackupCode ? code.length < 6 : code.length !== 6)}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border space-y-3">
              {state.method === 'email' && !useBackupCode && (
                <Button
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={sendEmailCode}
                  disabled={isResending || resendCooldown > 0}
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : resendCooldown > 0 ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Resend in {resendCooldown}s
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Resend Code
                    </>
                  )}
                </Button>
              )}

              <Button
                variant="ghost"
                className="w-full text-sm text-muted-foreground"
                onClick={() => {
                  setUseBackupCode(!useBackupCode);
                  setCode('');
                }}
              >
                <Key className="mr-2 h-4 w-4" />
                {useBackupCode ? 'Use verification code instead' : 'Use backup code instead'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TwoFactorChallengePage;
