import React, { createContext, useContext, ReactNode } from 'react';
import { useSupabaseHealth, HealthState } from '@/hooks/useSupabaseHealth';

interface SupabaseHealthContextType extends HealthState {
  updateSyncProgress: (progress: number) => void;
  clearReconnecting: () => void;
  forceHealthCheck: () => Promise<void>;
}

const SupabaseHealthContext = createContext<SupabaseHealthContextType | undefined>(undefined);

interface SupabaseHealthProviderProps {
  children: ReactNode;
}

export const SupabaseHealthProvider: React.FC<SupabaseHealthProviderProps> = ({ children }) => {
  const healthState = useSupabaseHealth();

  return (
    <SupabaseHealthContext.Provider value={healthState}>
      {children}
    </SupabaseHealthContext.Provider>
  );
};

export const useSupabaseHealthContext = (): SupabaseHealthContextType => {
  const context = useContext(SupabaseHealthContext);
  
  if (context === undefined) {
    return { status: 'loading' as const, isHealthy: true, error: null, lastChecked: null, refetch: async ()=>{} };
  }
  
  return context;
};

// Optional hook that doesn't throw if used outside provider (for components that may render before provider)
export const useSupabaseHealthOptional = (): SupabaseHealthContextType | null => {
  const context = useContext(SupabaseHealthContext);
  return context ?? null;
};

export default SupabaseHealthContext;
