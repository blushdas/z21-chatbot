import { useEffect, useRef } from 'react';
import { MessageType, ChatMode, ResponseMode } from '@/components/ChatInterface';
import { logChatLoadFailure } from '@/utils/chatLoadingLogger';
import { ModeChangeEvent } from './supabase/types';
import { isStreaming as isStreamingGlobal, getStreamingState } from '@/utils/activeStreamingTracker';

interface UseChatInitializationProps {
  initialized: boolean;
  currentChatId: string | null;
  currentChat: any;
  setCurrentMessages: (messages: MessageType[]) => void;
  setMessagesLoaded: (loaded: boolean) => void;
  setChatLoadingState: (state: 'loading' | 'loaded' | 'new') => void;
  isBotTyping?: boolean;
  streamingMessageId?: string | null;
  localMessagesCount?: number;
  setModeChangeDividers?: React.Dispatch<React.SetStateAction<Array<{id: string, mode: ChatMode, timestamp: Date}>>>;
  setModelChangeDividers?: React.Dispatch<React.SetStateAction<Array<{id: string, model: string, timestamp: Date}>>>;
  setPowerChangeDividers?: React.Dispatch<React.SetStateAction<Array<{id: string, value: string, timestamp: Date}>>>;
  setBlueprintChangeDividers?: React.Dispatch<React.SetStateAction<Array<{id: string, mode: ResponseMode, timestamp: Date}>>>;
  resumedChatId?: string | null;
  setSubPrompts?: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedModel?: React.Dispatch<React.SetStateAction<string>>;
}

