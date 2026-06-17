import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/SupabaseAuthContext';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

const OnboardingGuard: React.FC<OnboardingGuardProps> = ({ children }) => {
  const { user, profile, loading, pending2FA } = useAuth();

  // SECURITY: Block rendering while 2FA check is pending or auth is loading
  if (loading || pending2FA) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not logged in - redirect to auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Onboarding temporarily disabled - skip check
  // if (profile && profile.onboarding_completed === false) {
  //   return <Navigate to="/onboarding" replace />;
  // }

  // User has completed onboarding - render children
  return <>{children}</>;
};

export default OnboardingGuard;
