
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MessageType } from '@/components/ChatInterface';
import { useRagTitleGeneration } from '@/hooks/useRagTitleGeneration';
import { generateTitle } from './titleUtils';

export const useChatTitleManager = (userId?: string) => {
  const { generateSmartTitle, shouldGenerateSmartTitle } = useRagTitleGeneration();

  const setTypingTitle = useCallback(async (chatId: string, isTyping: boolean) => {
    if (!userId || chatId.startsWith('guest-') || chatId.startsWith('temp-')) return;

    try {
      const { error } = await supabase
        .from('chats')
        .update({ is_typing_title: isTyping })
        .eq('id', chatId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error setting typing title state:', error);
    }
  }, [userId]);

  const generateChatTitle = useCallback(async (
    messages: MessageType[], 
    currentTitle: string
  ): Promise<string | null> => {
    console.log('🏷️ 🎬 [TITLE MANAGER] Starting title generation flow');
    console.log('🏷️ 📋 [TITLE MANAGER] Current title:', currentTitle);
    
    const userMessages = messages.filter(m => m.sender === 'user');
    const aiMessages = messages.filter(m => m.sender === 'daryle');
    
    console.log('🏷️ 📊 [TITLE MANAGER] Message stats:', { 
      total: messages.length, 
      user: userMessages.length, 
      ai: aiMessages.length 
    });
    
    const shouldTryTitle = shouldGenerateSmartTitle(messages, currentTitle) && 
                         userMessages.length > 0 && aiMessages.length > 0;

    if (!shouldTryTitle) {
      console.log('🏷️ ⏭️ [TITLE MANAGER] Skipping - shouldGenerateSmartTitle returned false');
      return null;
    }

    console.log('🏷️ ✅ [TITLE MANAGER] Conditions met, proceeding with RAG title generation');

    try {
      console.log('🏷️ 🚀 [TITLE MANAGER] Calling generateSmartTitle...');
      const smartTitle = await generateSmartTitle(messages);
      
      if (smartTitle) {
        console.log('🏷️ ✅ [TITLE MANAGER] Smart title received:', smartTitle);
        return smartTitle;
      } else {
        console.log('🏷️ ⚠️ [TITLE MANAGER] Smart title returned null, using fallback');
        const firstUserMessage = userMessages[0];
        const fallbackTitle = generateTitle(firstUserMessage.content);
        console.log('🏷️ 🔄 [TITLE MANAGER] Fallback title:', fallbackTitle);
        return fallbackTitle;
      }
    } catch (error) {
      console.error('🏷️ ❌ [TITLE MANAGER] Smart title generation failed, using fallback:', error);
      const firstUserMessage = userMessages[0];
      const fallbackTitle = generateTitle(firstUserMessage.content);
      console.log('🏷️ 🔄 [TITLE MANAGER] Fallback title after error:', fallbackTitle);
      return fallbackTitle;
    }
  }, [generateSmartTitle, shouldGenerateSmartTitle]);

  return {
    setTypingTitle,
    generateChatTitle
  };
};
