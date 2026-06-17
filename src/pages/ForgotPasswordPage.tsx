
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const COOLDOWN_SECONDS = 60;

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const { toast } = useToast();

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown(prev => prev - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (cooldown > 0) return;
    
    setLoading(true);
    setInlineError(null);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        // Map rate-limit or known errors to friendly messages
        let friendly = error.message;
        if (error.message?.toLowerCase().includes('rate') || error.message?.toLowerCase().includes('limit') || error.message?.toLowerCase().includes('security')) {
          friendly = 'Please wait at least 60 seconds before requesting another reset link.';
        }

        setInlineError(friendly);
        toast({
          title: "Reset request failed",
          description: friendly,
          variant: "destructive"
        });
      } else {
        setSubmitted(true);
        setCooldown(COOLDOWN_SECONDS);
        toast({
          title: "Reset link sent",
          description: "Check your email for a password reset link."
        });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Please try again later.';
      setInlineError(msg);
      toast({
        title: "An error occurred",
        description: msg,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTryAgain = useCallback(() => {
    setSubmitted(false);
    setInlineError(null);
  }, []);

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
        <Link 
            to="/login" 
            className="inline-flex items-center text-sm text-[var(--chat-text-secondary)] hover:text-[var(--chat-text)] dark:hover:text-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Login
          </Link>
        </div>

        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-brand-green">
              Reset Your Password
            </CardTitle>
            <CardDescription>
              {submitted 
                ? "We've sent you a reset link" 
                : "Enter your email to receive a password reset link"
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {submitted ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <Mail className="h-12 w-12 text-brand-green" />
                </div>
                <div className="space-y-2">
                  <p className="text-green-700 dark:text-green-400 font-medium">
                    Check your email for a reset link
                  </p>
                  <p className="text-sm text-[var(--chat-text-secondary)]">
                    We've sent a password reset link to <strong>{email}</strong>
                  </p>
                  <p className="text-xs text-[var(--chat-muted)]">
                    Don't see the email? Check your spam folder or try again.
                  </p>
                </div>
                <div className="pt-4 space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={cooldown > 0}
                    onClick={handleTryAgain}
                  >
                    {cooldown > 0 ? `Try again in ${cooldown}s` : 'Send another link'}
                  </Button>
                  <Link to="/login">
                    <Button variant="ghost" className="w-full">
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                {inlineError && (
                  <p className="text-sm text-destructive font-medium">{inlineError}</p>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full bg-brand-green hover:bg-brand-green/90"
                  disabled={loading || cooldown > 0}
                >
                  {loading ? 'Sending Reset Link...' : cooldown > 0 ? `Wait ${cooldown}s` : 'Send Reset Link'}
                </Button>
                
                <div className="text-center">
                  <Link 
                    to="/login" 
                    className="text-sm text-[var(--chat-text-secondary)] hover:text-[var(--chat-text)] dark:hover:text-gray-100"
                  >
                    Remember your password? Sign in
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
