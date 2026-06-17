import { useCallback } from 'react';
import { MessageType, ChatMode } from '@/components/ChatInterface';
import { SupabaseChat } from './types';
import { useChatCreator } from './useChatCreator';
import { useChatSaver } from './useChatSaver';
import { useChatOperations } from './useChatOperations';
import { useChatSorting } from './useChatSorting';
import { useChatTitleManager } from './useChatTitleManager';
import { markGeneratedExternal } from '@/hooks/useTitleGenerationLock';

interface UseChatActionsProps {
  userId: string | null;
  savedChats: SupabaseChat[];
  setSavedChats: React.Dispatch<React.SetStateAction<SupabaseChat[]>>;
  setCurrentChatId: React.Dispatch<React.SetStateAction<string | null>>;
  currentChatId: string | null;
  loadChatsFromSupabase: () => Promise<void>;
  subscriptionActiveRef: React.MutableRefObject<boolean>;
}

export const useChatActions = ({
  userId,
  savedChats,
  setSavedChats,
  setCurrentChatId,
  currentChatId,
  loadChatsFromSupabase,
  subscriptionActiveRef
}: UseChatActionsProps) => {
  const { createNewChat: createChat, findOrCreateEmptyChat: findOrCreate } = useChatCreator(userId);
  const { saveChat: saveChatData, setTypingTitle } = useChatSaver(userId);
  const { getChat, updateChatTitle, deleteChat, togglePinStatus } = useChatOperations(userId);
  const { sortChats } = useChatSorting();
  const { generateChatTitle } = useChatTitleManager(userId);

  // Create new chat with immediate sidebar update
  const createNewChat = useCallback(async (
    mode: ChatMode = 'coach',
    options?: { folderId?: string | null }
  ): Promise<string> => {
    const chatId = await createChat(mode, options);
    
    if (userId && !chatId.startsWith('guest-') && !chatId.startsWith('temp-')) {
      // Add to local state immediately (optimistic update)
      const newChat: SupabaseChat = {
        id: chatId,
        title: "New Chat",
        messages: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        mode,
        user_id: userId,
        pinned: false,
        isTypingTitle: false,
        folder_id: options?.folderId ?? null,
      };
      
      setSavedChats(prev => {
        // Check if chat already exists to prevent duplicates
        const exists = prev.some(chat => chat.id === chatId);
        if (exists) {
          console.log('🔄 New chat already exists in state, skipping add');
          return prev;
        }
        
        const updated = [newChat, ...prev];
        console.log('✅ NEW CHAT added to sidebar immediately:', {
          chatId,
          title: newChat.title,
          totalChats: updated.length,
          realTimeReady: subscriptionActiveRef.current
        });
        return updated;
      });
      
      setCurrentChatId(chatId);
      console.log(`🆕 Set currentChatId to NEW CHAT: ${chatId}`);
      
      // Ensure real-time subscription is aware of new chat
      if (subscriptionActiveRef.current) {
        console.log('🔄 Real-time subscription is active - new chat will be monitored');
      } else {
        console.warn('⚠️ Real-time subscription not active - attempting to reconnect');
        // Force reload to ensure consistency
        setTimeout(() => loadChatsFromSupabase(), 1000);
      }
    } else if (chatId.startsWith('guest-') || chatId.startsWith('temp-')) {
      setCurrentChatId(chatId);
    }
    
    return chatId;
  }, [createChat, userId, loadChatsFromSupabase, subscriptionActiveRef, setSavedChats, setCurrentChatId]);

  // Find or create empty chat (reuse existing empty chats on refresh)
  const findOrCreateEmptyChat = useCallback(async (mode: ChatMode = 'coach', forceNew: boolean = false): Promise<string> => {
    // Pass savedChats to check local state first (prevents duplicates)
    const chatId = await findOrCreate(mode, forceNew, savedChats);
    
    if (userId && !chatId.startsWith('guest-') && !chatId.startsWith('temp-')) {
      // If we created a new chat (not found existing), add it to state
      const existingChat = savedChats.find(chat => chat.id === chatId);
      
      if (!existingChat) {
        const newChat: SupabaseChat = {
          id: chatId,
          title: "New Chat",
          messages: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          mode,
          user_id: userId,
          pinned: false,
          isTypingTitle: false
        };
        
        setSavedChats(prev => {
          const exists = prev.some(chat => chat.id === chatId);
          if (exists) return prev;
          
          const updated = [newChat, ...prev];
          console.log('✅ NEW CHAT added to sidebar (via findOrCreate):', chatId);
          return updated;
        });
      } else {
        console.log('♻️ Reusing existing empty chat in state:', chatId);
      }
      
      setCurrentChatId(chatId);
    } else if (chatId.startsWith('guest-') || chatId.startsWith('temp-')) {
      setCurrentChatId(chatId);
    }
    
    return chatId;
  }, [findOrCreate, userId, savedChats, setSavedChats, setCurrentChatId]);

  // Enhanced save chat with optimistic updates
  const saveChat = useCallback(async (
    chatId: string, 
    messages: MessageType[], 
    mode: ChatMode,
    modeChangeEvents?: Array<{id: string, type: 'mode' | 'model' | 'power' | 'blueprint', value: string, timestamp: string}>
  ) => {
    const currentChat = savedChats.find(chat => chat.id === chatId);
    
    // ✅ FIX: Only update updated_at when there are actual new messages, NOT for mode changes
    const hasNewMessages = messages.length > (currentChat?.messages?.length || 0);
    
    console.log('💾 saveChat called:', {
      chatId,
      messagesLength: messages.length,
      mode,
      modeChangeEventsCount: modeChangeEvents?.length || 0,
      isNewChat: !currentChat,
      hasNewMessages,
      hasRealTimeSubscription: subscriptionActiveRef.current
    });
    
    // ✅ CRITICAL: Optimistically update savedChats with messages IMMEDIATELY
    // This ensures messages persist even if user navigates before real-time sync
    setSavedChats(prev => {
      const updated = prev.map(chat => {
        if (chat.id !== chatId) return chat;
        
        return { 
          ...chat, 
          messages, 
          mode,
          // ✅ FIX: Only update updated_at for new messages, not mode/model changes
          updated_at: hasNewMessages ? new Date().toISOString() : chat.updated_at,
          mode_change_events: modeChangeEvents || chat.mode_change_events
        };
      });
      // Only re-sort if there are new messages (hierarchy change)
      return hasNewMessages ? sortChats(updated) : updated;
    });
    
    // Then save to database (real-time will also fire, but we're already in sync)
    await saveChatData(chatId, messages, mode, currentChat, (updater) => {
      setSavedChats(prev => {
        const updated = sortChats(updater(prev));
        console.log('💾 Local state updated with new chat support');
        return updated;
      });
    }, undefined, modeChangeEvents);
  }, [saveChatData, savedChats, sortChats, subscriptionActiveRef, setSavedChats]);

  const resumeChat = useCallback(async (chatId: string, forceRefresh?: boolean) => {
    const startTime = performance.now();
    
    if (!userId) {
      console.log('Guest user cannot resume saved chats');
      return;
    }
    
    if (chatId.startsWith('guest-')) {
      console.log('Cannot resume guest chat');
      return;
    }
    
    // ✅ FIX: ALWAYS set currentChatId first, even if chat is already loaded
    console.log(`🔄 Setting currentChatId to: ${chatId}${forceRefresh ? ' (force refresh)' : ''}`);
    setCurrentChatId(chatId);
    
    // Check if chat is already loaded in savedChats
    const existingChat = savedChats.find(chat => chat.id === chatId);
    
    // ✅ FIX: Only force refresh when explicitly requested
    // 0 messages is VALID for genuinely new chats - don't trigger infinite refresh loop
    const isGenuinelyNewChat = existingChat && existingChat.messages.length === 0 && 
      existingChat.created_at && existingChat.updated_at &&
      Math.abs(new Date(existingChat.updated_at).getTime() - new Date(existingChat.created_at).getTime()) < 5000;
    
    if (existingChat && forceRefresh && !isGenuinelyNewChat) {
      console.log(`🔄 Force refreshing chat ${chatId} from database`);
      
      try {
        const freshChat = await getChat(chatId, []);
        const loadTimeMs = performance.now() - startTime;
        
        if (freshChat) {
          // ✅ FIX: Convert message timestamps to Date objects for proper display
          const messagesWithDates = (freshChat.messages || []).map((msg: any, index: number) => ({
            ...msg,
            timestamp: msg.timestamp instanceof Date 
              ? msg.timestamp 
              : (msg.timestamp ? new Date(msg.timestamp) : new Date(freshChat.created_at || Date.now())),
            chatId: chatId,
            messageIndex: index
          }));
          
          setSavedChats(prev => prev.map(chat => 
            chat.id === chatId 
              ? { 
                  ...chat, 
                  messages: messagesWithDates, 
                  title: freshChat.title || chat.title,
                  mode: freshChat.mode || chat.mode,
                  mode_change_events: freshChat.mode_change_events || chat.mode_change_events
                } 
              : chat
          ));
          console.log(`✅ Refreshed chat ${chatId} with ${messagesWithDates.length} messages, mode_change_events: ${freshChat.mode_change_events?.length || 0} (${loadTimeMs.toFixed(0)}ms)`);
        } else {
          console.log(`ℹ️ Chat ${chatId} returned null from database`);
        }
      } catch (error) {
        console.error(`❌ Error force-refreshing chat ${chatId}:`, error);
      }
      return;
    }
    
    if (!existingChat) {
      console.log(`📥 Chat ${chatId} not in loaded chats, fetching from database...`);
      
      try {
        // Fetch the specific chat from database
        const chatData = await getChat(chatId, []);
        const loadTimeMs = performance.now() - startTime;
        
        if (chatData) {
          // ✅ FIX: Convert message timestamps to Date objects
          const messagesWithDates = (chatData.messages || []).map((msg: any, index: number) => ({
            ...msg,
            timestamp: msg.timestamp instanceof Date 
              ? msg.timestamp 
              : (msg.timestamp ? new Date(msg.timestamp) : new Date(chatData.created_at || Date.now())),
            chatId: chatId,
            messageIndex: index
          }));
          
          const chatWithDates = { ...chatData, messages: messagesWithDates };
          
          // Add the fetched chat to savedChats
          setSavedChats(prev => {
            // Check if it was added while we were fetching
            if (prev.some(chat => chat.id === chatId)) {
              return prev;
            }
            return [chatWithDates, ...prev];
          });
          console.log(`✅ Chat ${chatId} fetched and added to state (${loadTimeMs.toFixed(0)}ms)`);
        } else {
          // Chat not found in database - log failure
          const { logChatLoadFailure } = await import('@/utils/chatLoadingLogger');
          await logChatLoadFailure(
            userId,
            chatId,
            'CHAT_NOT_FOUND',
            'Chat not found in database',
            {
              wasInLocalState: false,
              savedChatsCount: savedChats.length,
              loadTimeMs,
              attemptedFetch: true
            }
          );
          console.error(`❌ Chat ${chatId} not found in database`);
          return;
        }
      } catch (error) {
        const loadTimeMs = performance.now() - startTime;
        const { logChatLoadFailure } = await import('@/utils/chatLoadingLogger');
        await logChatLoadFailure(
          userId,
          chatId,
          'DATABASE_ERROR',
          error instanceof Error ? error.message : 'Unknown database error',
          {
            wasInLocalState: false,
            savedChatsCount: savedChats.length,
            loadTimeMs,
            errorStack: error instanceof Error ? error.stack : undefined
          }
        );
        console.error(`❌ Error fetching chat ${chatId}:`, error);
        return;
      }
    } else {
      const loadTimeMs = performance.now() - startTime;
      console.log(`✅ Chat ${chatId} already in state, resuming directly (${loadTimeMs.toFixed(0)}ms)`);
    }
    
    console.log(`Resumed chat: ${chatId}`);
  }, [userId, setCurrentChatId, savedChats, getChat, setSavedChats]);

  const handleUpdateChatTitle = useCallback(async (chatId: string, newTitle: string) => {
    const trimmed = (newTitle || '').trim();
    const existing = savedChats.find(c => c.id === chatId);
    if (existing && (existing.title || '').trim() === trimmed) {
      console.log(`🛑 Skipping title update for ${chatId} - title unchanged`);
      return;
    }

    console.log(`📝 handleUpdateChatTitle called for chat ${chatId}: "${trimmed}"`);
    
    // ✅ GUARDRAIL: Mark as "generated" so RAG title never overwrites manual rename
    markGeneratedExternal(chatId);
    
    // ⚡ OPTIMISTIC UPDATE: Update local state FIRST for instant UI update
    setSavedChats(prev => {
      const updated = prev.map(chat => 
        chat.id === chatId ? { ...chat, title: trimmed || "Untitled Chat", updated_at: new Date().toISOString() } : chat
      );
      console.log(`✅ Local state updated optimistically - chat ${chatId} title is now: "${trimmed || "Untitled Chat"}"`);
      return updated;
    });
    
    // Then persist to database (real-time will confirm the update)
    await updateChatTitle(chatId, trimmed);
    
    console.log(`✅ Database updated with title: "${trimmed}"`);
  }, [updateChatTitle, setSavedChats, savedChats]);

  const handleDeleteChat = useCallback(async (chatId: string) => {
    await deleteChat(chatId);
    
    // Update local state directly (optimistic)
    setSavedChats(prev => prev.filter(chat => chat.id !== chatId));
    
    if (currentChatId === chatId) {
      setCurrentChatId(null);
    }
  }, [deleteChat, currentChatId, setSavedChats, setCurrentChatId]);

  const handleTogglePinStatus = useCallback(async (chatId: string, pinned: boolean) => {
    await togglePinStatus(chatId, pinned);
    
    // Update local state and re-sort (optimistic)
    setSavedChats(prev => {
      const updated = prev.map(chat => 
        chat.id === chatId ? { ...chat, pinned } : chat
      );
      return sortChats(updated);
    });
  }, [togglePinStatus, sortChats, setSavedChats]);

  const handleRegenerateTitle = useCallback(async (chatId: string) => {
    const chat = savedChats.find(c => c.id === chatId);
    if (!chat || chat.messages.length < 2) {
      console.log('Cannot regenerate title - insufficient messages');
      return;
    }

    console.log('🔄 Starting title regeneration for chat:', chatId);
    
    // Show typing animation immediately
    await setTypingTitle(chatId, true);
    
    // Update local state to show typing animation
    setSavedChats(prev => prev.map(c => 
      c.id === chatId ? { ...c, isTypingTitle: true } : c
    ));

    try {
      // Generate new title
      const newTitle = await generateChatTitle(chat.messages, chat.title);
      
      if (newTitle) {
        // Update the actual title in the database
        await updateChatTitle(chatId, newTitle);
        
        // Update local state with new title and stop typing animation
        setSavedChats(prev => prev.map(c => 
          c.id === chatId ? { ...c, title: newTitle, isTypingTitle: false } : c
        ));
        
        console.log(`✅ Title regenerated successfully: "${newTitle}"`);
      } else {
        console.log('⚠️ Title regeneration returned null');
      }
    } catch (error) {
      console.error('❌ Title regeneration failed:', error);
    } finally {
      // Ensure typing animation stops
      await setTypingTitle(chatId, false);
      setSavedChats(prev => prev.map(c => 
        c.id === chatId ? { ...c, isTypingTitle: false } : c
      ));
    }
  }, [savedChats, setTypingTitle, generateChatTitle, updateChatTitle, setSavedChats]);

  const bulkDeleteAllChats = useCallback(async (
    onProgress?: (deleted: number, total: number) => void
  ) => {
    if (!userId) {
      console.log('Guest user cannot delete chats');
      return;
    }

    try {
      console.log('🗑️ Starting bulk delete of all chats for user:', userId);
      
      const { supabase } = await import('@/integrations/supabase/client');
      
      // First, get the total count of chats
      const { count, error: countError } = await supabase
        .from('chats')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError) {
        console.error('❌ Failed to get chat count:', countError);
        throw countError;
      }

      const totalChats = count || 0;
      console.log(`📊 Total chats to delete: ${totalChats}`);

      if (totalChats === 0) {
        console.log('✅ No chats to delete');
        return;
      }

      // Delete all chats for this user
      const { error: deleteError } = await supabase
        .from('chats')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('❌ Bulk delete failed:', deleteError);
        throw deleteError;
      }

      // Report progress
      if (onProgress) {
        onProgress(totalChats, totalChats);
      }

      // Clear local state
      setSavedChats([]);
      setCurrentChatId(null);
      
      console.log('✅ All chats deleted successfully');
      return totalChats;
    } catch (error) {
      console.error('❌ Error in bulk delete:', error);
      throw error;
    }
  }, [userId, setSavedChats, setCurrentChatId]);

  return {
    createNewChat,
    findOrCreateEmptyChat,
    saveChat,
    getChat: useCallback(async (chatId: string) => await getChat(chatId, savedChats), [getChat, savedChats]),
    resumeChat,
    updateChatTitle: handleUpdateChatTitle,
    deleteChat: handleDeleteChat,
    togglePinStatus: handleTogglePinStatus,
    bulkDeleteAllChats,
    
    setTypingTitle
  };
};