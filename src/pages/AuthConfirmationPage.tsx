import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AuthConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;
  
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    // Redirect if no email provided
    if (!email) {
      navigate('/auth');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    return `${local[0]}${'*'.repeat(Math.max(local.length - 2, 3))}${local[local.length - 1]}@${domain}`;
  };

  const handleResendEmail = async () => {
    if (cooldown > 0 || !email) return;

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      toast.success('Verification email sent!');
      setCooldown(60); // 60 second cooldown
    } catch (error: any) {
      console.error('Resend error:', error);
      toast.error(error.message || 'Failed to resend email');
    } finally {
      setIsResending(false);
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen bg-brand-blue flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link 
            to="/auth" 
            className="inline-flex items-center text-sm text-brand-offwhite hover:text-brand-offwhite/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Sign In
          </Link>
        </div>

        <Card className="w-full bg-white border-0 shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-brand-blue/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-brand-blue" />
              </div>
            </div>
            <CardTitle className="text-2xl">Beta Access Confirmation</CardTitle>
            <CardDescription className="text-base mt-2">
              Welcome to the Daryle.AI Beta! We've sent a verification email to
            </CardDescription>
            <p className="text-brand-blue font-medium mt-1">
              {maskEmail(email)}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-brand-blue/5 rounded-lg p-4 border border-brand-blue/20">
              <h3 className="font-semibold mb-3 text-brand-blue">🎯 Next Steps:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Check your email and click the verification link</li>
                <li>Start chatting with Daryle AI!</li>
              </ol>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium mb-2 text-sm">Your Beta Access Includes:</h3>
              <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                <li>Personalized coaching modeled on Daryle Doden's leadership principles</li>
                <li>Multiple conversation modes (Coach, Strategic, Legacy, AE Ambassador)</li>
                <li>Early access to new features before public release</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Can't find the email?
              </h4>
              <ul className="text-sm text-amber-700 space-y-1.5 ml-6 list-disc">
                <li>Check your <strong>primary inbox</strong> — it may take a few minutes to arrive</li>
                <li>Look in your <strong>spam or junk folder</strong></li>
                <li>Check any <strong>email filters or rules</strong> that may have sorted it elsewhere</li>
                <li>Search for emails from <strong>info@daryle.ai</strong></li>
              </ul>
            </div>

            <Button
              onClick={handleResendEmail}
              disabled={isResending || cooldown > 0}
              variant="outline"
              className="w-full"
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : cooldown > 0 ? (
                `Resend in ${cooldown}s`
              ) : (
                'Resend Verification Email'
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Already verified?{' '}
              <Link to="/auth" className="text-brand-blue hover:underline font-medium">
                Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthConfirmationPage;
