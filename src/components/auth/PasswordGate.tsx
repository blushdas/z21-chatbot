
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PasswordGateProps {
  children: React.ReactNode;
}

const PasswordGate: React.FC<PasswordGateProps> = ({ children }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);

  const STORAGE_KEY = 'daryle_password_authenticated';

  // Check if user was previously authenticated
  useEffect(() => {
    const savedAuth = localStorage.getItem(STORAGE_KEY);
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsValidating(true);

    try {
      const { data, error } = await supabase.functions.invoke('validate-password-gate', {
        body: { password }
      });

      if (error) {
        console.error('Password validation error:', error);
        setError('Authentication service unavailable. Please try again.');
        return;
      }

      if (data?.success) {
        setIsAuthenticated(true);
        localStorage.setItem(STORAGE_KEY, 'true');
      } else {
        setError('Incorrect password. Please try again.');
        setPassword('');
      }
    } catch (error) {
      console.error('Network error during password validation:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEY);
    setPassword('');
  };

  // Show loading state briefly
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--ui-bg-hover)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  // Show password gate if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--ui-bg-hover)] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Lock className="h-12 w-12 text-brand-blue" />
            </div>
            <CardTitle className="text-2xl font-bold text-brand-blue">
              Daryle AI Access
            </CardTitle>
            <CardDescription>
              Please enter the access password to continue
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--chat-muted)] hover:text-[var(--chat-text-secondary)]"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              
              {error && (
                <div className="text-red-500 text-sm text-center">
                  {error}
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-brand-blue text-white hover:bg-brand-blue/90 font-medium text-base py-3"
                disabled={!password.trim() || isValidating}
              >
                {isValidating ? 'Validating...' : 'Access Daryle AI'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show the app with a logout option in development/testing
  return (
    <div className="relative">
      {children}
    </div>
  );
};

export default PasswordGate;
