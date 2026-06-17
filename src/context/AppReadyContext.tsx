import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AppReadyContextType {
  isAppReady: boolean;
}

const AppReadyContext = createContext<AppReadyContextType>({ isAppReady: false });

export const AppReadyProvider = ({ children }: { children: ReactNode }) => {
  // Scaffold mode: app is ready immediately. Auth/chat initialization
  // is gated behind Supabase wiring which is a later task (debt.md).
  const [isAppReady] = useState(true);

  return (
    <AppReadyContext.Provider value={{ isAppReady }}>
      {children}
    </AppReadyContext.Provider>
  );
};

export const useAppReady = () => {
  return useContext(AppReadyContext);
};
