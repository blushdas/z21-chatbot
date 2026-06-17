import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'user' | 'admin' | 'superadmin';

/**
 * Canonical role check backed by the `has_role(user_id, role)` SECURITY DEFINER
 * function. Use this in place of `profile.role === 'x'` so role-system refactors
 * stay in one place.
 */
export function useHasRole(role: AppRole) {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['has-role', user?.id, role],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: role,
      });
      if (error) {
        console.warn('useHasRole rpc failed:', error.message);
        return false;
      }
      return Boolean(data);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    hasRole: query.data === true,
    isLoading: query.isLoading,
    isReady: !!user?.id && !query.isLoading,
  };
}