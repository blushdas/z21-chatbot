import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Smartphone, Shield, ArrowRight } from 'lucide-react';

const Setup2FAPage = () => {
  const navigate = useNavigate();

  const methods = [
    {
      id: 'email',
      title: 'Email Code',
      description: 'Receive 6-digit codes via email',
      icon: Mail,
      recommended: true,
      route: '/auth/setup-2fa/email'
    },
    {
      id: 'totp',
      title: 'Authenticator App',
      description: 'Use Google Authenticator, Authy, or similar apps',
      icon: Smartphone,
      recommended: false,
      route: '/auth/setup-2fa/totp'
    }
  ];

  return (
    <div className="min-h-screen bg-brand-blue flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="w-full bg-white border-0 shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-brand-blue/10 flex items-center justify-center">
                <Shield className="h-8 w-8 text-brand-blue" />
              </div>
            </div>
            <CardTitle className="text-2xl">Secure Your Account</CardTitle>
            <CardDescription className="text-base mt-2">
              Add an extra layer of security with two-factor authentication
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {methods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => navigate(method.route)}
                    className="relative flex flex-col items-start p-6 border-2 border-border rounded-lg hover:border-brand-blue hover:bg-brand-blue/5 transition-all group text-left"
                  >
                    {method.recommended && (
                      <span className="absolute top-3 right-3 text-xs font-medium bg-brand-blue text-white px-2 py-1 rounded">
                        Recommended
                      </span>
                    )}
                    <div className="h-12 w-12 rounded-full bg-brand-blue/10 flex items-center justify-center mb-4 group-hover:bg-brand-blue/20 transition-colors">
                      <Icon className="h-6 w-6 text-brand-blue" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{method.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {method.description}
                    </p>
                    <div className="flex items-center text-brand-blue text-sm font-medium mt-auto">
                      Setup Now
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>Security Recommendation:</strong> Two-factor authentication significantly improves your account security by requiring both your password and a verification code to sign in.
              </p>
            </div>

            <div className="text-center">
              <Button
                onClick={() => navigate('/')}
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
              >
                Skip for now
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                You can always enable 2FA later in your account settings
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Setup2FAPage;
