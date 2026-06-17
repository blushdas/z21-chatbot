import { useState, useCallback } from 'react';
import { sendDualResponseRequest, logDualResponseChoice, DualResponseResponse } from '@/api/pineconeChat';
import { MessageType, ChatMode } from '@/components/ChatInterface';

interface UseDualResponseProps {
  currentMode: ChatMode;
  currentLength: string;
  messages: MessageType[];
}

export const useDualResponse = ({ currentMode, currentLength, messages }: UseDualResponseProps) => {
  const [isDualResponseMode, setIsDualResponseMode] = useState(false);
  const [pendingDualResponse, setPendingDualResponse] = useState<DualResponseResponse | null>(null);
  const [isGeneratingDualResponse, setIsGeneratingDualResponse] = useState(false);

  const toggleDualResponseMode = useCallback((enabled: boolean) => {
    console.group('🔍 useDualResponse.toggleDualResponseMode');
    console.log('Called with:', { enabled });
    console.log('Previous state:', { 
      isDualResponseMode, 
      hasPendingResponse: !!pendingDualResponse 
    });
    
    setIsDualResponseMode(enabled);
    console.log('State update queued for isDualResponseMode:', enabled);
    
    if (!enabled) {
      setPendingDualResponse(null);
      console.log('Cleared pendingDualResponse');
    }
    
    console.groupEnd();
    // Don't change scroll position when toggling
  }, [isDualResponseMode, pendingDualResponse]);

  const generateDualResponse = useCallback(async (userMessage: string) => {
    console.group('🔍 useDualResponse.generateDualResponse');
    console.log('Called with message:', userMessage.substring(0, 50) + '...');
    console.log('Current state:', { 
      isDualResponseMode, 
      messagesCount: messages.length,
      currentMode,
      currentLength
    });
    
    if (!isDualResponseMode) {
      console.warn('❌ Dual response mode is OFF - returning null');
      console.groupEnd();
      return null;
    }
    
    console.log('✅ Proceeding with dual response generation...');
    setIsGeneratingDualResponse(true);
    try {
      // Build conversation history from existing messages
      const conversationHistory = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));

      console.log('🔄 Generating dual responses...');
      const response = await sendDualResponseRequest({
        message: userMessage,
        mode: currentMode,
        length: currentLength,
        conversationHistory
      });

      console.log('✅ Dual responses generated:', response);
      console.log('Citations - A:', response.citationA, 'B:', response.citationB);
      setPendingDualResponse(response);
      return response;
    } catch (error) {
      console.error('❌ Failed to generate dual responses:', error);
      return null;
    } finally {
      setIsGeneratingDualResponse(false);
    }
  }, [isDualResponseMode, currentMode, currentLength, messages]);

  const handleUserChoice = useCallback(async (
    choice: 'a' | 'b' | 'tie',
    userMessage: string,
    chatId?: string
  ) => {
    if (!pendingDualResponse) return null;

    const pickA = choice === 'a' || choice === 'tie';
    const selected = {
      content: pickA ? pendingDualResponse.responseA : pendingDualResponse.responseB,
      sources: pickA ? (pendingDualResponse.sourcesA || []) : (pendingDualResponse.sourcesB || []),
      citation: pickA ? pendingDualResponse.citationA : pendingDualResponse.citationB,
      model: pickA ? pendingDualResponse.modelA : pendingDualResponse.modelB,
    };

    // Log the user's choice
    try {
      await logDualResponseChoice({
        chatId,
        messageQuery: userMessage,
        responseA: pendingDualResponse.responseA,
        responseB: pendingDualResponse.responseB,
        userChoice: choice,
        modelA: pendingDualResponse.modelA,
        modelB: pendingDualResponse.modelB
      });
      console.log('✅ User choice logged successfully');
    } catch (error) {
      console.error('❌ Failed to log user choice:', error);
    }

    // Clear pending dual response
    setPendingDualResponse(null);

    // Return the selected full payload for integration into chat
    return selected;
  }, [pendingDualResponse]);

  const clearPendingDualResponse = useCallback(() => {
    setPendingDualResponse(null);
  }, []);

  return {
    isDualResponseMode,
    pendingDualResponse,
    isGeneratingDualResponse,
    toggleDualResponseMode,
    generateDualResponse,
    handleUserChoice,
    clearPendingDualResponse
  };
};