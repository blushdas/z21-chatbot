import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Mail, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const EmailVerificationStatus: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isResending, setIsResending] = React.useState(false);

  const handleResendVerification = async () => {
    if (!user?.email) return;
    
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        toast({
          title: "Failed to send verification email",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Verification email sent",
          description: "Check your inbox for the verification link."
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send verification email.",
        variant: "destructive"
      });
    } finally {
      setIsResending(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[var(--chat-text-secondary)]">Not logged in</p>
        </CardContent>
      </Card>
    );
  }

  const isVerified = !!user.email_confirmed_at;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Verification Status
        </CardTitle>
        <CardDescription>
          Current verification status for {user.email}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">Email Address:</span>
          <span className="text-sm text-[var(--chat-text-secondary)]">{user.email}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="font-medium">Verification Status:</span>
          <Badge variant={isVerified ? "default" : "destructive"} className="flex items-center gap-1">
            {isVerified ? (
              <>
                <CheckCircle className="h-3 w-3" />
                Verified
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3" />
                Unverified
              </>
            )}
          </Badge>
        </div>

        {isVerified ? (
          <div className="flex items-center justify-between">
            <span className="font-medium">Verified At:</span>
            <span className="text-sm text-[var(--chat-text-secondary)]">
              {new Date(user.email_confirmed_at!).toLocaleString()}
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-[var(--color-warning-soft)] border border-[var(--color-warning-border)] rounded-lg p-3">
              <p className="text-sm text-[color:var(--color-warning)]">
                ⚠️ Your email is not verified. Some features may be limited.
              </p>
            </div>
            
            <Button 
              onClick={handleResendVerification}
              disabled={isResending}
              size="sm"
              className="w-full"
            >
              {isResending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Verification Email
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailVerificationStatus;