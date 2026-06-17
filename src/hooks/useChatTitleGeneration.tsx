
import { useCallback } from 'react';
import { MessageType } from '@/components/ChatInterface';
import { useRagTitleGeneration } from './useRagTitleGeneration';

export const useChatTitleGeneration = () => {
  const { generateSmartTitle, shouldGenerateSmartTitle } = useRagTitleGeneration();

  // Legacy simple title generation as fallback
  const generateSimpleTitle = useCallback((firstMessage: string): string => {
    if (!firstMessage?.trim()) return "New Chat";
    
    let clean = firstMessage.trim()
      .replace(/^(coaching|family|investor|ambassador|faith|leadership)\s*[-:]\s*/i, '')
      .replace(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})+\s*/gu, '')
      .replace(/^\[[\w\s]+\]\s*/i, '')
      .replace(/^(hi|hello|hey)\s*[,!.]?\s*/i, '')
      .replace(/^(can you|could you|please)\s*/i, '');
    
    if (clean.length > 50) {
      clean = clean.substring(0, 47) + "...";
    }
    
    return clean || "New Chat";
  }, []);

  // Enhanced title generation that tries smart first, falls back to simple
  const generateTitle = useCallback(async (messages: MessageType[]): Promise<string | null> => {
    if (!messages?.length) return null;

    try {
      // Try smart RAG-based title generation first
      const smartTitle = await generateSmartTitle(messages);
      if (smartTitle) {
        console.log('🏷️ Using smart RAG title:', smartTitle);
        return smartTitle;
      }

      // Fallback to simple title from first user message
      const userMessages = messages.filter(m => m.sender === 'user');
      if (userMessages.length > 0) {
        const simpleTitle = generateSimpleTitle(userMessages[0].content);
        console.log('🏷️ Using simple fallback title:', simpleTitle);
        return simpleTitle;
      }

      return null;
    } catch (error) {
      console.error('🏷️ Error in title generation:', error);
      return null;
    }
  }, [generateSmartTitle, generateSimpleTitle]);

  const shouldGenerateTitle = useCallback((messages: MessageType[], currentTitle: string): boolean => {
    return shouldGenerateSmartTitle(messages, currentTitle);
  }, [shouldGenerateSmartTitle]);

  return {
    generateTitle,
    shouldGenerateTitle,
    generateSmartTitle,
    generateSimpleTitle
  };
};
