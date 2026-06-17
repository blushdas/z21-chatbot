
import { useState, useCallback, useEffect, useMemo } from 'react';
import { MessageType, ChatMode } from '@/components/ChatInterface';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useChatManagementContext } from '@/context/ChatManagementContext';

export interface Chat {
  id: string;
  title: string;
  messages: MessageType[];
  createdAt: number;
  updatedAt: number;
  isDraft: boolean;
  mode: ChatMode;
  pinned: boolean;
  isTypingTitle: boolean;
  folder_id?: string | null;
  mode_change_events?: Array<{id: string, type: 'mode' | 'model', value: string, timestamp: string}>;
}

export const useChatManagement = () => {
  const { user, loading: authLoading } = useAuth();
  const supabaseChat = useChatManagementContext();
  
  // Guest state for non-authenticated users
  const [guestCurrentChatId, setGuestCurrentChatId] = useState<string | null>(null);
  const [initializationComplete, setInitializationComplete] = useState(false);

  // Debug logging removed for performance

  // Initialize state based on auth status
  useEffect(() => {
    if (authLoading) return;

    if (user) {
      if (supabaseChat.initialized) {
        setInitializationComplete(true);
      }
    } else {
      setInitializationComplete(true);
    }
  }, [user, authLoading, supabaseChat.initialized]);

  // FIXED: Convert Supabase chat to local format with proper reactive dependencies
  const convertSupabaseToLocal = useCallback((supabaseChat: any): Chat => {
    const converted = {
      id: supabaseChat.id,
      title: supabaseChat.title,
      messages: supabaseChat.messages || [],
      createdAt: new Date(supabaseChat.created_at).getTime(),
      updatedAt: new Date(supabaseChat.updated_at).getTime(),
      isDraft: supabaseChat.messages?.length === 0,
      mode: supabaseChat.mode || 'coach',
      pinned: supabaseChat.pinned || false,
      isTypingTitle: supabaseChat.isTypingTitle || false,
      folder_id: supabaseChat.folder_id,
      mode_change_events: supabaseChat.mode_change_events || []
    };
    return converted;
  }, []);

  // FIXED: Enhanced savedChats with better reactivity tracking
  const savedChats = useMemo(() => {
    if (!user) return [];
    return supabaseChat.savedChats.map(convertSupabaseToLocal);
  }, [user, supabaseChat.savedChats, convertSupabaseToLocal]);

  // Convert currentChat from Supabase format to local format
  const currentChat = useMemo(() => {
    if (!user || !supabaseChat.currentChat) return null;
    return convertSupabaseToLocal(supabaseChat.currentChat);
  }, [user, supabaseChat.currentChat, convertSupabaseToLocal]);
    
  const currentChatId = user ? supabaseChat.currentChatId : guestCurrentChatId;
  const initialized = initializationComplete;

  // Create new chat - delegates to appropriate storage
  const createNewChat = useCallback(async (mode: ChatMode = 'coach'): Promise<string> => {
    if (!initializationComplete) {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      return tempId;
    }

    if (user) {
      return await supabaseChat.createNewChat(mode);
    }

    const guestChatId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setGuestCurrentChatId(guestChatId);
    return guestChatId;
  }, [user, initializationComplete, supabaseChat]);

  // Find or create empty chat
  const findOrCreateEmptyChat = useCallback(async (mode: ChatMode = 'coach', forceNew: boolean = false): Promise<string> => {
    if (!initializationComplete) {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      return tempId;
    }

    if (user) {
      return await supabaseChat.findOrCreateEmptyChat(mode, forceNew);
    }

    const guestChatId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setGuestCurrentChatId(guestChatId);
    return guestChatId;
  }, [user, initializationComplete, supabaseChat]);

  const saveChat = useCallback(async (
    chatId: string, 
    messages: MessageType[], 
    mode: ChatMode,
    modeChangeEvents?: Array<{id: string, type: 'mode' | 'model' | 'power' | 'blueprint', value: string, timestamp: string}>
  ) => {
    console.log('💾 useChatManagement.saveChat called:', {
      chatId,
      messagesCount: messages.length,
      modeChangeEventsCount: modeChangeEvents?.length || 0,
      initializationComplete,
      hasUser: !!user,
      isGuestChat: chatId.startsWith('guest-'),
      isTempChat: chatId.startsWith('temp-')
    });

    if (!initializationComplete) {
      console.error('❌ SAVE BLOCKED: initializationComplete is false');
      return;
    }

    if (!user) {
      console.error('❌ SAVE BLOCKED: user is null/undefined');
      return;
    }

    if (chatId.startsWith('guest-') || chatId.startsWith('temp-')) {
      console.log('⏭️ Skipping save for guest/temp chat');
      return;
    }

    try {
      await supabaseChat.saveChat(chatId, messages, mode, modeChangeEvents);
      console.log('✅ Save delegated to supabaseChat successfully');
    } catch (error) {
      console.error('❌ Error in supabaseChat.saveChat:', error);
    }
  }, [user, initializationComplete, supabaseChat]);

  // Get chat by ID
  const getChat = useCallback((chatId: string): Chat | undefined => {
    if (user && !chatId.startsWith('guest-') && !chatId.startsWith('temp-')) {
      const supabaseChatData = supabaseChat.getChat(chatId);
      return supabaseChatData ? convertSupabaseToLocal(supabaseChatData) : undefined;
    }
    return undefined; // Guest chats are not stored
  }, [user, supabaseChat, convertSupabaseToLocal]);

  // Extract specific function to stabilize dependency
  const supabaseResumeChat = supabaseChat.resumeChat;
  const resumeChat = useCallback(async (chatId: string, forceRefresh?: boolean) => {
    if (user && !chatId.startsWith('guest-') && !chatId.startsWith('temp-')) {
      await supabaseResumeChat(chatId, forceRefresh);
    }
  }, [user, supabaseResumeChat]);

  const updateChatTitle = useCallback(async (chatId: string, newTitle: string) => {
    if (user && !chatId.startsWith('guest-') && !chatId.startsWith('temp-')) {
      await supabaseChat.updateChatTitle(chatId, newTitle);
    }
  }, [user, supabaseChat]);

  const deleteChat = useCallback(async (chatId: string) => {
    if (user && !chatId.startsWith('guest-') && !chatId.startsWith('temp-')) {
      await supabaseChat.deleteChat(chatId);
    }
  }, [user, supabaseChat]);

  const togglePinStatus = useCallback(async (chatId: string, pinned: boolean) => {
    if (user && !chatId.startsWith('guest-') && !chatId.startsWith('temp-')) {
      await supabaseChat.togglePinStatus(chatId, pinned);
    }
  }, [user, supabaseChat]);

  // ✅ Expose setCurrentChatId for centralized new chat session handling
  const setCurrentChatId = useCallback((chatId: string | null) => {
    if (user) {
      supabaseChat.setCurrentChatId(chatId);
    } else {
      setGuestCurrentChatId(chatId);
    }
  }, [user, supabaseChat]);

  const debugInfo = {
    savedChats,
    currentChatId,
    currentChat,
    createNewChat,
    findOrCreateEmptyChat,
    saveChat,
    getChat,
    resumeChat,
    updateChatTitle,
    deleteChat,
    togglePinStatus,
    setCurrentChatId, // ✅ Export for centralized handling
    initialized,
    isAuthenticated: !!user && initialized
  };

  return debugInfo;
};
