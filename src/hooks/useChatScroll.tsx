
import { useEffect, useRef, useCallback } from 'react';
import { MessageType } from '@/components/ChatInterface';

export const useChatScroll = (
  messagesContainerRef: React.RefObject<HTMLDivElement>,
  messages: MessageType[],
  streamingMessageId: string | null,
  isBotTyping?: boolean,
  messagesJustLoadedFromDb?: boolean, // Flag indicating messages were loaded from saved chat
  chatId?: string | null // Track which chat we're viewing
) => {
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasScrolledToLastMessageRef = useRef(false);
  const prevMessagesLengthRef = useRef(0);
  const prevChatIdRef = useRef<string | null | undefined>(chatId);

  // Scroll to bottom helper with useCallback for stable reference
  const scrollToBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messagesContainerRef]);

  // Instant jump to bottom (no animation) - used on initial chat load
  const scrollToBottomInstant = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messagesContainerRef]);

  // Scroll to TOP of the last message (for loading saved chats)
  const scrollToLastMessageTop = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container || messages.length === 0) return;
    
    const lastIndex = messages.length - 1;
    const lastMessageElement = container.querySelector(`[data-message-index="${lastIndex}"]`) as HTMLElement;
    
    if (lastMessageElement) {
      // Get the parent wrapper div that contains the message (for the full message block)
      const messageWrapper = lastMessageElement.closest('.animate-fade-in') || lastMessageElement;
      
      // Calculate position with offset for floating header (80px)
      const headerOffset = 100;
      const containerRect = container.getBoundingClientRect();
      const elementRect = messageWrapper.getBoundingClientRect();
      const scrollTop = container.scrollTop + (elementRect.top - containerRect.top) - headerOffset;
      
      container.scrollTo({
        top: Math.max(0, scrollTop),
        behavior: 'smooth'
      });
    }
  }, [messagesContainerRef, messages.length]);

  // Reset refs when switching to a different chat
  useEffect(() => {
    if (chatId !== prevChatIdRef.current) {
      prevMessagesLengthRef.current = 0;
      hasScrolledToLastMessageRef.current = false;
      prevChatIdRef.current = chatId;
    }
  }, [chatId]);

  // Reset scroll flag when chat changes (messages length goes from >0 to different chat)
  useEffect(() => {
    if (messages.length === 0) {
      hasScrolledToLastMessageRef.current = false;
    }
  }, [messages.length]);

  // Handle initial load from saved chat - scroll to top of last message
  useEffect(() => {
    if (
      messagesJustLoadedFromDb && 
      messages.length > 0 && 
      !hasScrolledToLastMessageRef.current &&
      !streamingMessageId &&
      !isBotTyping
    ) {
      hasScrolledToLastMessageRef.current = true;
      requestAnimationFrame(() => {
        setTimeout(() => {
          scrollToBottomInstant();
          // Re-assert after images/markdown finish painting
          setTimeout(scrollToBottomInstant, 150);
          setTimeout(scrollToBottomInstant, 400);
        }, 50);
      });
    }
  }, [messagesJustLoadedFromDb, messages.length, streamingMessageId, isBotTyping, scrollToBottomInstant]);

  // Scroll to bottom when a NEW message is added during active conversation
  useEffect(() => {
    // Only trigger if messages increased (new message added during conversation)
    if (messages.length > prevMessagesLengthRef.current && prevMessagesLengthRef.current > 0) {
      // This is a new message during active conversation, scroll to bottom
      scrollToBottom();
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length, scrollToBottom]);

  // Continuous scroll during streaming with proper cleanup
  useEffect(() => {
    // Clear any existing interval first
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }

    if (streamingMessageId) {
      // Initial scroll
      scrollToBottom();
      
      // Start continuous scroll every 150ms
      scrollIntervalRef.current = setInterval(scrollToBottom, 150);
    }
    
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    };
  }, [streamingMessageId, scrollToBottom]);

  // Scroll when typing indicator appears
  useEffect(() => {
    if (isBotTyping) {
      scrollToBottom();
    }
  }, [isBotTyping, scrollToBottom]);

  return { scrollToBottom, scrollToLastMessageTop };
};
