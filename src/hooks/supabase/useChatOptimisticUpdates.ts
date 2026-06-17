
import { useCallback } from 'react';
import { MessageType, ChatMode } from '@/components/ChatInterface';

export const useChatOptimisticUpdates = () => {
  const showTypingTitle = useCallback((
    chatId: string,
    newTitle: string | null,
    messages: MessageType[],
    mode: ChatMode,
    onStateUpdate?: (updater: (prev: any[]) => any[]) => void
  ) => {
    if (!onStateUpdate || !newTitle) return;

    onStateUpdate(prev => 
      prev.map(chat => 
        chat.id === chatId 
          ? { 
              ...chat, 
              title: newTitle,
              updated_at: new Date().toISOString(),
              messages: messages,
              mode: mode,
              isTypingTitle: true
            }
          : chat
      )
    );
  }, []);

  const showLoadingState = useCallback((
    chatId: string,
    messages: MessageType[],
    mode: ChatMode,
    onStateUpdate?: (updater: (prev: any[]) => any[]) => void
  ) => {
    if (!onStateUpdate) return;

    onStateUpdate(prev => 
      prev.map(chat => 
        chat.id === chatId 
          ? { 
              ...chat, 
              isTypingTitle: true,
              updated_at: new Date().toISOString(),
              messages: messages,
              mode: mode
            }
          : chat
      )
    );
  }, []);

  const finalizeUpdate = useCallback((
    chatId: string,
    title: string | null,
    messages: MessageType[],
    mode: ChatMode,
    timestamp: string,
    onStateUpdate?: (updater: (prev: any[]) => any[]) => void
  ) => {
    if (!onStateUpdate) return;

    onStateUpdate(prev => 
      prev.map(chat => 
        chat.id === chatId 
          ? { 
              ...chat, 
              title: title || chat.title,
              updated_at: timestamp,
              messages: messages,
              mode: mode,
              isTypingTitle: false
            }
          : chat
      )
    );
  }, []);

  const revertOptimisticUpdate = useCallback((
    chatId: string,
    originalTitle: string,
    onStateUpdate?: (updater: (prev: any[]) => any[]) => void
  ) => {
    if (!onStateUpdate) return;

    onStateUpdate(prev => 
      prev.map(chat => 
        chat.id === chatId 
          ? { 
              ...chat, 
              title: originalTitle,
              isTypingTitle: false,
              updated_at: chat.updated_at
            }
          : chat
      )
    );
  }, []);

  const stopTypingIndicator = useCallback((
    chatId: string,
    onStateUpdate?: (updater: (prev: any[]) => any[]) => void
  ) => {
    if (!onStateUpdate) return;

    onStateUpdate(prev => 
      prev.map(chat => 
        chat.id === chatId 
          ? { 
              ...chat, 
              isTypingTitle: false
            }
          : chat
      )
    );
  }, []);

  return {
    showTypingTitle,
    showLoadingState,
    finalizeUpdate,
    revertOptimisticUpdate,
    stopTypingIndicator
  };
};
