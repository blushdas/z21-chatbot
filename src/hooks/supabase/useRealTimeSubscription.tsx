import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SupabaseChat } from './types';
import { useChatSorting } from './useChatSorting';
import { RealtimeChannel } from '@supabase/supabase-js';

// Connection state machine
type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'cleaning';

// Module-level singletons for stable real-time connection
let globalChannelRef: RealtimeChannel | null = null;
let globalUserId: string | null = null;
let reconnectTimerRef: NodeJS.Timeout | null = null;
let retryCountRef = 0;
let connectionState: ConnectionState = 'disconnected';
let circuitBreakerOpenUntil: number | null = null;
let subscriptionAttemptId = 0; // Track subscription attempts to ignore stale events

// Circuit breaker configuration
const MAX_RETRY_ATTEMPTS = 10;
const CIRCUIT_BREAKER_RESET_TIME = 5 * 60 * 1000;

// Debounce utility to batch rapid updates
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface UseRealTimeSubscriptionProps {
  userId: string | null;
  setSavedChats: React.Dispatch<React.SetStateAction<SupabaseChat[]>>;
  loadChatsFromSupabase: () => Promise<void>;
}

export const useRealTimeSubscription = ({
  userId,
  setSavedChats,
  loadChatsFromSupabase
}: UseRealTimeSubscriptionProps) => {
  const { sortChats } = useChatSorting();
  const subscriptionActiveRef = useRef(false);
  const updateQueueRef = useRef<Map<string, SupabaseChat>>(new Map());
  const userIdRef = useRef<string | undefined>(userId || undefined);

  // Debounced update processor (processes batched updates every 100ms)
  const debouncedUpdate = useRef(
    debounce(() => {
      const updates = Array.from(updateQueueRef.current.values());
      if (updates.length === 0) return;

      setSavedChats(prev => {
        const updatedMap = new Map(prev.map(chat => [chat.id, chat]));
        let needsSort = false;
        
        updates.forEach(update => {
          const existing = updatedMap.get(update.id);
          
          // Only flag for sort if meaningful change occurred
          const hasNewMessages = (update.messages?.length || 0) > (existing?.messages?.length || 0);
          const hasTitleChange = update.title !== existing?.title;
          const hasPinChange = update.pinned !== existing?.pinned;
          
          if (hasNewMessages || hasTitleChange || hasPinChange) {
            needsSort = true;
          }
          
          updatedMap.set(update.id, update);
        });
        
        const result = Array.from(updatedMap.values());
        return needsSort ? sortChats(result) : result;  // Only sort when needed
      });

      updateQueueRef.current.clear();
    }, 100)
  ).current;

  // Auto-reconnect with exponential backoff and circuit breaker
  const scheduleReconnect = (currentUserId: string) => {
    if (reconnectTimerRef) {
      clearTimeout(reconnectTimerRef);
    }
    
    // Check if circuit breaker is open
    const now = Date.now();
    if (circuitBreakerOpenUntil && now < circuitBreakerOpenUntil) {
      console.warn(`⚠️ Circuit breaker open until ${new Date(circuitBreakerOpenUntil).toLocaleTimeString()}`);
      return;
    }
    
    // Reset circuit breaker if enough time has passed
    if (circuitBreakerOpenUntil && now >= circuitBreakerOpenUntil) {
      console.log('✅ Circuit breaker reset - resuming reconnection attempts');
      circuitBreakerOpenUntil = null;
      retryCountRef = 0;
    }
    
    // Circuit breaker: Stop retrying after MAX_RETRY_ATTEMPTS
    if (retryCountRef >= MAX_RETRY_ATTEMPTS) {
      circuitBreakerOpenUntil = now + CIRCUIT_BREAKER_RESET_TIME;
      console.error(`❌ Circuit breaker triggered: Failed to connect after ${MAX_RETRY_ATTEMPTS} attempts`);
      console.error(`⏳ Will retry after ${CIRCUIT_BREAKER_RESET_TIME / 1000 / 60} minutes`);
      
      // Notify user about connection issues
      if (typeof window !== 'undefined') {
        console.error('Real-time updates temporarily unavailable. Will retry automatically.');
      }
      return;
    }
    
    const delay = Math.min(30000, 1000 * Math.pow(2, retryCountRef)); // 1s, 2s, 4s... up to 30s
    console.log(`🔄 Scheduling reconnect in ${delay}ms (attempt ${retryCountRef + 1}/${MAX_RETRY_ATTEMPTS})`);
    
    reconnectTimerRef = setTimeout(() => {
      if (userIdRef.current === currentUserId) {
        console.log('🔄 Attempting to reconnect real-time subscription...');
        retryCountRef++;
        startSubscription(currentUserId);
      }
    }, delay);
  };

  // Update userIdRef whenever userId changes
  useEffect(() => {
    userIdRef.current = userId || undefined;
  }, [userId]);

  // Stable subscription creator with auto-reconnect
  const startSubscription = (currentUserId: string) => {
    // Prevent multiple simultaneous connection attempts
    if (connectionState === 'connecting' || connectionState === 'cleaning') {
      console.log('🛑 Connection blocked, state:', connectionState);
      return;
    }

    // Clear any pending reconnect timer FIRST to prevent race conditions
    if (reconnectTimerRef) {
      clearTimeout(reconnectTimerRef);
      reconnectTimerRef = null;
    }

    console.log('🚀 Creating real-time subscription for user:', currentUserId);
    
    // Increment attempt ID to track this specific subscription attempt
    const currentAttemptId = ++subscriptionAttemptId;

    // Clean up existing subscription - set state to 'cleaning' BEFORE unsubscribe
    // This ensures the old channel's CLOSED event is ignored
    if (globalChannelRef) {
      connectionState = 'cleaning';
      try {
        globalChannelRef.unsubscribe();
      } catch (error) {
        console.error('Error during subscription cleanup:', error);
      }
      globalChannelRef = null;
    }
    
    connectionState = 'connecting';
    const channel = supabase.channel(`chats_${currentUserId}`);

    channel
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chats',
          filter: `user_id=eq.${currentUserId}`
        },
        (payload) => {
          console.log('Real-time UPDATE:', payload);
          
          const updatedChat = payload.new as any; // Raw DB format
          
          // 🔧 Convert message timestamps from strings to Date objects
          const convertedMessages = (updatedChat.messages || []).map((msg: any) => ({
            ...msg,
            timestamp: msg.timestamp ? (msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)) : undefined,
            createdAt: msg.createdAt ? (msg.createdAt instanceof Date ? msg.createdAt : new Date(msg.createdAt)) : undefined
          }));
          
          // ⚡ FAST PATH: Title-only updates (most common case)
          setSavedChats(prev => {
            const oldChat = prev.find(c => c.id === updatedChat.id);
            
            // 🛡️ GUARD: Skip stale message updates (don't go backwards in message count)
            if (oldChat && convertedMessages.length < (oldChat.messages?.length || 0)) {
              console.log('🛡️ Skipping stale message update from real-time', {
                oldCount: oldChat.messages?.length,
                newCount: convertedMessages.length
              });
              return prev;
            }
            
            // Detect meaningful changes that should trigger sorting
            const hasNewMessages = convertedMessages.length > (oldChat?.messages?.length || 0);
            const hasPinChange = updatedChat.pinned !== oldChat?.pinned;
            const hasTitleChange = updatedChat.title && updatedChat.title !== oldChat?.title;
            const hasTypingChange = updatedChat.is_typing_title !== undefined && updatedChat.is_typing_title !== oldChat?.isTypingTitle;
            
            const hasRealChange = hasTitleChange || hasTypingChange || hasNewMessages || hasPinChange;
            
            if (hasRealChange) {
              const updated = prev.map(chat => {
                if (chat.id !== updatedChat.id) return chat;
                
                // 🛡️ GUARD: Don't overwrite loading state with "New Chat" from DB
                // Keep loading indicator until real title arrives
                const shouldKeepCurrentTitle = chat.isTypingTitle && updatedChat.title === 'New Chat';
                
                return { 
                  ...chat, 
                  title: shouldKeepCurrentTitle ? chat.title : (updatedChat.title || chat.title),
                  isTypingTitle: shouldKeepCurrentTitle ? true : (updatedChat.is_typing_title !== undefined ? updatedChat.is_typing_title : chat.isTypingTitle),
                  updated_at: updatedChat.updated_at || chat.updated_at,
                  messages: convertedMessages,
                  pinned: updatedChat.pinned !== undefined ? updatedChat.pinned : chat.pinned,
                  mode_change_events: updatedChat.mode_change_events || chat.mode_change_events
                };
              });
              
              // ✅ Only sort if new messages or pin status changed (not for title-only changes)
              if (hasNewMessages || hasPinChange) {
                return sortChats(updated);
              }
              return updated;
            }
            return prev;
          });
          
          // Batch other updates via debounced queue
          const existingUpdate = updateQueueRef.current.get(updatedChat.id);
          updateQueueRef.current.set(updatedChat.id, {
            ...existingUpdate,
            id: updatedChat.id,
            title: updatedChat.title,
            messages: updatedChat.messages,
            created_at: updatedChat.created_at,
            updated_at: updatedChat.updated_at,
            mode: updatedChat.mode,
            user_id: updatedChat.user_id,
            pinned: updatedChat.pinned,
            folder_id: updatedChat.folder_id,
            isTypingTitle: updatedChat.is_typing_title !== undefined ? updatedChat.is_typing_title : existingUpdate?.isTypingTitle,
            mode_change_events: updatedChat.mode_change_events || existingUpdate?.mode_change_events,
          } as SupabaseChat);
          debouncedUpdate();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chats',
          filter: `user_id=eq.${currentUserId}`
        },
        (payload) => {
          console.log('Real-time INSERT:', payload);
          
          const rawChat = payload.new as any; // Raw DB format
          
          // 🔧 Convert message timestamps from strings to Date objects
          const convertedMessages = (rawChat.messages || []).map((msg: any) => ({
            ...msg,
            timestamp: msg.timestamp ? (msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)) : undefined,
            createdAt: msg.createdAt ? (msg.createdAt instanceof Date ? msg.createdAt : new Date(msg.createdAt)) : undefined
          }));
          
          const newChat: SupabaseChat = {
            id: rawChat.id,
            title: rawChat.title,
            messages: convertedMessages,
            created_at: rawChat.created_at,
            updated_at: rawChat.updated_at,
            mode: rawChat.mode || 'coach',
            user_id: rawChat.user_id,
            pinned: rawChat.pinned || false,
            folder_id: rawChat.folder_id,
            isTypingTitle: rawChat.is_typing_title || false
          };
          
          setSavedChats(prev => {
            const exists = prev.some(chat => chat.id === newChat.id);
            if (exists) {
              console.log('Chat already exists, skipping INSERT');
              return prev;
            }
            const updated = [newChat, ...prev];
            return sortChats(updated);
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chats',
          filter: `user_id=eq.${currentUserId}`
        },
        (payload) => {
          console.log('Real-time DELETE:', payload);
          
          const deletedId = payload.old.id;
          setSavedChats(prev => prev.filter(chat => chat.id !== deletedId));
        }
      )
      .subscribe((status) => {
        // Ignore events from stale subscription attempts
        if (currentAttemptId !== subscriptionAttemptId) {
          console.log('🔕 Ignoring stale subscription event from attempt', currentAttemptId, 'current:', subscriptionAttemptId);
          return;
        }
        
        console.log('Subscription status:', status, {
          userId: currentUserId,
          attemptId: currentAttemptId,
          retryCount: retryCountRef,
          connectionState,
          timestamp: new Date().toISOString()
        });
        
        if (status === 'SUBSCRIBED') {
          retryCountRef = 0;
          circuitBreakerOpenUntil = null;
          connectionState = 'connected';
          globalUserId = currentUserId;
          subscriptionActiveRef.current = true;
          console.log('✅ Real-time subscription active (attempt', currentAttemptId, ')');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          // Ignore status events during cleaning or when already disconnected
          if (connectionState === 'cleaning' || connectionState === 'disconnected') {
            console.log('🔕 Ignoring status, state:', connectionState);
            return;
          }
          
          console.warn('⚠️ Subscription failed:', {
            status,
            userId: currentUserId,
            attemptId: currentAttemptId,
            retryCount: retryCountRef,
            timestamp: new Date().toISOString()
          });
          
          connectionState = 'disconnected';
          subscriptionActiveRef.current = false;
          
          if (userIdRef.current === currentUserId) {
            scheduleReconnect(currentUserId);
          }
        }
      });

    globalChannelRef = channel;
    
    // Listen for auth state changes to handle token refresh gracefully
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED' && session?.user?.id === currentUserId) {
        console.log('🔄 Token refreshed, subscription should continue...');
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  };

  useEffect(() => {
    if (!userId) {
      subscriptionActiveRef.current = false;
      // Clean up if user logs out
      if (globalChannelRef) {
        connectionState = 'cleaning';
        try {
          globalChannelRef.unsubscribe();
          supabase.removeChannel(globalChannelRef);
        } catch (error) {
          console.error('Error during logout cleanup:', error);
        }
        globalChannelRef = null;
        connectionState = 'disconnected';
      }
      if (reconnectTimerRef) {
        clearTimeout(reconnectTimerRef);
        reconnectTimerRef = null;
      }
      globalUserId = null;
      retryCountRef = 0;
      return;
    }

    // Only start a new subscription if userId changed
    if (userId !== globalUserId) {
      retryCountRef = 0; // Reset retry count for new user
      circuitBreakerOpenUntil = null; // Reset circuit breaker for new user
      const cleanup = startSubscription(userId);
      
      return () => {
        cleanup?.();
        if (reconnectTimerRef) {
          clearTimeout(reconnectTimerRef);
          reconnectTimerRef = null;
        }
        if (globalChannelRef) {
          connectionState = 'cleaning';
          try {
            globalChannelRef.unsubscribe();
            supabase.removeChannel(globalChannelRef);
          } catch (error) {
            console.error('Error during effect cleanup:', error);
          }
          globalChannelRef = null;
          connectionState = 'disconnected';
        }
      };
    }
  }, [userId]); // Only depend on userId

  return {
    subscriptionActive: subscriptionActiveRef.current,
    subscriptionActiveRef
  };
};
