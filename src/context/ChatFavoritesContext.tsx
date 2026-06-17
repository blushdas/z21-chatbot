import React, { createContext, useContext, ReactNode } from 'react';
import { useChatFavorites, ChatFavoriteRecord } from '@/hooks/useChatFavorites';

interface ChatFavoritesContextType {
  favorites: ChatFavoriteRecord[];
  loading: boolean;
  isChatFavorite: (chatId: string) => boolean;
  toggleChatFavorite: (chatId: string) => Promise<void>;
  reload: () => Promise<void>;
}

const ChatFavoritesContext = createContext<ChatFavoritesContextType | undefined>(undefined);

export const ChatFavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const value = useChatFavorites();
  return <ChatFavoritesContext.Provider value={value}>{children}</ChatFavoritesContext.Provider>;
};

export const useChatFavoritesContext = () => {
  const ctx = useContext(ChatFavoritesContext);
  if (!ctx) throw new Error('useChatFavoritesContext must be used within ChatFavoritesProvider');
  return ctx;
};
