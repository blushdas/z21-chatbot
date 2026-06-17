// Global tracking of which chats are currently streaming
// This persists across component remounts when navigating between chats
// ✅ EXPANDED: Now stores full streaming state for restoration + subscription pattern

import { MessageType, ChatMode } from '@/components/ChatInterface';

interface StreamingChatState {
  chatId: string;
  messages: MessageType[];
  accumulatedContent: string;
  streamingMessageId: string;
  mode: ChatMode;
  startTime: number;
  chatTitle?: string;
}

type StreamingSubscriber = (state: StreamingChatState) => void;
type StreamingCompletionCallback = (chatId: string, finalState: StreamingChatState) => void;

const activeStreamingChats = new Map<string, StreamingChatState>();
const subscribers = new Map<string, Set<StreamingSubscriber>>();
const completionSubscribers = new Set<StreamingCompletionCallback>();

export const markStreaming = (chatId: string, initialState?: Partial<StreamingChatState>) => {
  const state: StreamingChatState = {
    chatId,
    messages: initialState?.messages || [],
    accumulatedContent: initialState?.accumulatedContent || '',
    streamingMessageId: initialState?.streamingMessageId || '',
    mode: initialState?.mode || 'coach',
    startTime: Date.now()
  };
  activeStreamingChats.set(chatId, state);
  console.log('🔴 Marked chat as streaming:', chatId, { messageCount: state.messages.length });
  
  // Notify subscribers of initial state
  notifySubscribers(chatId, state);
};

// Subscribe to streaming updates for a specific chat
export const subscribeToStreaming = (
  chatId: string,
  callback: StreamingSubscriber
): (() => void) => {
  if (!subscribers.has(chatId)) {
    subscribers.set(chatId, new Set());
  }
  subscribers.get(chatId)!.add(callback);
  console.log('📡 Subscribed to streaming updates for:', chatId);
  
  // Immediately call with current state if streaming
  const currentState = activeStreamingChats.get(chatId);
  if (currentState) {
    callback(currentState);
  }
  
  // Return unsubscribe function
  return () => {
    subscribers.get(chatId)?.delete(callback);
    if (subscribers.get(chatId)?.size === 0) {
      subscribers.delete(chatId);
    }
    console.log('📡 Unsubscribed from streaming updates for:', chatId);
  };
};

// Notify all subscribers of state change
const notifySubscribers = (chatId: string, state: StreamingChatState) => {
  const subs = subscribers.get(chatId);
  if (subs && subs.size > 0) {
    subs.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Error in streaming subscriber:', error);
      }
    });
  }
};

export const updateStreamingContent = (
  chatId: string, 
  accumulatedContent: string, 
  messages: MessageType[],
  streamingMessageId?: string
) => {
  const state = activeStreamingChats.get(chatId);
  if (state) {
    state.accumulatedContent = accumulatedContent;
    state.messages = messages;
    if (streamingMessageId) {
      state.streamingMessageId = streamingMessageId;
    }
    
    // ✅ CRITICAL: Notify subscribers of content update
    notifySubscribers(chatId, state);
    
    // Log periodically (every ~500 chars) to avoid spam
    if (accumulatedContent.length % 500 < 50) {
      console.log('📝 Updated streaming content:', chatId, { 
        contentLength: accumulatedContent.length,
        messageCount: messages.length,
        subscriberCount: subscribers.get(chatId)?.size || 0
      });
    }
  } else {
    console.warn('⚠️ Tried to update streaming content for non-streaming chat:', chatId);
  }
};

// Subscribe to ALL chat completions (global listener for toast notifications)
export const subscribeToAllCompletions = (
  callback: StreamingCompletionCallback
): (() => void) => {
  completionSubscribers.add(callback);
  console.log('📡 Subscribed to all streaming completions');
  return () => {
    completionSubscribers.delete(callback);
    console.log('📡 Unsubscribed from all streaming completions');
  };
};

export const clearStreaming = (chatId: string, chatTitle?: string) => {
  const state = activeStreamingChats.get(chatId);
  if (state) {
    const duration = Date.now() - state.startTime;
    console.log('🟢 Cleared streaming for chat:', chatId, { 
      durationMs: duration,
      finalContentLength: state.accumulatedContent.length,
      finalMessageCount: state.messages.length
    });
    
    // ✅ CRITICAL: Notify completion subscribers BEFORE removing state
    const finalState = { ...state, chatTitle: chatTitle || state.chatTitle };
    completionSubscribers.forEach(callback => {
      try {
        callback(chatId, finalState);
      } catch (error) {
        console.error('Error in completion subscriber:', error);
      }
    });
  }
  activeStreamingChats.delete(chatId);
  // Clean up subscribers for this chat
  subscribers.delete(chatId);
};

export const isStreaming = (chatId: string): boolean => {
  return activeStreamingChats.has(chatId);
};

export const getStreamingState = (chatId: string): StreamingChatState | undefined => {
  return activeStreamingChats.get(chatId);
};

export const getActiveStreamingChats = (): string[] => {
  return Array.from(activeStreamingChats.keys());
};

// Debug helper
export const debugStreamingState = () => {
  console.log('🔍 Active streaming chats:', {
    count: activeStreamingChats.size,
    chats: Array.from(activeStreamingChats.entries()).map(([id, state]) => ({
      id,
      contentLength: state.accumulatedContent.length,
      messageCount: state.messages.length,
      duration: Date.now() - state.startTime,
      subscribers: subscribers.get(id)?.size || 0
    }))
  });
};
