import { createContext, useContext, ReactNode } from 'react';
import { useSupabaseChatManagement } from '@/hooks/useSupabaseChatManagement';

type ChatManagementContextType = ReturnType<typeof useSupabaseChatManagement>;

const ChatManagementContext = createContext<ChatManagementContextType | null>(null);

export const ChatManagementProvider = ({ children }: { children: ReactNode }) => {
  const chatManagement = useSupabaseChatManagement();
  
  return (
    <ChatManagementContext.Provider value={chatManagement}>
      {children}
    </ChatManagementContext.Provider>
  );
};

export const useChatManagementContext = () => {
  const context = useContext(ChatManagementContext);
  if (!context) {
    throw new Error('useChatManagementContext must be used within ChatManagementProvider');
  }
  return context;
};
