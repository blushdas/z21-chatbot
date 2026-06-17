import React from 'react';
import { useAuth } from '@/context/SupabaseAuthContext';
import EmailVerificationPrompt from './EmailVerificationPrompt';

interface EmailVerificationWrapperProps {
  children: React.ReactNode;
}

const EmailVerificationWrapper: React.FC<EmailVerificationWrapperProps> = ({ children }) => {
  const { user, loading } = useAuth();

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If user exists but email is not verified, show verification prompt
  // ENFORCE EMAIL VERIFICATION: Block access to app until verified
  if (user && !user.email_confirmed_at) {
    return <EmailVerificationPrompt email={user.email || ''} />;
  }

  // Only allow access if:
  // 1. No user (public routes like /auth)
  // 2. User with verified email
  return <>{children}</>;
};

export default EmailVerificationWrapper;