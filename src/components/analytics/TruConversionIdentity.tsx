import React, { useEffect, useContext } from 'react';
import { AuthContext } from '@/context/SupabaseAuthContext';

/**
 * TruConversion identity tracking component.
 * Uses AuthContext directly to avoid errors when context is not available.
 */
const TruConversionIdentity: React.FC = () => {
  const authContext = useContext(AuthContext);
  
  // If context is not available, safely return null
  const user = authContext?.user;
  const profile = authContext?.profile;

  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      // Track user identity with their ID (or email as fallback)
      const identity = user.id || user.email || 'anonymous';
      const _tip = (window as any)._tip;
      if (_tip) {
        _tip.push(['_trackIdentity', identity]);
      }
    }
  }, [user, profile]);

  return null;
};

export default TruConversionIdentity;
