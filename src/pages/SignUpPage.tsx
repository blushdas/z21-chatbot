import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/SupabaseAuthContext';

const SignUpPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-brand-blue flex items-center justify-center p-4">
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
                src="/lovable-uploads/Daryle_Logo_White.svg"
                alt="Daryle AI"
                className="h-32 w-auto"
              />
            </div>
            <CardDescription className="text-brand-offwhite/95 text-base font-medium">
              Sign-ups are temporarily closed
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-8 pb-6 px-8 text-center space-y-4">
            <h2 className="text-xl font-heading font-semibold text-foreground">
              New account requests are paused
            </h2>
            <p className="text-sm text-muted-foreground">
              We're not accepting new sign-ups at this time. Please check back soon.
            </p>
            <div className="pt-4">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-brand-blue hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignUpPage;
