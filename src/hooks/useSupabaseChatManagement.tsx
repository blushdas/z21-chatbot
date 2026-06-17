import React, { useContext } from 'react';
import { AuthContext } from '@/context/SupabaseAuthContext';
import { SupabaseChat } from './supabase/types';
import { useChatState } from './supabase/useChatState';
import { useChatInitialization } from './supabase/useChatInitialization';
import { useRealTimeSubscription } from './supabase/useRealTimeSubscription';
import { useChatActions } from './supabase/useChatActions';
import { useChatLoader } from './supabase/useChatLoader';

export type { SupabaseChat };

export const useSupabaseChatManagement = () => {
  // Use context directly to avoid throwing during HMR
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  
  const {
    savedChats,
    setSavedChats,
    currentChatId,
    setCurrentChatId,
    initialized,
    setInitialized,
    renderKey
  } = useChatState();

  const { loadChatsFromSupabase } = useChatInitialization({
    userId: user?.id || null,
    setSavedChats,
    setCurrentChatId,
    setInitialized
  });
 
  const { subscriptionActive, subscriptionActiveRef } = useRealTimeSubscription({
    userId: user?.id || null,
    setSavedChats,
    loadChatsFromSupabase
  });
 
  const { loadChats } = useChatLoader(user?.id || undefined);
  const { getTotalCount } = useChatLoader(user?.id || undefined);


  const {
    createNewChat,
    findOrCreateEmptyChat,
    saveChat,
    getChat,
    resumeChat,
    updateChatTitle,
    deleteChat,
    togglePinStatus,
    bulkDeleteAllChats,
    
    setTypingTitle
  } = useChatActions({
    userId: user?.id || null,
    savedChats,
    setSavedChats,
    setCurrentChatId,
    currentChatId,
    loadChatsFromSupabase,
    subscriptionActiveRef
  });

  // Compute currentChat from savedChats and currentChatId
  const currentChat = React.useMemo(() => {
    if (!currentChatId || !user?.id) return null;
    const found = savedChats.find(chat => chat.id === currentChatId);
    if (!found && currentChatId) {
      console.warn('⚠️ currentChat is null but currentChatId exists:', { 
        currentChatId, 
        savedChatsCount: savedChats.length,
        savedChatIds: savedChats.map(c => c.id).slice(0, 3)
      });
    }
    return found || null;
  }, [savedChats, currentChatId, user?.id]);

  return {
    savedChats: user?.id ? savedChats : [],
    setSavedChats,
    currentChatId,
    currentChat,
    setCurrentChatId,
    createNewChat,
    findOrCreateEmptyChat,
    saveChat,
    getChat,
    resumeChat,
    updateChatTitle,
    deleteChat,
    togglePinStatus,
    bulkDeleteAllChats,
    setTypingTitle,
    initialized,
    loadChats: loadChatsFromSupabase,
    isAuthenticated: !!user?.id,
    renderKey,
    loadChatsPage: loadChats,
    getTotalCount
  };
};
