import { useCallback } from 'react';
import { MessageType, ChatMode } from '@/components/ChatInterface';
import { useDualResponse } from '@/hooks/useDualResponse';

interface UseDualResponseHandlerProps {
  currentChatId: string | null;
  messages: MessageType[];
  currentMode: ChatMode;
  currentLength: string;
  onMessagesUpdate: (messages: MessageType[]) => void;
  saveChat: (chatId: string, messages: MessageType[], mode: ChatMode) => Promise<void>;
  createNewChat: (mode?: ChatMode) => Promise<string>;
  dualResponse: ReturnType<typeof useDualResponse>;
  setIsBotTyping: (typing: boolean) => void;
}

export const useDualResponseHandler = ({
  currentChatId,
  messages,
  currentMode,
  currentLength,
  onMessagesUpdate,
  saveChat,
  createNewChat,
  dualResponse,
  setIsBotTyping
}: UseDualResponseHandlerProps) => {

  const handleDualResponseMessage = useCallback(async (content: string) => {
    console.group('🔍 useDualResponseHandler.handleDualResponseMessage');
    console.log('Handler invoked with:', { 
      contentLength: content.length,
      contentPreview: content.substring(0, 50) + '...',
      timestamp: new Date().toISOString()
    });
    
    if (!content.trim()) {
      console.warn('❌ Empty content - returning false');
      console.groupEnd();
      return false;
    }

    console.log('🔄 Dual response mode: generating two responses...');
    
    // Show "daryle is thinking" indicator
    setIsBotTyping(true);

    // Ensure we have a chat ID
    let chatId = currentChatId;
    if (!chatId) {
      console.log('⚠️ No current chat ID - creating new chat for dual response');
      chatId = await createNewChat(currentMode);
    }

    // Create user message
    // Note: Dual response typically uses standard mode, but we could pass these as params if needed
    const userMessage: MessageType = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sender: "user",
      content,
      timestamp: new Date(),
      mode: currentMode,
      chatId: chatId,
      // Dual response uses standard mode by default
      responseStyle: 'standard',
      // Model will be varied per response in the dual response logic
    };

    // Update messages immediately with user message
    const updatedMessages = [...messages, userMessage];
    onMessagesUpdate(updatedMessages);

    // Save user message
    if (chatId && !chatId.startsWith('guest-') && !chatId.startsWith('temp-')) {
      try {
        await saveChat(chatId, updatedMessages, currentMode);
        console.log('✅ User message saved for dual response');
      } catch (error) {
        console.error('❌ Failed to save user message:', error);
      }
    }

    // Generate dual responses
    const dualResponseResult = await dualResponse.generateDualResponse(content);
    
    // Hide thinking indicator with fade animation
    setIsBotTyping(false);
    
    if (dualResponseResult) {
      console.log('✅ Dual responses generated successfully');
      return true; // Indicates dual response was handled
    } else {
      console.error('❌ Failed to generate dual responses');
      return false;
    }
  }, [currentChatId, messages, currentMode, currentLength, onMessagesUpdate, saveChat, createNewChat, dualResponse, setIsBotTyping]);

  return {
    handleDualResponseMessage
  };
};