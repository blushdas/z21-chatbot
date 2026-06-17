
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/SupabaseAuthContext';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRole?: 'user' | 'admin' | 'superadmin';
}

// Loading spinner component
const LoadingSpinner: React.FC<{ message?: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center min-h-screen gap-4">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    {message && <p className="text-muted-foreground text-sm">{message}</p>}
  </div>
);

// Access denied component
const AccessDeniedCard: React.FC<{
  requiredRole: string;
  userRole: string | null;
  userEmail: string | null;
}> = ({ requiredRole, userRole, userEmail }) => (
  <div className="min-h-screen bg-background flex items-center justify-center p-4">
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle className="text-xl font-semibold">
          Access Denied
        </CardTitle>
        <CardDescription>
          You don't have permission to access this page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>Required role:</strong> {requiredRole}</p>
          <p><strong>Your role:</strong> {userRole || 'No role assigned'}</p>
          <p><strong>User:</strong> {userEmail || 'Not logged in'}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <a href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go to Main Page
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true,
  requiredRole 
}) => {
  const { user, profile, loading, pending2FA } = useAuth();

  // SECURITY CHECK 1: Block while auth state is loading or 2FA is pending
  // This prevents any content flash during initial authentication check
  if (loading || pending2FA) {
    return <LoadingSpinner />;
  }

  // SECURITY CHECK 2: Redirect to auth if not authenticated (synchronous)
  // Using Navigate component ensures no children render before redirect
  if (requireAuth && !user) {
    return <Navigate to="/auth" replace />;
  }

  // SECURITY CHECK 3: Block while profile is loading when role is required
  // Profile must be loaded before we can check role permissions
  if (requiredRole && !profile) {
    return <LoadingSpinner message="Verifying permissions..." />;
  }

  // SECURITY CHECK 4: Check role hierarchy and block if insufficient
  if (requiredRole && profile) {
    const roleHierarchy: Record<string, number> = { 
      'user': 1, 
      'admin': 2, 
      'superadmin': 3 
    };
    const userLevel = roleHierarchy[profile.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    if (userLevel < requiredLevel) {
      return (
        <AccessDeniedCard
          requiredRole={requiredRole}
          userRole={profile.role}
          userEmail={user?.email || null}
        />
      );
    }
  }

  // SECURITY CHECK 5: All checks passed - safe to render children
  return <>{children}</>;
};

export default ProtectedRoute;
