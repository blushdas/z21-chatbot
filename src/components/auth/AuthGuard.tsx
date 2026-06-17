
import React from 'react';
import { useAuth } from '@/context/SupabaseAuthContext';
import { Navigate } from 'react-router-dom';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requireAuth = true,
  redirectTo = '/auth'
}) => {
  const { user, loading, pending2FA } = useAuth();
  
  // SECURITY: Block rendering while auth is loading OR 2FA is pending
  if (loading || pending2FA) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !user) {
    return <Navigate to={redirectTo} replace />;
  }

  // If user is authenticated and trying to access auth pages, redirect to home
  if (!requireAuth && user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
