import { useState, useCallback } from 'react';
import { SupabaseChat } from './types';

export const useChatState = () => {
  const [savedChats, setSavedChats] = useState<SupabaseChat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [renderKey, setRenderKey] = useState(0);

  // Optimistic update for folder changes
  const updateChatFolderOptimistic = useCallback((chatId: string, folderId: string | null) => {
    setSavedChats(prevChats => 
      prevChats.map(chat => 
        chat.id === chatId 
          ? { ...chat, folder_id: folderId, updated_at: new Date().toISOString() }
          : chat
      )
    );
  }, []);

  // Revert optimistic update on failure
  const revertChatFolderUpdate = useCallback((chatId: string, originalFolderId: string | null) => {
    setSavedChats(prevChats => 
      prevChats.map(chat => 
        chat.id === chatId 
          ? { ...chat, folder_id: originalFolderId }
          : chat
      )
    );
  }, []);

  return {
    savedChats,
    setSavedChats,
    currentChatId,
    setCurrentChatId,
    initialized,
    setInitialized,
    renderKey,
    updateChatFolderOptimistic,
    revertChatFolderUpdate
  };
};