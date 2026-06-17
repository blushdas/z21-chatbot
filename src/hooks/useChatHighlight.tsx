
import { useEffect } from 'react';
import { MessageType } from '@/components/ChatInterface';

interface UseChatHighlightProps {
  highlightedMessageIndex: number | null;
  messages: MessageType[];
  messagesContainerRef: React.RefObject<HTMLDivElement>;
}

export const useChatHighlight = ({
  highlightedMessageIndex,
  messages,
  messagesContainerRef
}: UseChatHighlightProps) => {
  // Scroll to highlighted message after messages are loaded
  useEffect(() => {
    if (highlightedMessageIndex !== null && messages.length > 0 && messagesContainerRef.current) {
      // Wait a bit for DOM to be fully rendered
      setTimeout(() => {
        const messageElements = messagesContainerRef.current?.querySelectorAll('[data-message-index]');
        if (messageElements && messageElements[highlightedMessageIndex]) {
          const targetElement = messageElements[highlightedMessageIndex] as HTMLElement;
          targetElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 500);
    }
  }, [highlightedMessageIndex, messages.length, messagesContainerRef]);
};
