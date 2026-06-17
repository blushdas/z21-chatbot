import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useChatManagement } from '@/hooks/useChatManagement';
import { useAuth } from '@/context/SupabaseAuthContext';

interface AppReadyContextType {
  isAppReady: boolean;
}

const AppReadyContext = createContext<AppReadyContextType>({ isAppReady: false });

export const AppReadyProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { initialized } = useChatManagement();
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    // Reset when user logs out
    if (!user) {
      setIsAppReady(false);
      return;
    }

    // Wait for chat management to initialize, then add small delay for render sync
    if (initialized && user) {
      const timer = setTimeout(() => {
        setIsAppReady(true);
      }, 150); // Small delay to ensure all components have rendered their data

      return () => clearTimeout(timer);
    }
  }, [initialized, user]);

  return (
    <AppReadyContext.Provider value={{ isAppReady }}>
      {children}
    </AppReadyContext.Provider>
  );
};

export const useAppReady = () => {
  return useContext(AppReadyContext);
};
