
import { useCallback } from 'react';
import { MessageType } from '@/components/ChatInterface';
import { generateRagTitle } from '@/services/titleGenerationService';

export const useRagTitleGeneration = () => {
  const generateSmartTitle = useCallback(async (messages: MessageType[]): Promise<string | null> => {
    if (!messages?.length) {
      console.log('🏷️ No messages provided for title generation');
      return null;
    }

    const userMessages = messages.filter(m => m.sender === 'user');
    const aiMessages = messages.filter(m => m.sender === 'daryle');

    // Need at least one exchange (user + AI) for smart title generation
    if (userMessages.length === 0 || aiMessages.length === 0) {
      console.log('🏷️ Insufficient message exchange for smart title generation');
      return null;
    }

    console.log('🏷️ Generating smart title with RAG for', messages.length, 'messages');
    
    try {
      const smartTitle = await generateRagTitle(messages);
      
      if (smartTitle) {
        console.log('🏷️ Smart title generated successfully:', smartTitle);
        return smartTitle;
      }
      
      console.log('🏷️ RAG title generation failed, will fallback to simple title');
      return null;
    } catch (error) {
      console.error('🏷️ Error in smart title generation:', error);
      return null;
    }
  }, []);

  const shouldGenerateSmartTitle = useCallback((messages: MessageType[], currentTitle: string): boolean => {
    if (!currentTitle || currentTitle === "New Chat" || currentTitle.trim() === '') {
      return true;
    }
    
    // Don't regenerate if we already have a good title
    return false;
  }, []);

  return { 
    generateSmartTitle,
    shouldGenerateSmartTitle
  };
};
