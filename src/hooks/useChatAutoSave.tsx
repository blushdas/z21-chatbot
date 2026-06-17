
import { useEffect, useRef } from 'react';
import { MessageType, ChatMode } from '@/components/ChatInterface';

interface UseChatAutoSaveProps {
  chatId: string | null;
  messages: MessageType[];
  mode: ChatMode;
  saveChat: (chatId: string, messages: MessageType[], mode: ChatMode, currentChat?: any, onStateUpdate?: any, skipTitleGeneration?: boolean) => Promise<void>;
  enabled?: boolean;
  manualSaveInProgress?: boolean; // New prop to detect manual saves
  isStreaming?: boolean; // ✅ NEW: Skip emergency saves during streaming
}

export const useChatAutoSave = ({
  chatId,
  messages,
  mode,
  saveChat,
  enabled = true,
  manualSaveInProgress = false,
  isStreaming = false
}: UseChatAutoSaveProps) => {
  const lastSavedMessages = useRef<MessageType[]>([]);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastSaveTime = useRef<number>(0);
  const isSaving = useRef<boolean>(false);
  const isFirstLoadRef = useRef<boolean>(true);

  // Reset auto-save state when switching to a different chat
  useEffect(() => {
    lastSavedMessages.current = [];
    lastSaveTime.current = 0;
    isFirstLoadRef.current = true;
    console.log('🔄 Chat switched - reset auto-save state for chat:', chatId);
  }, [chatId]);

  useEffect(() => {
    // ✅ CRITICAL FIX: Skip all auto-saves during streaming - let onComplete handle it
    if (isStreaming) {
      console.log('⏸️ Auto-save: Streaming in progress - skipping to let onComplete save complete content');
      return;
    }
    
    console.log('🔄 Auto-save effect triggered:', {
      enabled,
      chatId,
      messagesLength: messages.length,
      mode,
      manualSaveInProgress,
      messageIds: messages.map(m => m.id),
      lastSavedLength: lastSavedMessages.current.length
    });

    if (!enabled || manualSaveInProgress) {
      console.log('⏸️ Auto-save disabled or manual save in progress');
      return;
    }

    if (!chatId || messages.length === 0) {
      console.log('❌ Auto-save skipped:', { enabled, chatId, messagesLength: messages.length });
      return;
    }

    // Don't save guest chats or temporary chats
    if (chatId.startsWith('guest-') || chatId.startsWith('temp-')) {
      console.log('❌ Skipping auto-save for guest/temp chat:', chatId);
      return;
    }

    // Check if messages have actually changed (using message IDs for efficiency)
    const messagesChanged = 
      messages.length !== lastSavedMessages.current.length ||
      messages.some((msg, index) => {
        const lastMsg = lastSavedMessages.current[index];
        return !lastMsg || msg.id !== lastMsg.id;  // Only check IDs, not content
      });

    console.log('📊 Message change analysis:', {
      currentLength: messages.length,
      lastSavedLength: lastSavedMessages.current.length,
      messagesChanged,
      currentMessageIds: messages.map(m => `${m.id}-${m.content?.substring(0, 20) || 'no content'}...`),
      lastSavedIds: lastSavedMessages.current.map(m => `${m.id}-${m.content?.substring(0, 20) || 'no content'}...`)
    });

    if (!messagesChanged) {
      console.log('✅ Auto-save: No message changes detected');
      return;
    }

    // Check if we just got a new bot message (for immediate backup save)
    const lastMessage = messages[messages.length - 1];
    const previousLastMessage = lastSavedMessages.current[lastSavedMessages.current.length - 1];
    
    // ✅ FIX: Skip "bot response detected" on initial load to prevent timestamp corruption
    const justReceivedBotResponse = 
      !isFirstLoadRef.current && // Skip on initial load - prevents viewing from updating timestamps
      lastMessage?.sender === 'daryle' && 
      lastMessage?.content?.length > 0 &&
      (!previousLastMessage || previousLastMessage.id !== lastMessage.id);

    if (justReceivedBotResponse) {
      console.log('🤖 Bot response detected - triggering immediate backup save');
      performSave();
      return;
    }

    // Skip save on first load - just initialize lastSavedMessages
    if (isFirstLoadRef.current) {
      lastSavedMessages.current = [...messages];
      isFirstLoadRef.current = false;
      console.log('📥 First load of chat - initialized lastSavedMessages without saving');
      return;
    }

    // Don't auto-save too frequently (minimum 5 seconds between saves to avoid race conditions)
    const now = Date.now();
    const timeSinceLastSave = now - lastSaveTime.current;
    console.log('⏱️ Save timing check:', {
      timeSinceLastSave,
      minInterval: 5000,
      shouldDebounce: timeSinceLastSave < 5000
    });

    if (timeSinceLastSave < 5000) {
      console.log('⏳ Auto-save: Debouncing save attempt...');
      
      // Clear existing timeout and set new one
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
        console.log('🔄 Cleared existing timeout');
      }
      
      saveTimeout.current = setTimeout(() => {
        console.log('🚀 Auto-save: Executing debounced save...');
        performSave();
      }, 5000);
      
      return;
    }

    // Perform immediate save
    console.log('🚀 Auto-save: Executing immediate save...');
    performSave();

    async function performSave() {
      if (isSaving.current || manualSaveInProgress) {
        console.log('⚠️ Auto-save: Already saving or manual save in progress, skipping...');
        return;
      }

      try {
        isSaving.current = true;
        
        // ✅ NEW: Log content lengths for debugging truncation issues
        const botMessage = messages.find(m => m.sender === 'daryle');
        console.log(`💾 Auto-save: Starting save for chat ${chatId} with ${messages.length} messages`, {
          mode,
          botContentLength: botMessage?.content?.length || 0,
          isStreaming, // Should always be false if we get here
          messagePreview: messages.map(m => ({
            id: m.id,
            sender: m.sender,
            contentLength: m.content.length,
            timestamp: m.timestamp
          }))
        });
        
        const saveStartTime = Date.now();
        await saveChat(chatId, messages, mode);
        const saveEndTime = Date.now();
        
        lastSavedMessages.current = [...messages];
        lastSaveTime.current = Date.now();
        
        console.log(`✅ Auto-save: Successfully saved chat ${chatId}`, {
          saveTimeMs: saveEndTime - saveStartTime,
          savedMessagesCount: messages.length
        });
      } catch (error) {
        console.error('❌ Auto-save failed:', {
          chatId,
          error: error.message,
          stack: error.stack,
          messagesCount: messages.length
        });
      } finally {
        isSaving.current = false;
        console.log('🏁 Auto-save: Save attempt completed');
      }
    }

    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
        console.log('🧹 Auto-save: Cleanup - cleared timeout');
      }
    };
  }, [chatId, messages, mode, saveChat, enabled, manualSaveInProgress, isStreaming]);

};
