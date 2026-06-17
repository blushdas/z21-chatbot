
import { useEffect, useState } from 'react';

interface UseChatUrlParamsProps {
  isAuthenticated: boolean;
  initialized: boolean;
  resumeChat: (chatId: string, forceRefresh?: boolean) => Promise<void>;
  setHighlightedMessageIndex: (index: number | null) => void;
  currentChatId: string | null; // Add this to track current chat state
}

export const useChatUrlParams = ({
  isAuthenticated,
  initialized,
  resumeChat,
  setHighlightedMessageIndex,
  currentChatId
}: UseChatUrlParamsProps) => {
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const highlightParam = urlParams.get('highlight');
    
    // For URL structure /chat/:chatId, the chatId comes from currentChatId (handled by router)
    // Only handle highlight parameter here since chat resume is handled by IndexContent
    if (currentChatId && isAuthenticated && initialized) {
      
      // Set highlighted message index if provided
      if (highlightParam) {
        const messageIndex = parseInt(highlightParam, 10);
        if (!isNaN(messageIndex)) {
          console.log('🎯 Setting highlighted message index:', messageIndex);
          setHighlightedMessageIndex(messageIndex);
          
          // Clear highlight after 8 seconds
          setTimeout(() => {
            console.log('🎯 Clearing highlighted message');
            setHighlightedMessageIndex(null);
          }, 8000);
          
          // Clean up highlight parameter after processing
          setTimeout(() => {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('highlight');
            window.history.replaceState({}, '', newUrl.toString());
            console.log('🧹 Highlight parameter cleaned up');
          }, 500);
        }
      }
    }
  }, [isAuthenticated, initialized, setHighlightedMessageIndex, currentChatId]);

  return { chatLoading };
};
