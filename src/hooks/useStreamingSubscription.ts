import { useEffect, useRef } from 'react';
import { MessageType } from '@/components/ChatInterface';
import { isStreaming, subscribeToStreaming, getStreamingState, subscribeToAllCompletions } from '@/utils/activeStreamingTracker';

interface UseStreamingSubscriptionProps {
  chatId: string | null;
  setCurrentMessages: (messages: MessageType[]) => void;
  setStreamingMessageId: (id: string | null) => void;
  setIsBotTyping: (isTyping: boolean) => void;
}

/**
 * Hook that subscribes to streaming updates from the global tracker.
 * This ensures the UI stays in sync with background streaming even after navigation.
 */
export const useStreamingSubscription = ({
  chatId,
  setCurrentMessages,
  setStreamingMessageId,
  setIsBotTyping
}: UseStreamingSubscriptionProps) => {
  const lastUpdateRef = useRef<number>(0);
  
  useEffect(() => {
    if (!chatId) return;
    
    // Check if this chat is actively streaming
    if (!isStreaming(chatId)) {
      return;
    }
    
    console.log('🔌 useStreamingSubscription: Setting up subscription for', chatId);
    
    // Get initial state immediately
    const initialState = getStreamingState(chatId);
    if (initialState) {
      console.log('🔌 useStreamingSubscription: Restoring initial state', {
        chatId,
        messageCount: initialState.messages.length,
        contentLength: initialState.accumulatedContent.length
      });
      setCurrentMessages(initialState.messages);
      setStreamingMessageId(initialState.streamingMessageId);
      
      // ✅ FIX: Only set typing true if bot message hasn't started streaming content yet
      // This prevents overriding the fade-out that happens when first chunk arrives
      const botMessage = initialState.messages.find(m => m.id === initialState.streamingMessageId);
      const hasStreamingContent = botMessage?.content && botMessage.content.length > 0;
      
      if (!hasStreamingContent) {
        setIsBotTyping(true);
      } else {
        console.log('🔌 useStreamingSubscription: Bot already has content, skipping setIsBotTyping(true)');
      }
    }
    
    // Subscribe to live updates
    const unsubscribe = subscribeToStreaming(chatId, (state) => {
      // Throttle updates to avoid excessive re-renders (max every 50ms)
      const now = Date.now();
      if (now - lastUpdateRef.current < 50) {
        return;
      }
      lastUpdateRef.current = now;
      
      // ✅ FIX: Only update messages - do NOT touch streamingMessageId
      // Let useChatHandlers.onComplete be the single source of truth for clearing streaming state
      setCurrentMessages(state.messages);
      // ❌ REMOVED: setStreamingMessageId(state.streamingMessageId);
      // This was racing with useChatHandlers.onComplete setting it to null
    });
    
    return () => {
      console.log('🔌 useStreamingSubscription: Cleaning up subscription for', chatId);
      unsubscribe();
    };
  }, [chatId, setCurrentMessages, setStreamingMessageId, setIsBotTyping]);
  
  // ✅ NEW: Subscribe to streaming completion events to ensure state is cleared
  useEffect(() => {
    if (!chatId) return;
    
    const unsubscribe = subscribeToAllCompletions((completedChatId) => {
      if (completedChatId === chatId) {
        console.log('🔌 useStreamingSubscription: Completion event received, clearing ALL streaming state');
        setStreamingMessageId(null);
        setIsBotTyping(false);  // ✅ CRITICAL: Safety net - ensure typing indicator clears
      }
    });
    
    return () => unsubscribe();
  }, [chatId, setStreamingMessageId, setIsBotTyping]);
};
