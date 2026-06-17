
import { useCallback, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { MessageType, ChatMode, ResponseMode } from '@/components/ChatInterface';
import { streamPineconeChatMessage, streamRoutedChatMessage, ThinkingStep, isTimeoutError, isStallError, isNetworkError, isRateLimitError, isUserAbortError } from '@/api/pineconeChat';
import { usePersistentSaveQueue } from '@/hooks/usePersistentSaveQueue';
import { useSaveStatusIndicator } from '@/hooks/useSaveStatusIndicator';
import { markStreaming, clearStreaming, updateStreamingContent } from '@/utils/activeStreamingTracker';
import { useAuth } from '@/context/SupabaseAuthContext';
import { track } from '@/lib/analytics';
import { readPower, readPowerOverride, readKb, readKbOverride } from '@/lib/chatDefaults';

// Declare TruConversion global variable
declare global {
  interface Window {
    _tip: any[];
  }
  var _tip: any[];
}

interface ModeChangeEvent {
  id: string;
  type: 'mode' | 'model' | 'power' | 'blueprint';
  value: string;
  timestamp: string;
}

interface UseChatHandlersProps {
  currentChatId: string | null;
  messages: MessageType[];
  currentMode: ChatMode;
  currentLength: string;
  responseMode: ResponseMode;
  subPrompts: string[];
  modelOverride?: string; // Model selection
  useKnowledgebase?: boolean; // When false, bypass Pinecone RAG
  createNewChat: (mode?: ChatMode) => Promise<string>;
  saveChat: (chatId: string, messages: MessageType[], mode: ChatMode, modeChangeEvents?: ModeChangeEvent[]) => Promise<void>;
  setIsBotTyping: (isTyping: boolean) => void;
  setStreamingMessageId: (id: string | null) => void;
  onMessagesUpdate: (messages: MessageType[]) => void;
  setCurrentChatId: (chatId: string | null) => void;
  setTypingHiding?: (isHiding: boolean) => void;
  onResponseComplete?: () => void; // Callback when response is complete
  onSaveStatusChange?: (status: 'idle' | 'saving' | 'success' | 'error') => void;
  getModeChangeEvents?: () => ModeChangeEvent[]; // Get current mode/model change events for persistence
  chatTitle?: string; // Current chat title for toast notifications
  folderInstructions?: string; // Project-specific instructions for the folder this chat belongs to
  folderId?: string | null; // When the chat belongs to a folder, used to scope folder-KB Pinecone retrieval
}

export const useChatHandlers = ({
  currentChatId,
  messages,
  currentMode,
  currentLength,
  responseMode,
  subPrompts,
  modelOverride,
  useKnowledgebase = true,
  folderInstructions,
  folderId,
  createNewChat,
  saveChat,
  setIsBotTyping,
  setStreamingMessageId,
  onMessagesUpdate,
  setCurrentChatId,
  setTypingHiding,
  onResponseComplete,
  onSaveStatusChange,
  getModeChangeEvents,
  chatTitle
}: UseChatHandlersProps) => {
  const navigate = useNavigate();
  const { profile: authProfile } = useAuth();
  const userInstructions = (authProfile?.custom_instructions || '').trim() || undefined;
  const [manualSaveInProgress, setManualSaveInProgress] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const { status: saveStatus, setSaving, setSuccess, setError } = useSaveStatusIndicator();
  
  // Initialize persistent save queue
  const { queueSave, clearQueueForChat, saveStatus: queueStatus } = usePersistentSaveQueue(saveChat);
  
  // ✅ FIX: Store streaming state in ref for cleanup access
  const streamingStateRef = useRef<{
    chatId: string | null;
    messages: MessageType[];
    mode: ChatMode;
    isStreaming: boolean;
  }>({ chatId: null, messages: [], mode: 'coach', isStreaming: false });
  
  // Ref for delayed thinking indicator timeout
  const thinkingDelayRef = useRef<NodeJS.Timeout | null>(null);
  
  // ✅ NEW: AbortController ref for user-initiated stream cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Update parent component with save status
  useEffect(() => {
    onSaveStatusChange?.(saveStatus);
  }, [saveStatus, onSaveStatusChange]);
  
  // Also monitor queue status
  useEffect(() => {
    onSaveStatusChange?.(queueStatus);
  }, [queueStatus, onSaveStatusChange]);
  

  const sendInProgressRef = useRef(false);

  const handleSendMessage = useCallback(async (
    content: string,
    attachments?: Array<{
      fileId: string;
      fileName: string;
      parsedText?: string;
      imageBase64?: string;
      fileType?: string;
      pageCount?: number;
    }>,
    sharpenMeta?: { wasSharpened: boolean; originalPrompt: string }
  ) => {
    if (!content.trim()) return;
    if (sendInProgressRef.current) return;
    sendInProgressRef.current = true;

    const flowStartTime = Date.now();
    const selectedModelForRequest = modelOverride ?? 'grounded';
    const selectedPowerForRequest = readPowerOverride(currentChatId) ?? readPower();
    const knowledgeBaseEnabled = useKnowledgebase;
    const rawModelOnly = false;
    const skipPrompts = Array.isArray(subPrompts) && subPrompts[0] === 'noBlueprints';

    track({
      event_name: 'chat.message_sent',
      category: 'chat',
      chat_id: currentChatId,
      mode: currentMode,
      model: selectedModelForRequest,
      processing_power: selectedPowerForRequest,
      response_mode: responseMode,
      properties: {
        message_length: content.length,
        files_count: attachments?.length || 0,
        sharpen_prompt_used: !!sharpenMeta?.wasSharpened,
        knowledgebase: knowledgeBaseEnabled,
        raw_model_only: rawModelOnly,
        skip_prompts: skipPrompts,
        length_pref: currentLength,
        is_first_message: messages.length === 0,
      },
    });

    console.log('🚀 FLOW START: User input received', {
      content: content.substring(0, 100) + '...',
      mode: currentMode,
      length: currentLength,
      responseMode,
      subPrompts,
      selectedModel: selectedModelForRequest,
      selectedPower: selectedPowerForRequest,
      knowledgeBaseEnabled,
      rawModelOnly,
      currentChatId,
      attachments: attachments?.length || 0,
      startTime: new Date().toISOString()
    });

    // TruConversion trigger for chat started (first message in a new chat)
    if (messages.length === 0) {
      try {
        if (typeof _tip !== 'undefined') {
          _tip.push(['trigger', 'chat-started']);
          console.log('📊 TruConversion: Chat started trigger fired');
        }
      } catch (error) {
        console.log('📊 TruConversion trigger not available:', error);
      }
    }

    // Set manual save flag to prevent auto-save conflicts
    setManualSaveInProgress(true);

    // Ensure we have a chat ID - should already exist from initial creation
    let chatId = currentChatId;
    if (!chatId) {
      console.error('🚨 CRITICAL: No current chat ID at message send - this should not happen!');
      console.error('User should have been redirected to a proper chat URL before sending messages');
      
      // Fallback: Create chat and update URL
      chatId = await createNewChat(currentMode);
      setCurrentChatId(chatId);
      navigate(`/chat/${chatId}`, { replace: true });
    }

    // Create user message with chatId
    const messageCreationTime = Date.now();
    console.log(`⏱️ TIMING: Message creation (${messageCreationTime - flowStartTime}ms)`);
    
    // Derive responseStyle from subPrompts array
    const responseStyle = subPrompts.includes('quickAnswer') 
      ? 'quickAnswer' as const
      : subPrompts.includes('directQuotes')
        ? 'directQuotes' as const
        : subPrompts.includes('storytelling')
          ? 'storytelling' as const
          : subPrompts.includes('noBlueprints')
            ? 'noBlueprints' as const
            : 'standard' as const; // Default to standard
    
    const userMessage: MessageType = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sender: "user",
      content,
      timestamp: new Date(),
      mode: currentMode,
      chatId: chatId, // Include chatId in the message
      // Capture settings at time of sending
      responseStyle,
      model: selectedModelForRequest as MessageType['model'],
      knowledgeBaseEnabled,
      ...(sharpenMeta?.wasSharpened ? { wasSharpened: true, originalPrompt: sharpenMeta.originalPrompt } : {}),
    };

    // Update messages immediately with user message
    const updatedMessages = [...messages, userMessage];
    onMessagesUpdate(updatedMessages);

    // ── Attachments ───────────────────────────────────────────────────────
    // Filter to only attachments that have content to send (text or image).
    const resolvedAttachments = (attachments ?? []).filter(
      (a) => a.parsedText?.trim() || a.imageBase64,
    );

    if (attachments && attachments.length > 0 && resolvedAttachments.length === 0) {
      const errMsg: MessageType = {
        id: `bot-${Date.now()}-files-not-ready`,
        sender: "daryle",
        content: "I can see a file attached, but it has no readable content. Re-upload the file and wait for it to show as ready.",
        timestamp: new Date(),
        mode: currentMode,
        chatId,
        intent: "guidance",
      } as MessageType;
      const finalMessages = [...updatedMessages, errMsg];
      onMessagesUpdate(finalMessages);
      if (chatId && !chatId.startsWith("guest-") && !chatId.startsWith("temp-")) {
        saveChat(chatId, finalMessages, currentMode, getModeChangeEvents?.()).catch(() => {});
      }
      setManualSaveInProgress(false);
      sendInProgressRef.current = false;
      return;
    }

    // Stamp resolved attachments onto the user message so the bubble shows chips.
    if (resolvedAttachments.length > 0) {
      (userMessage as any).attachedFiles = resolvedAttachments.map((a) => ({
        fileId: a.fileId,
        fileName: a.fileName,
        fileType: a.fileType,
        pageCount: a.pageCount,
        imageBase64: a.imageBase64,
      }));
      onMessagesUpdate([...updatedMessages]);
    }
    // ──────────────────────────────────────────────────────────────────────

    const uiUpdateTime = Date.now();
    console.log(`⏱️ TIMING: UI update with user message (${uiUpdateTime - messageCreationTime}ms)`)

    // Start typing indicator with 500ms delay for natural feel
    // Clear any existing timeout first
    if (thinkingDelayRef.current) {
      clearTimeout(thinkingDelayRef.current);
    }
    thinkingDelayRef.current = setTimeout(() => {
      console.log('🐛 DEBUG: Setting isBotTyping to TRUE (after 1.5s delay)');
      setIsBotTyping(true);
    }, 1500);

    // ✅ CRITICAL FIX: Mark streaming IMMEDIATELY before API call starts
    // This prevents ChatInterface's chat-switch effect from resetting isBotTyping
    // when navigation occurs (the effect checks isStreamingGlobal before resetting)
    if (chatId) {
      markStreaming(chatId, {
        chatId,
        messages: updatedMessages,
        accumulatedContent: '',
        streamingMessageId: null, // Will be set when bot message is created
        mode: currentMode,
        chatTitle: chatTitle || 'New Chat'
      });
    }

    try {
      // NON-BLOCKING SAVE: Fire-and-forget to move chat to top in sidebar
      // The authoritative save happens in onComplete after streaming finishes
      if (chatId && !chatId.startsWith('guest-') && !chatId.startsWith('temp-')) {
        setSaving();
        saveChat(chatId, updatedMessages, currentMode, getModeChangeEvents?.())
          .then(() => {
            console.log('✅ MANUAL SAVE: User message saved successfully');
            setSuccess();
          })
          .catch((error) => {
            console.error('❌ MANUAL SAVE: Failed, queuing for retry:', error);
            setError();
            queueSave(chatId, updatedMessages, currentMode, 'high');
          });
      }

      const apiCallStartTime = Date.now();
      console.log(`⏱️ TIMING: Pre-API setup (${apiCallStartTime - uiUpdateTime}ms)`);
      console.log('📤 Starting STREAMING Pinecone RAG API with subPrompts:', subPrompts);
      
      // Build conversation history from existing messages (excluding current user message).
      // Raw mode keeps user turns but drops KB-grounded assistant turns so Daryle voice,
      // citations, and retrieved facts do not contaminate the raw model context.
      const conversationHistory = messages
        .filter(msg => msg.sender === 'user' || msg.sender === 'daryle')
        .slice(-35)
        .filter(msg => {
          if (!rawModelOnly) return true;
          if (msg.sender === 'user') return true;
          return msg.knowledgeBaseEnabled === false;
        })
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        }));
      
      console.log('💬 Sending conversation history:', conversationHistory.length, 'previous messages', { rawModelOnly });
      
      // Fast mode for Instant tier - reduces context, tokens, and query matches
      const fastMode = selectedPowerForRequest === 'instant' || (
        selectedPowerForRequest === 'auto' && (selectedModelForRequest === 'grounded' || selectedModelForRequest === 'auto')
      );
      console.log(`⚡ Fast mode ${fastMode ? 'ENABLED (Instant tier)' : 'disabled'} for this request`);
      
      // Clear thinking steps for new message
      setThinkingSteps([]);
      
      // Accumulated content and metadata
      let accumulatedContent = '';
      let metadata: any = null;
      
      // Track first chunk for typing indicator fade-out and bot message creation
      let firstChunk = true;
      let typingHideTriggered = false;
      let botMessageCreated = false;
      let streamingBotMessageId = '';
      
      // Keep track of current messages (starts with just user message)
      let currentMessages = [...updatedMessages];
      
      // ✅ FIX: Update streaming state ref for emergency saves (will be updated when bot message is created)
      streamingStateRef.current = {
        chatId: chatId,
        messages: currentMessages,
        mode: currentMode,
        isStreaming: true
      };
      
      // ✅ NEW: Create abort controller for user cancellation
      abortControllerRef.current = new AbortController();

      // Determine if this is a routed request (new route values) vs legacy model selection
      const ROUTE_VALUES = ['auto', 'chatgpt', 'claude', 'chatgpt-claude', 'gemini', 'pro'];
      const isRoutedRequest = ROUTE_VALUES.includes(selectedModelForRequest);

      const streamFn = isRoutedRequest ? streamRoutedChatMessage : streamPineconeChatMessage;

      // Call streaming API with external signal
      await streamFn(
        {
          message: content,
          mode: currentMode,
          length: currentLength,
          responseMode,
          subPrompts,
          conversationHistory,
          chatId: chatId || undefined,
          fastMode,
          debugMode: true,
          processingPower: selectedPowerForRequest,
          skipRAG: !knowledgeBaseEnabled,
          rawModelOnly,
          skipPrompts,
          modelOverride: isRoutedRequest ? undefined : selectedModelForRequest,
          ...(isRoutedRequest ? { routeSelection: selectedModelForRequest } : {}),
          ...(folderInstructions && !rawModelOnly && !skipPrompts ? { folderInstructions } : {}),
          ...(userInstructions && !rawModelOnly && !skipPrompts ? { userInstructions } : {}),
          // Defensive: never send folderId when the knowledge base is off,
          // even if upstream forgets to null it. Without this, the edge
          // function would still run a folder-scoped Pinecone query.
          ...(folderId && knowledgeBaseEnabled ? { folderId } : {}),
          ...(resolvedAttachments.length > 0 ? { attachments: resolvedAttachments } : {}),
          ...(knowledgeBaseEnabled ? { kbSources: (readKbOverride(chatId) ?? readKb()) as string[] } : {}),
        },
        // onChunk - progressive updates
        (chunk: string) => {
          // ✅ FIX: Create bot message on FIRST chunk (not before streaming starts)
          // This prevents ThinkingDropdown from jumping when empty message is added
          if (!botMessageCreated) {
            const streamingBotMessage: MessageType = {
              id: `bot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              sender: "daryle",
              content: chunk, // Start with first chunk content
              timestamp: new Date(),
              mode: currentMode,
              chatId: chatId,
              intent: 'guidance',
              responseStyle,
              model: selectedModelForRequest as MessageType['model'],
              knowledgeBaseEnabled,
              processingPower: selectedPowerForRequest as MessageType['processingPower'],
              ...(resolvedAttachments.length > 0 ? {
                attachedFiles: resolvedAttachments.map((a) => ({
                  fileId: a.fileId,
                  fileName: a.fileName,
                  fileType: a.fileType,
                  pageCount: a.pageCount,
                  imageBase64: a.imageBase64,
                })),
              } : {}),
            };
            
            streamingBotMessageId = streamingBotMessage.id;
            botMessageCreated = true;
            accumulatedContent = chunk;
            
            // Add bot message to array
            currentMessages = [...currentMessages, streamingBotMessage];
            onMessagesUpdate(currentMessages);
            
            // Set streaming message ID to trigger auto-scroll
            setStreamingMessageId(streamingBotMessage.id);
            
            // Mark chat as streaming globally
            if (chatId) {
              markStreaming(chatId, {
                chatId,
                messages: currentMessages,
                accumulatedContent,
                streamingMessageId: streamingBotMessage.id,
                mode: currentMode,
                chatTitle: chatTitle || 'New Chat'
              });
            }
            
            // Update streaming state ref
            streamingStateRef.current = {
              chatId: chatId,
              messages: currentMessages,
              mode: currentMode,
              isStreaming: true
            };
          } else {
            // Subsequent chunks - just accumulate content
            accumulatedContent += chunk;
            
            // Update the message with accumulated content
            currentMessages = currentMessages.map(msg =>
              msg.id === streamingBotMessageId
                ? { ...msg, content: accumulatedContent }
                : msg
            );
            
            // Update local state
            onMessagesUpdate(currentMessages);
          }
          
          // ✅ CRITICAL: Always update global tracker (survives navigation)
          if (chatId) {
            updateStreamingContent(chatId, accumulatedContent, currentMessages, streamingBotMessageId);
          }
          
          // Hide typing indicator on first chunk
          if (firstChunk && setTypingHiding && !typingHideTriggered) {
            console.log('🐛 DEBUG: First chunk received - triggering typing indicator fade-out');
            
            // Clear thinking delay timeout (in case response arrived before 500ms)
            if (thinkingDelayRef.current) {
              clearTimeout(thinkingDelayRef.current);
              thinkingDelayRef.current = null;
            }
            
            setTypingHiding(true);
            // ✅ FIX: Set isBotTyping false immediately to prevent race conditions on remount
            setIsBotTyping(false);
            typingHideTriggered = true;
            
            // Reset typingHiding after fade animation completes
            setTimeout(() => {
              if (setTypingHiding) setTypingHiding(false);
            }, 300);
            
            firstChunk = false;
          }
        },
        // onMetadata - save sources and attach immediately for real-time citation rendering
        (meta: any) => {
          console.log('📥 Received metadata:', meta);
          metadata = meta;

          // CRITICAL FIX: Attach sources to message immediately
          // This allows citations to be parsed and rendered in real-time as text streams
          currentMessages = currentMessages.map(msg =>
            msg.id === streamingBotMessageId
              ? {
                  ...msg,
                  sources: meta?.sources,
                  citation: meta?.citation,
                  intent: meta?.intent,
                  ...(meta?.routeMetadata ? { routeMetadata: meta.routeMetadata } : {})
                }
              : msg
          );
          onMessagesUpdate(currentMessages);
        },
        // onComplete - finalize message
        async () => {
          const apiCallEndTime = Date.now();
          console.log(`⏱️ TIMING: Streaming completed (${apiCallEndTime - apiCallStartTime}ms)`);
          
          // Build final messages array with metadata
          const finalMessages = currentMessages.map(msg =>
            msg.id === streamingBotMessageId 
              ? { 
                  ...msg, 
                  content: accumulatedContent || "I apologize, but I couldn't generate a response right now.",
                  citation: metadata?.citation,
                  sources: metadata?.sources,
                  intent: metadata?.intent || 'guidance'
                } 
              : msg
          );
          
          // Update with final message
          onMessagesUpdate(finalMessages);
          
          // Clear streaming state FIRST (before save attempt)
          // This ensures UI unblocks immediately regardless of save success/failure
          setStreamingMessageId(null);
          
          // ✅ CRITICAL FIX: Clear streaming state IMMEDIATELY before save
          // This prevents effects from re-enabling typing state via isStreaming() checks
          console.log('🧹 Clearing streaming state before save');
          streamingStateRef.current.isStreaming = false;
          setIsBotTyping(false);
          if (chatId) {
            clearStreaming(chatId, chatTitle);
          }
          
          // Trigger response completion callback
          if (onResponseComplete) {
            onResponseComplete();
          }
          
          // THEN save to database (this can fail without blocking UI)
          if (chatId && !chatId.startsWith('guest-') && !chatId.startsWith('temp-')) {
            console.log('💾 SAVING COMPLETE CONVERSATION:', {
              chatId,
              messageCount: finalMessages.length,
              senders: finalMessages.map(m => m.sender),
              userMessageLength: userMessage.content.length,
              botMessageLength: accumulatedContent.length,
              hasSources: !!metadata?.sources,
              hasCitation: !!metadata?.citation
            });
            
            // Clear any pending partial saves before authoritative save
            console.log('🧹 Clearing pending saves for chat before final save');
            clearQueueForChat(chatId);
            
            setSaving();
            try {
              // Direct save with full content - this is the ONLY authoritative save
              await saveChat(chatId, finalMessages, currentMode, getModeChangeEvents?.());
              console.log('✅ SAVE VERIFIED: Complete response saved', {
                botContentLength: accumulatedContent.length,
                messageCount: finalMessages.length
              });
              setSuccess();
            } catch (error) {
              console.error('❌ SAVE FAILED:', error);
              setError();
              // Only queue as fallback on error
              queueSave(chatId, finalMessages, currentMode, 'high');
            }
          }
          
          const flowEndTime = Date.now();
          console.log(`🏁 FLOW COMPLETE: Total time ${flowEndTime - flowStartTime}ms`);
        },
        // onError - handle errors with user-friendly messages
        (error: Error) => {
          console.error('❌ Error in streaming Pinecone chat:', error);
          
          // ✅ FIX: Clear thinking delay timeout to prevent typing indicator from showing after error
          if (thinkingDelayRef.current) {
            clearTimeout(thinkingDelayRef.current);
            thinkingDelayRef.current = null;
          }
          
          // ✅ Handle user-initiated cancellation differently
          if (isUserAbortError(error)) {
            console.log('🛑 User cancelled generation - preserving partial content');
            
            // Notify user that generation was stopped
            toast.info('Response stopped', {
              description: 'The response was stopped. Any partial content has been saved.',
              duration: 4000
            });
            
            // Mark the current bot message as stopped (if it exists)
            const stoppedMessages = currentMessages.map(msg =>
              msg.id === streamingBotMessageId
                ? { ...msg, intent: 'stopped' }
                : msg
            );
            
            // Clear streaming state
            setIsBotTyping(false);
            setStreamingMessageId(null);
            if (chatId) {
              clearStreaming(chatId, chatTitle);
            }
            streamingStateRef.current.isStreaming = false;
            abortControllerRef.current = null;
            
            // Update messages with stopped intent
            onMessagesUpdate(stoppedMessages);
            
            // Save partial content
            if (currentChatId && !currentChatId.startsWith('guest-') && !currentChatId.startsWith('temp-')) {
              saveChat(currentChatId, stoppedMessages, currentMode, getModeChangeEvents?.()).catch(saveError => {
                console.error('❌ Failed to save stopped state:', saveError);
              });
            }
            
            return; // Don't create error message for user cancellation
          }
          
          setError();
          
          // Generate user-friendly error message based on error type
          let userFriendlyMessage: string;
          
          if (isTimeoutError(error) || isStallError(error)) {
            userFriendlyMessage = "I'm sorry, but my response is taking longer than expected. Please try asking again — sometimes complex questions need a moment to process.";
          } else if (isRateLimitError(error)) {
            userFriendlyMessage = "I'm currently experiencing high demand. Please wait a moment and try again.";
          } else if (isNetworkError(error)) {
            userFriendlyMessage = "I'm having trouble connecting right now. Please check your internet connection and try again.";
          } else if (error.message.includes('Authentication')) {
            userFriendlyMessage = "Your session may have expired. Please refresh the page and try again.";
          } else {
            userFriendlyMessage = "I apologize, but I couldn't complete your request. Please try again.";
          }
          
          // Create error message
          const errorMessage: MessageType = {
            id: `bot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            sender: "daryle",
            content: userFriendlyMessage,
            timestamp: new Date(),
            mode: currentMode,
            chatId: chatId,
            intent: 'error',
            responseStyle,
            model: selectedModelForRequest as MessageType['model'],
            knowledgeBaseEnabled
          };

          // Clear streaming state
          setIsBotTyping(false);
          setStreamingMessageId(null);
          if (chatId) {
            clearStreaming(chatId);
          }
          streamingStateRef.current.isStreaming = false;
          abortControllerRef.current = null;

          const errorMessages = [...updatedMessages, errorMessage];
          onMessagesUpdate(errorMessages);

          // Try to save error state
          if (currentChatId && !currentChatId.startsWith('guest-') && !currentChatId.startsWith('temp-')) {
            saveChat(currentChatId, errorMessages, currentMode, getModeChangeEvents?.()).catch(saveError => {
              console.error('❌ Failed to save error state:', saveError);
            });
          }

          // Clear typing indicator and streaming tracker
          console.log('🐛 DEBUG: Setting isBotTyping to FALSE after error');
          setIsBotTyping(false);
          setStreamingMessageId(null);
          if (chatId) {
            clearStreaming(chatId);
          }
        },
        // onIncrementalSave - not used here, handled in onChunk
        undefined,
        // onThinking - handle thinking/progress updates
        (step: ThinkingStep) => {
          console.log('🧠 Thinking step:', step.step, step.detail || '');
          setThinkingSteps(prev => [...prev, step]);
        },
        // externalSignal - for user-initiated cancellation
        abortControllerRef.current?.signal
      );
      
      // Clear abort controller after completion
      abortControllerRef.current = null;

    } catch (error) {
      console.error('❌ Error in Pinecone chat:', error);
      
      // ✅ FIX: Clear thinking delay timeout to prevent typing indicator from showing after error
      if (thinkingDelayRef.current) {
        clearTimeout(thinkingDelayRef.current);
        thinkingDelayRef.current = null;
      }
      
      // Create error message with chatId
      const errorMessage: MessageType = {
        id: `bot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sender: "daryle",
        content: "I apologize, but I encountered an error while processing your request. Please try again.",
        timestamp: new Date(),
        mode: currentMode,
        chatId: chatId, // Include chatId in error message too
        intent: 'error',
        // Include metadata even for error messages
        responseStyle,
        model: selectedModelForRequest as MessageType['model'],
        knowledgeBaseEnabled,
      };

      const errorMessages = [...updatedMessages, errorMessage];
      onMessagesUpdate(errorMessages);

      // Try to save error state as well
      if (currentChatId && !currentChatId.startsWith('guest-') && !currentChatId.startsWith('temp-')) {
        try {
          await saveChat(currentChatId, errorMessages, currentMode, getModeChangeEvents?.());
        } catch (saveError) {
          console.error('❌ Failed to save error state:', saveError);
        }
      }

      // Clear typing indicator on error as well
      console.log('🐛 DEBUG: Setting isBotTyping to FALSE after error');
      console.log('🔄 Clearing typing indicator after error');
      setIsBotTyping(false);
      setStreamingMessageId(null);
      if (chatId) {
        clearStreaming(chatId);
      }
    } finally {
      // Final cleanup
      sendInProgressRef.current = false;
      setManualSaveInProgress(false);
      console.log('🏁 Chat handler cleanup completed');
    }
  }, [
    messages,
    currentMode,
    currentLength,
    responseMode,
    subPrompts,
    modelOverride,
    useKnowledgebase,
    currentChatId,
    chatTitle,
    createNewChat,
    saveChat,
    queueSave,
    clearQueueForChat,
    setSaving,
    setSuccess,
    setError,
    setIsBotTyping,
    setStreamingMessageId,
    setTypingHiding,
    onMessagesUpdate,
    onResponseComplete,
    getModeChangeEvents,
    setCurrentChatId,
    navigate
  ]);

  // ✅ CENTRALIZED: Single function for new chat session creation
  const startNewChatSession = useCallback(async (): Promise<string> => {
    console.log('🆕 Starting new chat session - centralized logic');
    setIsBotTyping(false);
    setStreamingMessageId(null);
    setManualSaveInProgress(false);
    
    // Create new chat via Supabase
    const newChatId = await createNewChat(currentMode);
    
    // Update state immediately
    setCurrentChatId(newChatId);
    
    // Navigate to new chat URL immediately
    navigate(`/chat/${newChatId}`, { replace: true });
    
    console.log('✅ New chat session created and navigated:', newChatId);
    return newChatId;
  }, [createNewChat, currentMode, setCurrentChatId, navigate, setIsBotTyping, setStreamingMessageId]);

  // LEGACY: Keep for backward compatibility
  const handleStartNewChat = useCallback(async () => {
    return await startNewChatSession();
  }, [startNewChatSession]);

  const handleStreamComplete = useCallback(() => {
    console.log('🐛 DEBUG: handleStreamComplete called - but typing should already be cleared');
    // Don't clear typing here anymore - it's handled in the main flow
    setManualSaveInProgress(false);
  }, []);

  // ✅ NEW: Stop generation handler - allows user to cancel mid-stream
  const handleStopGeneration = useCallback(() => {
    console.log('🛑 User requested to stop generation');
    
    if (abortControllerRef.current) {
      // Abort the stream - this will trigger the onError handler with user_cancelled
      abortControllerRef.current.abort();
      
      // Clear the thinking delay timeout if it's still pending
      if (thinkingDelayRef.current) {
        clearTimeout(thinkingDelayRef.current);
        thinkingDelayRef.current = null;
      }
      
      console.log('✅ Abort signal sent');
    } else {
      console.log('⚠️ No active stream to stop');
    }
  }, []);

  return {
    handleSendMessage,
    handleStartNewChat,
    startNewChatSession, // ✅ NEW: Centralized new chat session function
    handleStreamComplete,
    handleStopGeneration, // ✅ NEW: Stop generation handler
    manualSaveInProgress, // Export this so it can be used by auto-save
    thinkingSteps, // Thinking panel steps
    clearThinkingSteps: () => setThinkingSteps([])
  };
};
