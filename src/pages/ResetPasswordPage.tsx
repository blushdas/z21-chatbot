
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isValidSession, setIsValidSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  // R1: Track if recovery context has been consumed (422 dead-end)
  const [recoveryConsumed, setRecoveryConsumed] = useState(false);
  const isValidSessionRef = useRef(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const markValid = () => {
      if (!isMounted || isValidSessionRef.current) return;
      setIsValidSession(true);
      isValidSessionRef.current = true;
      if (timeoutId) clearTimeout(timeoutId);
    };

    console.log('[ResetPassword] Mount — listening for PASSWORD_RECOVERY event');

    // Immediate check: if AuthContext already caught PASSWORD_RECOVERY and set the flag
    if (sessionStorage.getItem('daryle_recovery_active') === 'true') {
      console.log('[ResetPassword] Found daryle_recovery_active flag — marking valid immediately');
      sessionStorage.removeItem('daryle_recovery_active');
      markValid();
    }

    // R3: Only accept PASSWORD_RECOVERY event as valid — not SIGNED_IN or bare getSession
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      console.log('[ResetPassword] Auth event:', event, session ? 'has session' : 'no session');

      if (event === 'PASSWORD_RECOVERY' && session) {
        markValid();
      }
    });

    // Polling fallback: retry getSession() every 500ms for up to 10s
    // Catches the case where PKCE exchange completes after mount but before the event fires
    let pollCount = 0;
    const maxPolls = 20; // 20 * 500ms = 10s
    const pollInterval = setInterval(() => {
      if (!isMounted || isValidSessionRef.current) {
        clearInterval(pollInterval);
        return;
      }
      pollCount++;
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && isMounted && !isValidSessionRef.current) {
          console.log('[ResetPassword] Polling found session on attempt', pollCount);
          markValid();
        }
      });
      if (pollCount >= maxPolls) {
        clearInterval(pollInterval);
      }
    }, 500);

    // Fallback timeout — if no valid session after 10s, show error
    timeoutId = setTimeout(() => {
      if (isMounted && !isValidSessionRef.current) {
        setSessionError('This password reset link has expired or is invalid. Please request a new one.');
      }
    }, 10000);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearInterval(pollInterval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [navigate]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setErrors({});
    
    try {
      // Verify session exists before attempting update
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setErrors({ password: 'Your reset session has expired. Please request a new reset link.' });
        toast({
          title: "Session expired",
          description: "Please request a new password reset link.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      console.log('[ResetPassword] Attempting password update...');

      // Wrap updateUser with a timeout to prevent infinite hang
      const updatePromise = supabase.auth.updateUser({ password: password });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Password update timed out. Please request a new reset link.')), 15000)
      );

      const { error } = await Promise.race([updatePromise, timeoutPromise]);

      console.log('[ResetPassword] Password update result:', error ? `Error: ${error.message}` : 'Success');

      if (error) {
        // R1: Check for 422 / recovery-consumed errors — dead-end the form
        const is422 = (error as any)?.status === 422 || error.message?.toLowerCase().includes('same') || error.message?.toLowerCase().includes('different');
        
        if (is422) {
          // Recovery context consumed — no further attempts possible
          setRecoveryConsumed(true);
          toast({
            title: "Reset session expired",
            description: "Please request a new password reset link.",
            variant: "destructive"
          });
        } else {
          // Map known Supabase errors to user-friendly messages
          let friendlyMessage = error.message;
          setErrors({ password: friendlyMessage });
          toast({
            title: "Password update failed",
            description: friendlyMessage,
            variant: "destructive"
          });
        }
      } else {
        setConfirmed(true);
        toast({
          title: "Password updated successfully",
          description: "You can now log in with your new password."
        });
        
        // Sign out to clear recovery session, then redirect to login
        await supabase.auth.signOut({ scope: 'local' });
        setTimeout(() => {
          navigate('/auth');
        }, 3000);
      }
    } catch (error) {
      console.error('Password update error:', error);
      const msg = error instanceof Error ? error.message : 'Please try again later.';
      setErrors({ password: msg });
      toast({
        title: "An error occurred",
        description: msg,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          {sessionError ? (
            <>
              <p className="text-red-600 dark:text-red-400 font-medium">{sessionError}</p>
              <p className="text-sm text-[var(--chat-muted)]">Redirecting to password reset request page...</p>
              <Link to="/forgot-password">
                <Button variant="outline" className="mt-2">
                  Request New Reset Link
                </Button>
              </Link>
            </>
          ) : (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green mx-auto"></div>
              <p className="text-[var(--chat-text-secondary)]">Validating reset session...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-brand-green">
              Set New Password
            </CardTitle>
            <CardDescription>
              {confirmed 
                ? "Your password has been updated successfully" 
                : recoveryConsumed
                ? "Your reset session has expired"
                : "Choose a strong password for your account"
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {confirmed ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <div className="space-y-2">
                  <p className="text-green-700 dark:text-green-400 font-medium">
                    Password updated successfully!
                  </p>
                  <p className="text-sm text-[var(--chat-text-secondary)]">
                    You can now log in with your new password.
                  </p>
                  <p className="text-xs text-[var(--chat-muted)]">
                    You will be redirected to the login page shortly...
                  </p>
                </div>
                <div className="pt-4">
                  <Link to="/auth">
                    <Button className="w-full bg-brand-green hover:bg-brand-green/90">
                      Go to Login
                    </Button>
                  </Link>
                </div>
              </div>
            ) : recoveryConsumed ? (
              /* R1: Recovery context consumed — dead-end UI */
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <AlertTriangle className="h-12 w-12 text-amber-500" />
                </div>
                <div className="space-y-2">
                  <p className="text-amber-700 dark:text-amber-400 font-medium">
                    This reset session can no longer be used.
                  </p>
                  <p className="text-sm text-[var(--chat-text-secondary)]">
                    The password reset token has been consumed. Please request a new reset link to try again.
                  </p>
                </div>
                <div className="pt-4">
                  <Link to="/forgot-password">
                    <Button className="w-full bg-brand-green hover:bg-brand-green/90">
                      Request New Reset Link
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-[var(--chat-muted)]" />
                      ) : (
                        <Eye className="h-4 w-4 text-[var(--chat-muted)]" />
                      )}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-[var(--chat-muted)]" />
                      ) : (
                        <Eye className="h-4 w-4 text-[var(--chat-muted)]" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-brand-green hover:bg-brand-green/90"
                  disabled={loading}
                >
                  {loading ? 'Updating Password...' : 'Update Password'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