export const useChatInitialization = ({
  initialized,
  currentChatId,
  currentChat,
  setCurrentMessages,
  setMessagesLoaded,
  setChatLoadingState,
  isBotTyping,
  streamingMessageId,
  localMessagesCount,
  setModeChangeDividers,
  setModelChangeDividers,
  setPowerChangeDividers,
  setBlueprintChangeDividers,
  resumedChatId,
  setSubPrompts,
  setSelectedModel
}: UseChatInitializationProps) => {
  const loadedChatIdRef = useRef<string | null>(null);
  const dividersRestoredForChatRef = useRef<string | null>(null);
  const lastStreamCompleteRef = useRef<number>(0);
  const previousBotTypingRef = useRef<boolean>(false);
  
  const effectiveChatId = resumedChatId || currentChatId;
  
  // Track streaming completion for grace period
  useEffect(() => {
    if (!isBotTyping && previousBotTypingRef.current) {
      lastStreamCompleteRef.current = Date.now();
    }
    previousBotTypingRef.current = isBotTyping || false;
  }, [isBotTyping]);

  // Clear dividers when switching chats
  useEffect(() => {
    if (effectiveChatId && effectiveChatId !== dividersRestoredForChatRef.current) {
      dividersRestoredForChatRef.current = null;
      if (setModeChangeDividers) setModeChangeDividers([]);
      if (setModelChangeDividers) setModelChangeDividers([]);
      if (setPowerChangeDividers) setPowerChangeDividers([]);
      if (setBlueprintChangeDividers) setBlueprintChangeDividers([]);
    }
  }, [effectiveChatId, setModeChangeDividers, setModelChangeDividers, setPowerChangeDividers, setBlueprintChangeDividers]);

  // MAIN EFFECT: Load messages with INSTANT path for preloaded chats
  useEffect(() => {
    if (!initialized) {
      setChatLoadingState('loading');
      return;
    }

    // Detect chat switch
    const isChatSwitch = effectiveChatId !== loadedChatIdRef.current;

    // Handle no chat / guest / temp chats
    if (!effectiveChatId || effectiveChatId.startsWith('guest-') || effectiveChatId.startsWith('temp-')) {
      setCurrentMessages([]);
      setMessagesLoaded(true);
      setChatLoadingState('new');
      loadedChatIdRef.current = effectiveChatId;
      return;
    }

    // STREAMING RESTORATION: If returning to actively streaming chat
    if (isStreamingGlobal(effectiveChatId)) {
      const streamingState = getStreamingState(effectiveChatId);
      if (streamingState?.messages.length > 0) {
        setCurrentMessages(streamingState.messages);
        setMessagesLoaded(true);
        setChatLoadingState('loaded');
        loadedChatIdRef.current = effectiveChatId;
        return;
      }
    }

    // ⚡ INSTANT LOAD PATH: For chat switches when data is already available
    if (isChatSwitch && currentChat?.id === effectiveChatId && currentChat?.messages) {
      const messages = currentChat.messages;
      
      // Convert messages with proper timestamps
      const messagesWithDates = messages.map((msg: MessageType, index: number) => {
        let timestamp = msg.timestamp;
        if (!timestamp || 
            (typeof timestamp === 'object' && Object.keys(timestamp).length === 0) ||
            (typeof timestamp === 'string' && isNaN(new Date(timestamp).getTime()))) {
          timestamp = currentChat.created_at;
        }
        return {
          ...msg,
          timestamp: timestamp instanceof Date ? timestamp : new Date(timestamp),
          chatId: effectiveChatId,
          messageIndex: index
        };
      });
      
      setCurrentMessages(messagesWithDates);
      setMessagesLoaded(true);
      loadedChatIdRef.current = effectiveChatId;
      setChatLoadingState(messages.length > 0 ? 'loaded' : 'new');
      
      // Restore dividers
      restoreDividers(currentChat, effectiveChatId);
      return;
    }

    // WAITING STATE: Chat switch but data not synced yet
    if (isChatSwitch && (!currentChat || currentChat.id !== effectiveChatId)) {
      setCurrentMessages([]); // Clear messages immediately to prevent duplication
      setChatLoadingState('loading');
      setMessagesLoaded(false);
      return;
    }

    // REAL-TIME UPDATE PATH: Only runs after initial load, with guards
    if (!isChatSwitch && loadedChatIdRef.current === effectiveChatId) {
      // Guard: Don't overwrite during streaming (active streamingMessageId OR typing indicator)
      if (isBotTyping || streamingMessageId) return;
      
      // Guard: Grace period after streaming
      const timeSinceStreamComplete = Date.now() - lastStreamCompleteRef.current;
      if (lastStreamCompleteRef.current > 0 && timeSinceStreamComplete < 2000) return;
      
      // Guard: Don't overwrite if local has more messages
      if (localMessagesCount && currentChat?.messages?.length < localMessagesCount) return;
      
      // Apply real-time update
      if (currentChat?.messages) {
        const messagesWithDates = currentChat.messages.map((msg: MessageType, index: number) => {
          let timestamp = msg.timestamp;
          if (!timestamp || 
              (typeof timestamp === 'object' && Object.keys(timestamp).length === 0) ||
              (typeof timestamp === 'string' && isNaN(new Date(timestamp).getTime()))) {
            timestamp = currentChat.created_at;
          }
          return {
            ...msg,
            timestamp: timestamp instanceof Date ? timestamp : new Date(timestamp),
            chatId: effectiveChatId,
            messageIndex: index
          };
        });
        setCurrentMessages(messagesWithDates);
      }
    }

    // Helper function to restore mode/model dividers
    function restoreDividers(chat: any, chatId: string) {
      if (dividersRestoredForChatRef.current === chatId) {
        return;
      }

      const events = Array.isArray(chat.mode_change_events)
        ? chat.mode_change_events as ModeChangeEvent[]
        : [];
      const chatMessages = Array.isArray(chat.messages) ? chat.messages as MessageType[] : [];
      
      if (setModeChangeDividers) {
        const modeDividers = events
          .filter(e => e.type === 'mode')
          .map(e => ({
            id: e.id,
            mode: e.value as ChatMode,
            timestamp: new Date(e.timestamp)
          }));
        setModeChangeDividers(modeDividers);
      }
      
      if (setModelChangeDividers) {
        const modelDividers = events
          .filter(e => e.type === 'model')
          .map(e => ({
            id: e.id,
            model: e.value,
            timestamp: new Date(e.timestamp)
          }));
        setModelChangeDividers(modelDividers);
      }

      if (setPowerChangeDividers) {
        const powerDividers = events
          .filter(e => e.type === 'power')
          .map(e => ({
            id: e.id,
            value: e.value,
            timestamp: new Date(e.timestamp)
          }));
        setPowerChangeDividers(powerDividers);
      }

      if (setBlueprintChangeDividers) {
        const blueprintDividers = events
          .filter(e => e.type === 'blueprint')
          .map(e => ({
            id: e.id,
            mode: e.value as ResponseMode,
            timestamp: new Date(e.timestamp)
          }));
        setBlueprintChangeDividers(blueprintDividers);
      }
      
      // Restore current mode from last event, or infer from last saved message.
      if (setSubPrompts) {
        const modeEvents = events.filter(e => e.type === 'mode');
        if (modeEvents.length > 0) {
          setSubPrompts([modeEvents[modeEvents.length - 1].value]);
        } else {
          const inferredMode = [...chatMessages].reverse().find(m => m.responseStyle)?.responseStyle;
          if (inferredMode) setSubPrompts([inferredMode]);
        }
      }
      
      // Restore current model from last event, or infer from last saved message.
      if (setSelectedModel) {
        const modelEvents = events.filter(e => e.type === 'model');
        if (modelEvents.length > 0) {
          setSelectedModel(modelEvents[modelEvents.length - 1].value);
        } else {
          const inferredModel = [...chatMessages].reverse().find(m => m.model)?.model;
          if (inferredModel) setSelectedModel(inferredModel);
        }
      }
      
      dividersRestoredForChatRef.current = chatId;
    }
  }, [
    effectiveChatId,
    currentChat?.id,
    currentChat?.messages,
    currentChat?.mode_change_events,
    currentChat?.created_at,
    initialized,
    isBotTyping,
    localMessagesCount,
    setCurrentMessages,
    setMessagesLoaded,
    setChatLoadingState,
    setModeChangeDividers,
    setModelChangeDividers,
    setPowerChangeDividers,
    setBlueprintChangeDividers,
    setSubPrompts,
    setSelectedModel
  ]);

  // Safety timeout for edge cases
  useEffect(() => {
    if (!effectiveChatId || effectiveChatId.startsWith('guest-') || effectiveChatId.startsWith('temp-')) {
      return;
    }
    
    const timeout = setTimeout(async () => {
      if (loadedChatIdRef.current !== effectiveChatId && currentChat?.messages?.length > 0) {
        console.warn('⚠️ Safety valve: forcing load after 500ms');
        setMessagesLoaded(true);
        loadedChatIdRef.current = effectiveChatId;
        setChatLoadingState('loaded');
      }
    }, 500);
    
    return () => clearTimeout(timeout);
  }, [effectiveChatId, currentChat?.messages?.length, setMessagesLoaded, setChatLoadingState]);
};
