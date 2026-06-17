import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import logger from '@/utils/logger';

interface TwoFactorEnforcementGuardProps {
  children: React.ReactNode;
}

const TwoFactorEnforcementGuard: React.FC<TwoFactorEnforcementGuardProps> = ({ children }) => {
  const { user, loading: authLoading, pending2FA } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const checkTwoFactorRequirement = async () => {
      // SECURITY: Block rendering while 2FA challenge is pending
      if (pending2FA) {
        logger.debug('2FA check pending, blocking access');
        setChecking(true);
        setAllowed(false);
        return;
      }
      
      // Skip check if still loading auth or no user
      if (authLoading || !user) {
        setChecking(false);
        setAllowed(true);
        return;
      }

      try {
        // Check if 2FA is globally required
        const { data: settingData, error: settingError } = await supabase
          .rpc('get_platform_setting', { setting_key: 'two_factor_required' });

        if (settingError) {
          logger.error('Error fetching 2FA requirement setting:', settingError);
          setChecking(false);
          setAllowed(true);
          return;
        }

        // Parse the setting value safely
        const settingValue = typeof settingData === 'object' && settingData !== null 
          ? settingData as { enabled?: boolean }
          : null;

        const twoFactorRequired = settingValue?.enabled === true;

        if (!twoFactorRequired) {
          // 2FA not globally required, allow access
          setChecking(false);
          setAllowed(true);
          return;
        }

        // Check if user has 2FA enabled
        const { data: twoFactorSettings, error: tfError } = await supabase
          .from('two_factor_settings')
          .select('enabled')
          .eq('user_id', user.id)
          .eq('enabled', true)
          .maybeSingle();

        if (tfError) {
          logger.error('Error checking user 2FA status:', tfError);
          setChecking(false);
          setAllowed(true);
          return;
        }

        if (twoFactorSettings?.enabled) {
          // User has 2FA enabled, allow access
          setChecking(false);
          setAllowed(true);
          return;
        }

        // User doesn't have 2FA, redirect to setup
        logger.info('2FA required but not enabled for user, redirecting to setup');
        setChecking(false);
        setAllowed(false);
        navigate('/auth/setup-2fa', { 
          state: { 
            enforced: true,
            returnTo: location.pathname 
          },
          replace: true 
        });
      } catch (error) {
        logger.error('Error in 2FA enforcement check:', error);
        setChecking(false);
        setAllowed(true);
      }
    };

    checkTwoFactorRequirement();
  }, [user, authLoading, pending2FA, navigate, location.pathname]);

  // SECURITY: Block rendering while checking or while 2FA is pending
  if (checking || authLoading || pending2FA) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not allowed, don't render children (redirect is happening)
  if (!allowed) {
    return null;
  }

  return <>{children}</>;
};

export default TwoFactorEnforcementGuard;
