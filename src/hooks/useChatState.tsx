
import { useState, useRef } from 'react';
import { ChatMode, MessageType } from '@/components/ChatInterface';

export interface UseChatStateProps {
  initialMode: ChatMode;
  initialLength: string;
  resumedChatId: string | null;
}

export const useChatState = ({ initialMode, initialLength, resumedChatId }: UseChatStateProps) => {
  const [currentLength, setCurrentLength] = useState<string>(initialLength);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const sessionStartTime = useRef(new Date());
  const lastResumedChatId = useRef<string | null>(null);

  return {
    currentLength,
    setCurrentLength,
    isBotTyping,
    setIsBotTyping,
    streamingMessageId,
    setStreamingMessageId,
    messagesContainerRef,
    sessionStartTime,
    lastResumedChatId
  };
};
