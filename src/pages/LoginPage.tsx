
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/SupabaseAuthContext';
import SignInForm from '@/components/auth/SignInForm';

const LoginPage = () => {
  const { user, pending2FA } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated. Use `replace` and go straight to /chat
  // to avoid an intermediate render of RootRoute (which would flash a spinner
  // and then redirect again, causing a visible color flash on sign-in).
  useEffect(() => {
    if (pending2FA) {
      navigate('/auth/2fa-challenge', { replace: true });
      return;
    }

    if (user) {
      navigate('/chat', { replace: true });
    }
  }, [user, pending2FA, navigate]);

  return (
    <div className="auth-theme-stable min-h-screen bg-brand-blue flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center text-sm text-brand-offwhite hover:text-brand-offwhite/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
        </div>

        <Card className="w-full bg-white border-0 shadow-xl">
          <CardHeader className="text-center pb-6 bg-gradient-to-b from-brand-blue to-brand-blue/90">
            <div className="flex justify-center mb-4">
              <img 
                src="/lovable-uploads/Daryle_AI_Logo_PNG.png" 
                alt="Daryle AI"
                className="h-24 w-auto"
              />
            </div>
            <CardDescription className="text-brand-offwhite/95 text-base font-medium">
              Welcome back! Sign in to continue.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-8 pb-6 px-8">
            <SignInForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
