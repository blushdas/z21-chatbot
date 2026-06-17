import { useCallback } from 'react';
import { MessageType, ChatMode } from '@/components/ChatInterface';
import { useChatTitleManager } from './useChatTitleManager';
import { useChatOptimisticUpdates } from './useChatOptimisticUpdates';
import { useChatSupabaseOperations } from './useChatSupabaseOperations';
import { useTitleGenerationLock, hasGeneratedExternal } from '@/hooks/useTitleGenerationLock';
import { supabase } from '@/integrations/supabase/client';

// Track active title generation promises to ensure completion even on chat switch
const activeTitleGenerations = new Map<string, Promise<void>>();

// Export function to wait for pending title generation (useful for cleanup)
export const waitForTitleGeneration = async (chatId: string) => {
  const pending = activeTitleGenerations.get(chatId);
  if (pending) await pending;
};

export const useChatSaver = (userId?: string) => {
  const { setTypingTitle, generateChatTitle } = useChatTitleManager(userId);
  const { 
    showLoadingState, 
    showTypingTitle, 
    finalizeUpdate, 
    revertOptimisticUpdate, 
    stopTypingIndicator 
  } = useChatOptimisticUpdates();
  const { saveToSupabase } = useChatSupabaseOperations(userId);
  const { tryAcquireForGeneration, releaseLock, markGenerated } = useTitleGenerationLock();

  const saveChat = useCallback(async (
    chatId: string, 
    messages: MessageType[], 
    mode: ChatMode,
    currentChat?: any,
    onStateUpdate?: (updater: (prev: any[]) => any[]) => void,
    skipTitleGeneration?: boolean,
    modeChangeEvents?: Array<{id: string, type: 'mode' | 'model' | 'power' | 'blueprint', value: string, timestamp: string}>
  ) => {
    console.log('💾 saveChat called:', {
      chatId,
      messagesLength: messages.length,
      mode,
      userId,
      isGuest: chatId.startsWith('guest-'),
      isTemp: chatId.startsWith('temp-'),
    });

    if (!userId) {
      console.log('❌ Guest user - chat not saved');
      return;
    }

    if (chatId.startsWith('guest-') || chatId.startsWith('temp-')) {
      console.log('❌ Attempted to save guest/temp chat - ignoring');
      return;
    }

    try {
      console.log(`💾 Saving chat ${chatId} with ${messages.length} messages for user:`, userId);
      
      // ✅ PRIMARY FIX: Query database DIRECTLY for current title - don't trust currentChat param
      const { data: existingChat } = await supabase
        .from('chats')
        .select('title')
        .eq('id', chatId)
        .eq('user_id', userId)
        .maybeSingle();
      
      const dbTitle = existingChat?.title;
      const alreadyHasRealTitle = dbTitle && 
        dbTitle !== "New Chat" && 
        dbTitle.trim() !== '';
      
      // ✅ ABSOLUTE GUARDRAIL: If DB already has a real title, NEVER regenerate
      if (alreadyHasRealTitle) {
        console.log('🏷️ ⏭️ DB already has title, NEVER regenerating:', dbTitle);
        markGenerated(chatId); // Sync lock for future saves
        await saveToSupabase(chatId, messages, mode, undefined, false, modeChangeEvents);
        return;
      }
      
      // ✅ SECONDARY GUARDRAIL: Check localStorage lock
      if (hasGeneratedExternal(chatId)) {
        console.log('🏷️ ⏭️ Skipping - already marked as generated in lock system');
        await saveToSupabase(chatId, messages, mode, undefined, false, modeChangeEvents);
        return;
      }
      
      // Filter for valid messages
      const validMessages = messages.filter(m => 
        m.content && 
        typeof m.content === 'string' && 
        m.content.trim() &&
        (m.sender === 'user' || m.sender === 'daryle')
      );
      
      const userMessages = validMessages.filter(m => m.sender === 'user');
      const aiMessages = validMessages.filter(m => m.sender === 'daryle');
      
      // Track if new messages were added
      const hasNewMessages = currentChat?.messages 
        ? messages.length > currentChat.messages.length 
        : false;
      
      // Only generate title when: user+AI messages exist AND no DB title exists
      let shouldGenerateSmartTitle = false;
      
      if (userMessages.length > 0 && aiMessages.length > 0 && validMessages.length >= 2) {
        await saveToSupabase(chatId, messages, mode, undefined, hasNewMessages, modeChangeEvents);
        // Only try title generation if DB has no real title (already checked above)
        shouldGenerateSmartTitle = !alreadyHasRealTitle;
      } else {
        await saveToSupabase(chatId, messages, mode, undefined, hasNewMessages, modeChangeEvents);
      }

      // Try to acquire lock atomically - ONE title generation per chat, ever
      // ✅ FIX: Skip title generation if this is an emergency save
      if (shouldGenerateSmartTitle && !skipTitleGeneration && tryAcquireForGeneration(chatId)) {
        // Show typing indicator immediately
        if (onStateUpdate) {
          onStateUpdate(prev => prev.map(chat => 
            chat.id === chatId ? { ...chat, isTypingTitle: true } : chat
          ));
        }
        
        // ✅ FIX: Track title generation promise to ensure completion even on chat switch
        const titlePromise = (async () => {
          try {
            console.log(`🏷️ Starting FIRST-TIME title generation for chat ${chatId}`);
            const newTitle = await generateChatTitle(messages, "New Chat");
            
            if (newTitle && newTitle !== "New Chat") {
              console.log(`🏷️ ✅ Title generated successfully: "${newTitle}"`);
              
              // ✅ ATOMIC UPDATE: Stop loading AND show title in ONE operation
              // This prevents the flicker: Loading → New Chat → Loading → Title
              if (onStateUpdate) {
                onStateUpdate(prev => prev.map(chat => 
                  chat.id === chatId 
                    ? { 
                        ...chat, 
                        title: newTitle,
                        isTypingTitle: false, // Stop loading at same time as showing title
                        updated_at: new Date().toISOString(),
                        shouldAnimateTitle: true // Trigger fade-in animation
                      }
                    : chat
                ));
              }
              
              // Clear the animation flag after animation completes
              setTimeout(() => {
                if (onStateUpdate) {
                  onStateUpdate(prev => prev.map(chat => 
                    chat.id === chatId 
                      ? { ...chat, shouldAnimateTitle: false }
                      : chat
                  ));
                }
              }, 500); // Match animation duration
              
              // Save to database ONCE - force timestamp update when title changes
              await saveToSupabase(chatId, messages, mode, newTitle, true, modeChangeEvents);
              
              // Mark as generated successfully
              markGenerated(chatId);
            } else {
              console.log(`🏷️ ⚠️ Title generation returned null or same title`);
              // Remove typing indicator if no title
              if (onStateUpdate) {
                onStateUpdate(prev => prev.map(chat => 
                  chat.id === chatId ? { ...chat, isTypingTitle: false } : chat
                ));
              }
            }
          } catch (error) {
            console.error('🏷️ ❌ RAG title error:', error);
            if (onStateUpdate) {
              onStateUpdate(prev => prev.map(chat => 
                chat.id === chatId ? { ...chat, isTypingTitle: false } : chat
              ));
            }
          } finally {
            releaseLock(chatId);
            activeTitleGenerations.delete(chatId);
          }
        })();
        
        // Track the promise so it completes even if user switches chats
        activeTitleGenerations.set(chatId, titlePromise);
      }
      
    } catch (error) {
      console.error(`❌ Error saving chat:`, error);
      
      // Stop typing indicator and revert optimistic updates
      await setTypingTitle(chatId, false);
      revertOptimisticUpdate(chatId, currentChat?.title || "New Chat", onStateUpdate);
      stopTypingIndicator(chatId, onStateUpdate);
    }
  }, [
    userId, 
    generateChatTitle, 
    saveToSupabase,
    tryAcquireForGeneration,
    releaseLock,
    markGenerated
  ]);

  return { saveChat, setTypingTitle };
};