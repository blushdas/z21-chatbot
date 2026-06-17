import React, { useState } from 'react';
import { Mail, RefreshCw, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmailVerificationPromptProps {
  email: string;
  onResendSuccess?: () => void;
}

const EmailVerificationPrompt: React.FC<EmailVerificationPromptProps> = ({ 
  email, 
  onResendSuccess 
}) => {
  const [isResending, setIsResending] = useState(false);
  const [lastSentAt, setLastSentAt] = useState<Date | null>(null);
  const { toast } = useToast();
  const { signOut } = useAuth();

  const handleResendVerification = async () => {
    setIsResending(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        toast({
          title: "Failed to resend email",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setLastSentAt(new Date());
        toast({
          title: "Verification email sent",
          description: "Please check your inbox and spam folder.",
        });
        onResendSuccess?.();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend verification email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const canResend = !lastSentAt || (new Date().getTime() - lastSentAt.getTime()) > 60000; // 1 minute cooldown

  return (
    <div className="min-h-screen bg-[var(--ui-bg-hover)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-[var(--chat-text)]">
            Verify Your Email
          </CardTitle>
          <CardDescription>
            We've sent a confirmation link to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-sm text-[var(--chat-text-secondary)] space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Check your inbox for the verification email</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Don't forget to check your spam/junk folder</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Click the verification link to activate your account</span>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <Button 
              onClick={handleResendVerification}
              disabled={isResending || !canResend}
              className="w-full"
              variant="outline"
            >
              {isResending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  {canResend ? 'Resend Verification Email' : `Wait ${60 - Math.floor((new Date().getTime() - (lastSentAt?.getTime() || 0)) / 1000)}s`}
                </>
              )}
            </Button>

            <Button 
              onClick={handleSignOut}
              variant="ghost"
              className="w-full text-[var(--chat-text-secondary)]"
            >
              Sign out and use a different email
            </Button>
          </div>

          {lastSentAt && (
            <p className="text-xs text-[var(--chat-muted)] text-center mt-4">
              Last sent: {lastSentAt.toLocaleTimeString()}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerificationPrompt;