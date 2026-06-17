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
    return {
      chat: null,
      messages: [],
      loading: false,
      error: null,
      initialized: true,
      sendUserMessage: async () => {},
      regenerateAIResponse: async () => {},
      editMessage: async () => {},
      deleteMessage: async () => {},
      toggleFavorite: async () => {},
      loadChat: async () => {},
      createNewChat: async () => {},
      saveCurrentChat: async () => {},
      updateChatMetadata: async () => {},
      clearMessages: () => {},
      setMessages: () => {},
      importMessages: async () => {},
      regenerateResponse: async () => {},
      cancelStreaming: () => {},
      regenerateWithOptions: async () => {},
    };
  }
  return context;
};
