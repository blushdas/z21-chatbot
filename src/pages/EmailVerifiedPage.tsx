import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

const EmailVerifiedPage = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Countdown and auto-redirect to onboarding for first-time users
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      navigate('/onboarding');
    }
  }, [countdown, navigate]);

  return (
    <div className="min-h-screen bg-brand-blue flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="w-full bg-white border-0 shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center animate-pulse">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-green-600">Email Verified!</CardTitle>
            <CardDescription className="text-base mt-2">
              Your email has been successfully verified.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Redirecting to welcome screen in
              </p>
              <p className="text-3xl font-bold text-brand-blue">
                {countdown}
              </p>
            </div>

            <Button
              onClick={() => navigate('/onboarding')}
              className="w-full"
            >
              Continue to Welcome
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailVerifiedPage;
