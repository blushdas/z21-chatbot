import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useVerificationContext } from "@/context/VerificationContext";
import { useLocation } from "react-router-dom";
import ChatHeader from "@/components/ChatHeader";
import ChatContent from "@/components/ChatContent";
import ChatInputSection from "@/components/ChatInputSection";
import WelcomeMessage from "@/components/WelcomeMessage";
import ScrollToBottomButton from "@/components/ScrollToBottomButton";
import PromoteToKnowledgeDialog from "@/components/folders/PromoteToKnowledgeDialog";
import ChatMonitoringBanner from "@/components/chat/ChatMonitoringBanner";


import { useChatManagement } from "@/hooks/useChatManagement";
import { useChatState } from "@/hooks/useChatState";
import { useChatHandlers } from "@/hooks/useChatHandlers";
import { useFolderProjectContext } from "@/hooks/supabase/useFolderProjectContext";
import { useChatScroll } from "@/hooks/useChatScroll";
import { useChatAutoSave } from "@/hooks/useChatAutoSave";
import { useScrollToBottom } from "@/hooks/useScrollToBottom";
import { usePreserveScrollOnResize } from "@/hooks/usePreserveScrollOnResize";
import { useChatScrollPersistence } from "@/hooks/useChatScrollPersistence";
import { isStreaming as isStreamingGlobal, getStreamingState } from "@/utils/activeStreamingTracker";
import { useStreamingSubscription } from "@/hooks/useStreamingSubscription";

import { useChatUrlParams } from "@/hooks/useChatUrlParams";
import { useChatHighlight } from "@/hooks/useChatHighlight";
import { useChatInitialization } from "@/hooks/useChatInitialization";
import { useDualResponse } from "@/hooks/useDualResponse";
import { useDualResponseHandler } from "@/hooks/useDualResponseHandler";
import { DualResponseComparison } from "@/components/DualResponseComparison";
import { modes } from "@/data/modeConfig";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { usePromptImprovement } from "@/hooks/usePromptImprovement";
import { useCommentaryLayer } from "@/hooks/useCommentaryLayer";
import CommentaryToggle from "@/components/commentary/CommentaryToggle";
import { useNavigate } from "react-router-dom";
import { detectCanvasIntent } from "@/utils/canvasIntent";
import { detectCanvasEditIntent, detectExplicitCanvasReference } from "@/utils/canvasEditIntent";
import { createCanvasFromMarkdown } from "@/hooks/useCanvas";
import { readModelOverride, writeModelOverride, readKbOverride, readKb } from "@/lib/chatDefaults";
import { useIsHydrated } from "@/hooks/useClientValue";


import type { ChatMode, Mode, ResponseMode, ResponseLength, LLMModel, MessageType } from '@/types/chat';
export type { ChatMode, Mode, ResponseMode, ResponseLength, LLMModel, MessageType };

interface ChatInterfaceProps {
  savedChatId?: string;
  onChatSave?: (chatId: string) => void;
  onStartNewChat?: (chatId: string) => void;
  initialMode?: ChatMode;
  initialLength?: string;
  resumedChatId?: string | null;
  onReAskMemory?: (content: string) => void;
  className?: string;
  splitScreenVerification?: boolean;
  onToggleSplitScreenVerification?: (enabled: boolean) => void;
  commentarySidebarOpen?: boolean;
  onToggleCommentarySidebar?: (open: boolean) => void;
  onToggleResourcesPanel?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  savedChatId,
  onChatSave,
  onStartNewChat: onParentStartNewChat,
  initialMode = 'coach',
  initialLength = 'medium',
  resumedChatId = null,
  className = "",
  splitScreenVerification = false,
  onToggleSplitScreenVerification,
  commentarySidebarOpen = false,
  onToggleCommentarySidebar,
  onToggleResourcesPanel,
}) => {
  const { user, profile } = useAuth();
  
  const { 
    currentChatId,
    currentChat,
    savedChats, // ⚡ For instant preload check
    saveChat, 
    createNewChat, 
    updateChatTitle,
    resumeChat,
    setCurrentChatId,
    initialized,
    isAuthenticated
  } = useChatManagement();

  const {
    currentLength,
    setCurrentLength,
    isBotTyping,
    setIsBotTyping,
    streamingMessageId,
    setStreamingMessageId,
    messagesContainerRef,
    sessionStartTime,
    lastResumedChatId
  } = useChatState({ initialMode, initialLength, resumedChatId });

  // Local state for response mode and tone
  const [responseMode, setResponseMode] = useState<ResponseMode>("coaching");
  const [currentTone, setCurrentTone] = useState<string>("wise_direct");
  // SSR-safe defaults. Real persisted values are loaded from localStorage in
  // a post-mount effect (see useIsHydrated below) to avoid hydration mismatches.
  const [selectedModel, setSelectedModel] = useState<string>('grounded');
  const [selectedPower, setSelectedPower] = useState<string>('auto');
  const [useKnowledgebase, setUseKnowledgebase] = useState<boolean>(true);
  // Per-chat toggle for the Project Knowledge Base (only meaningful when the
  // chat belongs to a folder). Defaults to ON; persisted via KB override.
  const [useProjectKb, setUseProjectKb] = useState<boolean>(true);
  const hydrated = useIsHydrated();
  useEffect(() => {
    if (!hydrated) return;
    try {
      const storedModel = window.localStorage.getItem('chat:aiModel');
      if (storedModel) setSelectedModel(storedModel);
    } catch { /* ignore */ }
    try {
      const raw = window.localStorage.getItem('chat:knowledgeBaseSources');
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        setUseKnowledgebase(Array.isArray(parsed) ? parsed.length > 0 : true);
      }
    } catch { /* ignore */ }
  }, [hydrated]);

  // Local state for dual response mode
  const [dualResponseMode, setDualResponseMode] = useState(false);

  // Inline Third-Party Verification Companion toggle (superadmin-only, demo)
  const [inlineVerificationEnabled, setInlineVerificationEnabled] = useState(false);

  // Local state for current messages and UI
  const [currentMessages, setCurrentMessages] = useState<MessageType[]>([]);
  const currentMessagesRef = useRef<MessageType[]>(currentMessages);
  useEffect(() => { currentMessagesRef.current = currentMessages; }, [currentMessages]);
  // Tracks whether the just-sent user prompt asked for the response to land in a canvas.
  const pendingCanvasIntentRef = useRef<{ userMessageId: string | null } | null>(null);
  // Tracks whether the user has armed "Canvas mode" via the + menu. When armed,
  // the next outgoing message in this chat will have its response auto-placed
  // into a fresh canvas (same effect as a "put this in a canvas" prompt).
  const canvasArmedRef = useRef(false);
  const navigate = useNavigate();
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [highlightedMessageIndex, setHighlightedMessageIndex] = useState<number | null>(null);
  const [subPrompts, setSubPrompts] = useState<string[]>(() => {
    if (typeof window === 'undefined') return ['quickAnswer'];
    try {
      const v = window.localStorage.getItem('chat:defaultBlueprint');
      const allowed = ['quickAnswer', 'standard', 'directQuotes', 'noBlueprints'];
      return [allowed.includes(v ?? '') ? (v as string) : 'quickAnswer'];
    } catch { return ['quickAnswer']; }
  });
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false); // Start as false to prevent flash
  const [pendingModeChange, setPendingModeChange] = useState<ChatMode | null>(null);
  const [modeChangeDividers, setModeChangeDividers] = useState<Array<{id: string, mode: ChatMode, timestamp: Date}>>([]);
  const [modelChangeDividers, setModelChangeDividers] = useState<Array<{id: string, model: string, timestamp: Date}>>([]);
  const [powerChangeDividers, setPowerChangeDividers] = useState<Array<{id: string, value: string, timestamp: Date}>>([]);
  const [kbChangeDividers, setKbChangeDividers] = useState<Array<{id: string, label: string, enabled: boolean, timestamp: Date}>>([]);
  const [blueprintChangeDividers, setBlueprintChangeDividers] = useState<Array<{id: string, mode: ResponseMode, timestamp: Date}>>([]);
  const [chatLoadingState, setChatLoadingState] = useState<'loading' | 'loaded' | 'new'>('loading');
  const [typingHiding, setTypingHiding] = useState(false);
  const [lastResponseTimestamp, setLastResponseTimestamp] = useState<number>(0);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [promoteTarget, setPromoteTarget] = useState<{ content: string } | null>(null);

  // Third-Party Verification Mode: push latest assistant message to context when available
  const verificationCtx = useVerificationContext();

  // Listen for "Canvas mode" arm/disarm events fired from the chat composer's
  // + menu. When armed, the next outgoing message routes its response into a
  // freshly created canvas (handled in onResponseComplete via
  // pendingCanvasIntentRef).
  useEffect(() => {
    const onArm = (e: Event) => {
      const detail = (e as CustomEvent).detail as { chatId?: string } | undefined;
      if (!detail?.chatId || detail.chatId === currentChatId) {
        canvasArmedRef.current = true;
      }
    };
    const onDisarm = () => { canvasArmedRef.current = false; };
    window.addEventListener('canvas:arm', onArm as EventListener);
    window.addEventListener('canvas:disarm', onDisarm as EventListener);
    return () => {
      window.removeEventListener('canvas:arm', onArm as EventListener);
      window.removeEventListener('canvas:disarm', onDisarm as EventListener);
    };
  }, [currentChatId]);

  useEffect(() => {
    if (!verificationCtx?.active) return;
    const lastDaryle = [...currentMessages].reverse().find(m => m.sender === 'daryle');
    if (lastDaryle) {
      verificationCtx.pushAssistantMessage(lastDaryle);
    }
  }, [currentMessages, verificationCtx]);

  // Convert dividers to database format for persistence
  const getModeChangeEvents = useCallback(() => {
    const modeEvents = modeChangeDividers.map(d => ({
      id: d.id,
      type: 'mode' as const,
      value: d.mode,
      timestamp: d.timestamp.toISOString()
    }));
    const modelEvents = modelChangeDividers.map(d => ({
      id: d.id,
      type: 'model' as const,
      value: d.model,
      timestamp: d.timestamp.toISOString()
    }));
    const powerEvents = powerChangeDividers.map(d => ({
      id: d.id,
      type: 'power' as const,
      value: d.value,
      timestamp: d.timestamp.toISOString()
    }));
    const blueprintEvents = blueprintChangeDividers.map(d => ({
      id: d.id,
      type: 'blueprint' as const,
      value: d.mode,
      timestamp: d.timestamp.toISOString()
    }));
    return [...modeEvents, ...modelEvents, ...powerEvents, ...blueprintEvents];
  }, [modeChangeDividers, modelChangeDividers, powerChangeDividers, blueprintChangeDividers]);

  // Gradient crossfade overlay state for 60fps transitions
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [isSharpening, setIsSharpening] = useState(false);
  const prevMsgCountRef = useRef<number>(0);
  const animationFrameRef = useRef<number | undefined>(undefined);

  const triggerGradient = useCallback(() => {
    setOverlayVisible(true);
    
    // Use requestAnimationFrame for 60fps frame-synced animation
    const startFadeOut = () => {
      animationFrameRef.current = requestAnimationFrame(() => {
        // Trigger CSS animation to start fade out
        const overlayEl = document.querySelector('.chat-gradient-overlay');
        if (overlayEl) {
          overlayEl.classList.add('animate-fade-out-smooth');
        }
        
        // Clean up after animation completes (600ms total)
        animationFrameRef.current = requestAnimationFrame(() => {
          setTimeout(() => {
            setOverlayVisible(false);
            const overlayEl = document.querySelector('.chat-gradient-overlay');
            if (overlayEl) {
              overlayEl.classList.remove('animate-fade-out-smooth');
            }
          }, 600);
        });
      });
    };
    
    // Start fade out after brief visibility (100ms)
    setTimeout(startFadeOut, 100);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Persist last-selected chat mode (Coaching/Family/Investor/Ambassador) so
  // returning users land back on their preferred mode when no chat is loaded.
  // Loaded post-mount to avoid hydration mismatches.
  const [storedMode, setStoredMode] = useState<ChatMode | null>(null);
  useEffect(() => {
    if (!hydrated) return;
    try {
      const v = window.localStorage.getItem('chat:mode');
      if (v) setStoredMode(v as ChatMode);
    } catch { /* ignore */ }
  }, [hydrated]);
  const currentMode = currentChat?.mode || storedMode || initialMode;
  const chatTitle = currentChat?.title !== "New Chat" ? currentChat?.title : null;
  const isTypingTitle = currentChat?.isTypingTitle || false;
  
  // Always use currentMessages for display - ensure all messages have chatId
  const messages = currentMessages.map((msg, index) => ({
    ...msg,
    chatId: msg.chatId || currentChatId || 'unknown',
    messageIndex: index
  }));

  // Filter out ephemeral verification messages before saving to DB
  const persistableMessages = useMemo(
    () => messages.filter(m => m.sender !== 'verification'),
    [messages]
  );
  
  // Better logic to determine when to show welcome message
  // Only show for truly new chats, never for existing chats loading
  // ✅ CRITICAL: Use resumedChatId as source of truth - it's from URL and always accurate
  const effectiveChatIdForWelcome = resumedChatId || currentChatId;
  const isExistingChat = effectiveChatIdForWelcome && !effectiveChatIdForWelcome.startsWith('guest-') && !effectiveChatIdForWelcome.startsWith('temp-');
  const isLoadingExistingChat = isExistingChat && (!messagesLoaded || chatLoadingState === 'loading');
  const isNewChat = !effectiveChatIdForWelcome || effectiveChatIdForWelcome.startsWith('guest-') || effectiveChatIdForWelcome.startsWith('temp-');
  
  // ✅ Never show welcome if we have a resumedChatId (navigating to existing chat)
  const showWelcome = !resumedChatId && !isLoadingExistingChat && isNewChat && messages.length === 0 && messagesLoaded && initialized && chatLoadingState === 'new';
  
  // Dual response functionality
  const dualResponse = useDualResponse({ currentMode, currentLength, messages });
  const dualResponseHandler = useDualResponseHandler({
    currentChatId,
    messages,
    currentMode,
    currentLength,
    onMessagesUpdate: setCurrentMessages,
    saveChat,
    createNewChat,
    dualResponse,
    setIsBotTyping
  });

  // Prompt improvement coaching
  const conversationHistory = useMemo(
    () => messages.map((m) => ({ role: m.sender === 'daryle' ? 'assistant' : 'user', content: m.content })),
    [messages],
  );
  const promptImprovement = usePromptImprovement(conversationHistory, currentChatId);
  const commentaryLayer = useCommentaryLayer(currentChatId);

  // Safety valve: force out of loading if context ready but local state stuck
  useEffect(() => {
    if (currentChat && chatLoadingState === 'loading' && initialized) {
      console.log('🔧 Safety valve: forcing chat load completion');
      setMessagesLoaded(true);
      setChatLoadingState('loaded');
    }
  }, [currentChat, chatLoadingState, initialized]);

  // Custom hooks for specific functionality
  const { chatLoading } = useChatUrlParams({
    isAuthenticated,
    initialized,
    resumeChat,
    setHighlightedMessageIndex,
    currentChatId
  });

  useChatHighlight({
    highlightedMessageIndex,
    messages,
    messagesContainerRef
  });

  useChatInitialization({
    initialized,
    currentChatId,
    currentChat,
    setCurrentMessages,
    setMessagesLoaded,
    setChatLoadingState,
    resumedChatId, // ✅ Pass resumedChatId as source of truth
    isBotTyping,
    streamingMessageId, // ✅ Block real-time sync during active streaming
    localMessagesCount: currentMessages.length,
    setModeChangeDividers,
    setModelChangeDividers,
    setPowerChangeDividers,
    setBlueprintChangeDividers,
    setSubPrompts,      // ✅ NEW: Restore current mode from saved events
    setSelectedModel    // ✅ NEW: Restore current model from saved events
  });

  // Loading timeout detection - log if chat is stuck loading
  useEffect(() => {
    if (chatLoadingState === 'loading' && currentChatId && initialized) {
      const timeout = setTimeout(async () => {
        const { logChatLoadFailure } = await import('@/utils/chatLoadingLogger');
        await logChatLoadFailure(
          user?.id,
          currentChatId,
          'LOADING_TIMEOUT',
          'Chat stuck in loading state for 10+ seconds',
          {
            hasCurrentChat: !!currentChat,
            messagesLoaded,
            initialized,
            chatLoadingState,
            currentMessagesLength: currentMessages.length,
            isBotTyping
          }
        );
      }, 10000); // 10 second timeout
      
      return () => clearTimeout(timeout);
    }
  }, [chatLoadingState, currentChatId, initialized, currentChat, messagesLoaded, currentMessages.length, isBotTyping, user?.id]);

  // ✅ FIX: Save on route change to prevent mid-stream data loss
  const location = useLocation();
  const previousLocationRef = useRef(location.pathname);

  useEffect(() => {
    if (previousLocationRef.current !== location.pathname) {
      // ✅ FIX: Don't save partial content during streaming!
      if (streamingMessageId) {
        console.log('🛤️ Route changing during streaming - skipping save (let onComplete handle it)');
        previousLocationRef.current = location.pathname;
        return;
      }
      
      // Route is changing - emergency save if we have unsaved messages.
      // Skip if the chat was just deleted (no longer in savedChats) to
      // avoid re-creating a "New Chat" via upsert.
      const stillExists = savedChats.some(c => c.id === currentChatId);
      if (stillExists && currentChatId && currentMessages.length > 0 && !currentChatId.startsWith('guest-') && !currentChatId.startsWith('temp-')) {
        console.log('🛤️ Route changing - saving chat before navigation');
        // Use basic 3-param signature (title generation protection handled by lock in useChatSaver)
        saveChat(currentChatId, currentMessages.filter(m => m.sender !== 'verification'), currentMode, getModeChangeEvents()).catch(err =>
          console.error('❌ Route change save failed:', err)
        );
      }
      previousLocationRef.current = location.pathname;
    }
  }, [location.pathname, currentChatId, currentMessages, currentMode, saveChat, streamingMessageId, getModeChangeEvents]);

  // Trigger gradient overlay when transitioning from new chat (0 messages) to active chat (>0)
  useEffect(() => {
    if (prevMsgCountRef.current === 0 && messages.length > 0) {
      triggerGradient();
    }
    prevMsgCountRef.current = messages.length;
  }, [messages.length, triggerGradient]);

  // Handle resumed chat from sidebar - OPTIMIZED for instant preloaded chats
  useEffect(() => {
    if (!resumedChatId || !isAuthenticated || !initialized) return;
    
    // Check for ?refresh=true query param to force database refresh
    const urlParams = new URLSearchParams(window.location.search);
    const forceRefresh = urlParams.get('refresh') === 'true';
    
    if (forceRefresh) {
      console.log('🔄 Force refresh requested for chat:', resumedChatId);
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('refresh');
      window.history.replaceState({}, '', newUrl.toString());
      resumeChat(resumedChatId, true);
      return;
    }
    
    // ⚡ INSTANT PATH: If chat is already preloaded, just set the ID (no async needed)
    const isPreloaded = savedChats.some(chat => chat.id === resumedChatId);
    if (isPreloaded) {
      // Chat data already in memory - just switch to it instantly
      setCurrentChatId(resumedChatId);
      console.log(`⚡ Instant switch to preloaded chat: ${resumedChatId}`);
    } else {
      // Chat not in memory - need to fetch from database
      console.log(`📥 Fetching non-preloaded chat: ${resumedChatId}`);
      resumeChat(resumedChatId, false);
    }
  }, [resumedChatId, isAuthenticated, initialized, savedChats, setCurrentChatId, resumeChat]);

  // Aggregated project context (description + instructions + memory + sources)
  // for chats belonging to a folder. Quick Links are intentionally excluded.
  const { context: folderProjectContext } = useFolderProjectContext(currentChat?.folder_id ?? null);

  // Sync `useProjectKb` with the per-chat KB override (default ON for project chats).
  useEffect(() => {
    if (!currentChat?.folder_id) { setUseProjectKb(true); return; }
    const override = readKbOverride(currentChatId ?? undefined);
    setUseProjectKb(override ? override.includes('project' as any) : true);
    const handler = (e: Event) => {
      const sources = (e as CustomEvent).detail?.sources;
      if (Array.isArray(sources)) setUseProjectKb(sources.includes('project'));
    };
    window.addEventListener('chat:kbChange', handler);
    return () => window.removeEventListener('chat:kbChange', handler);
  }, [currentChatId, currentChat?.folder_id]);

  // Chat handlers with manual save coordination
  const chatHandlers = useChatHandlers({
    currentChatId,
    messages: currentMessages,
    currentMode,
    currentLength,
    responseMode,
    subPrompts,
    modelOverride: selectedModel,
    useKnowledgebase,
    createNewChat,
    saveChat,
    folderInstructions: folderProjectContext || undefined,
    folderId: useProjectKb ? (currentChat?.folder_id ?? null) : null,
    setIsBotTyping,
    setStreamingMessageId,
    setCurrentChatId,
    setTypingHiding,
    onSaveStatusChange: setSaveStatus,
    getModeChangeEvents, // ✅ Pass mode/model change events for persistence
    chatTitle: currentChat?.title || 'New Chat', // ✅ Pass chat title for toast notifications
    onMessagesUpdate: async (updatedMessages) => {
      // Ensure new messages also have chatId when updated
      const messagesWithChatId = updatedMessages.map((msg, index) => ({
        ...msg,
        chatId: msg.chatId || currentChatId || 'unknown',
        messageIndex: index
      }));
      setCurrentMessages(messagesWithChatId);
      
      // Title generation handled centrally in Supabase save flow; no inline generation here

    },
    onResponseComplete: async () => {
      // Update timestamp to trigger prompt rotation
      setLastResponseTimestamp(Date.now());

      // Canvas intent: if the user's prompt asked to put the response in a canvas,
      // create one from the latest Daryle message and open it in the panel.
      if (pendingCanvasIntentRef.current && user?.id && currentChatId) {
        const { userMessageId } = pendingCanvasIntentRef.current;
        pendingCanvasIntentRef.current = null;
        setTimeout(async () => {
          const latest = currentMessagesRef.current;
          const lastDaryleMsg = [...latest].reverse().find((m) => m.sender === 'daryle');
          if (!lastDaryleMsg?.content) return;
          try {
            const canvas = await createCanvasFromMarkdown({
              ownerId: user.id,
              markdown: lastDaryleMsg.content,
              chatId: currentChatId,
              createdFromMessageId: userMessageId ?? null,
            });
            if (canvas) {
              navigate(`/chat/${currentChatId}?canvas=${canvas.id}`, {
                replace: true,
                state: { canvasOpened: true },
              });
            }
          } catch (err) {
            console.error('Failed to auto-create canvas from intent:', err);
          }
        }, 0);
      }

      // Inline Third-Party Verification Companion: auto-trigger after Daryle response
      if (inlineVerificationEnabled && profile?.role === 'superadmin') {
        // Get the latest Daryle message from current state
        // Use a microtask to ensure state has settled
        setTimeout(async () => {
          const latestMessages = currentMessagesRef.current;
          const lastDaryleMsg = [...latestMessages].reverse().find(m => m.sender === 'daryle');
          if (!lastDaryleMsg) return;

          // Add a loading placeholder verification message
          const verificationLoadingMsg: MessageType = {
            id: `verification-loading-${Date.now()}`,
            sender: "verification" as const,
            content: JSON.stringify({ loading: true }),
            timestamp: new Date(),
            mode: currentMode,
          };
          setCurrentMessages(prev => [...prev, verificationLoadingMsg]);

          try {
            const verificationPrompt = `You are acting as a Third-Party Verification Companion. Your job is to analyze the following AI assistant response and provide a structured review. Use EXACTLY these four section headers in your response:\n\n## What Seems Solid\n## What to Question\n## What to Verify\n## Companion Perspective\n\nKeep each section to 1-3 sentences. Be constructive, not combative.\n\nHere is the AI assistant response to analyze:\n\n---\n${lastDaryleMsg.content}\n---\n\nProvide your structured verification review now.`;

            const { data, error: fnError } = await supabase.functions.invoke('pinecone-rag-chat', {
              body: {
                message: verificationPrompt,
                mode: 'coach',
                length: 'medium',
                responseMode: 'coaching',
                streaming: false,
                subPrompts: ['quickAnswer'],
                skipCache: true,
              },
            });

            let parsed;
            if (fnError || !data?.response) {
              // Fallback mock
              const wc = lastDaryleMsg.content.split(/\s+/).length;
              parsed = {
                whatSeemssolid: `The response is ${wc > 100 ? 'comprehensive' : 'concise'} and addresses the question directly.`,
                whatToQuestion: wc > 200 ? 'The length may indicate over-explanation.' : 'No major concerns identified.',
                whatToVerify: 'Any specific dates, statistics, or named references should be independently confirmed.',
                companionPerspective: 'This response appears reasonable overall. Use your own judgment alongside this guidance.',
              };
            } else {
              const text = data.response;
              const solidMatch = text.match(/## What Seems Solid\s*\n([\s\S]*?)(?=## What to Question|$)/i);
              const questionMatch = text.match(/## What to Question\s*\n([\s\S]*?)(?=## What to Verify|$)/i);
              const verifyMatch = text.match(/## What to Verify\s*\n([\s\S]*?)(?=## Companion Perspective|$)/i);
              const perspectiveMatch = text.match(/## Companion Perspective\s*\n([\s\S]*?)$/i);
              parsed = {
                whatSeemssolid: solidMatch?.[1]?.trim() || 'Analysis pending.',
                whatToQuestion: questionMatch?.[1]?.trim() || 'No concerns identified.',
                whatToVerify: verifyMatch?.[1]?.trim() || 'No specific claims to verify.',
                companionPerspective: perspectiveMatch?.[1]?.trim() || 'Response appears reasonable.',
              };
            }

            // Replace loading message with real result
            const verificationMsg: MessageType = {
              id: `verification-${Date.now()}`,
              sender: "verification" as const,
              content: JSON.stringify(parsed),
              timestamp: new Date(),
              mode: currentMode,
            };
            setCurrentMessages(prev => prev.map(m =>
              m.id === verificationLoadingMsg.id ? verificationMsg : m
            ));
          } catch (err) {
            console.error('[InlineVerification] Error:', err);
            // Replace loading with fallback
            const fallback = {
              whatSeemssolid: 'Unable to perform live verification.',
              whatToQuestion: 'Verification service temporarily unavailable.',
              whatToVerify: 'Please review the response manually.',
              companionPerspective: 'Use your own judgment for this response.',
            };
            const fallbackMsg: MessageType = {
              id: `verification-${Date.now()}`,
              sender: "verification" as const,
              content: JSON.stringify(fallback),
              timestamp: new Date(),
              mode: currentMode,
            };
            setCurrentMessages(prev => prev.map(m =>
              m.id === verificationLoadingMsg.id ? fallbackMsg : m
            ));
          }
        }, 500); // Small delay to let messages state settle
      }

      // Commentary Layer: offer or auto-generate after Daryle response
      if (commentaryLayer.isEnabled) {
        setTimeout(() => {
          const latestMessages = currentMessagesRef.current;
          const lastDaryleMsg = [...latestMessages].reverse().find(m => m.sender === 'daryle');
          const lastUserMsg = [...latestMessages].reverse().find(m => m.sender === 'user');
          if (!lastDaryleMsg || !lastUserMsg) return;

          // Suppress commentary offer on crisis/self-harm exchanges — tone-deaf to ask for "perspective"
          const CRISIS_RE = /\b(kill myself|killing myself|kill me|want to die|wanna die|end my life|suicid\w*|self[- ]harm|hurt myself|cutting myself|not safe being alone|don'?t want to live)\b/i;
          if (CRISIS_RE.test(lastUserMsg.content) || CRISIS_RE.test(lastDaryleMsg.content)) return;

          if (commentaryLayer.displayMode === 'inline') {
            commentaryLayer.offerCommentary(lastDaryleMsg.id, lastUserMsg.content, lastDaryleMsg.content);
          } else if (commentaryLayer.displayMode === 'sidebar') {
            commentaryLayer.generateCommentary(lastDaryleMsg.id, lastUserMsg.content, lastDaryleMsg.content);
          }
        }, 800); // Slightly longer delay to let verification settle first
      }
    }
  });

  // When prompt improvement completes, send the final prompt
  // Use refs for handlers to avoid stale closures and unnecessary effect re-fires
  type PendingAdvisorAttachment = {
    fileId: string;
    fileName: string;
    parsedText: string;
    fileType?: string;
    pageCount?: number;
  };
  const pendingAdvisorSendRef = useRef<{
    content: string;
    attachments?: PendingAdvisorAttachment[];
  } | null>(null);
  const sendMessageRef = useRef(chatHandlers.handleSendMessage);
  const resetCoachingRef = useRef(promptImprovement.reset);
  useEffect(() => { sendMessageRef.current = chatHandlers.handleSendMessage; }, [chatHandlers.handleSendMessage]);
  useEffect(() => { resetCoachingRef.current = promptImprovement.reset; }, [promptImprovement.reset]);

  useEffect(() => {
    if (currentMode !== 'advisor' || !pendingAdvisorSendRef.current) return;
    const pending = pendingAdvisorSendRef.current;
    pendingAdvisorSendRef.current = null;
    sendMessageRef.current(pending.content, pending.attachments);
  }, [currentMode]);

  useEffect(() => {
    if (promptImprovement.state === 'complete' && promptImprovement.finalPrompt) {
      sendMessageRef.current(promptImprovement.finalPrompt);
      resetCoachingRef.current();
    }
  }, [promptImprovement.state, promptImprovement.finalPrompt]);

  // Auto-save with coordination to prevent race conditions
  // ✅ FIX: The defensive hasNewMessages check in useChatSaver now defaults to false
  // when currentChat is undefined, preventing timestamp corruption on initial load
  useChatAutoSave({
    chatId: currentChatId,
    messages: persistableMessages,
    mode: currentMode,
    saveChat,
    enabled: true,
    manualSaveInProgress: chatHandlers.manualSaveInProgress,
    isStreaming: !!streamingMessageId // ✅ NEW: Pass streaming state to skip emergency saves
  });

  // Pass flag indicating messages were just loaded from a saved chat (not new or streaming)
  const messagesJustLoadedFromDb = chatLoadingState === 'loaded' && messagesLoaded && messages.length > 0;
  useChatScroll(messagesContainerRef, messages, streamingMessageId, isBotTyping, messagesJustLoadedFromDb, currentChatId);
  
  const { isNearBottom, scrollToBottom } = useScrollToBottom(messagesContainerRef);
  // Keep scroll position stable when the chat width changes (e.g. opening or
  // closing the split-screen canvas panel).
  usePreserveScrollOnResize(messagesContainerRef);

  // Persist scrollTop per chat so refresh / switching back restores position.
  useChatScrollPersistence(messagesContainerRef, currentChatId, messagesJustLoadedFromDb);

  // Reset state when switching between chats or starting new chat
  useEffect(() => {
    if (resumedChatId !== lastResumedChatId.current) {
      
      // Check if the chat we're switching TO is still streaming
      if (resumedChatId && isStreamingGlobal(resumedChatId)) {
        console.log('🔄 Returning to actively streaming chat:', resumedChatId);
        
        // ✅ CRITICAL: Restore accumulated messages from global tracker
        const streamingState = getStreamingState(resumedChatId);
        if (streamingState && streamingState.messages.length > 0) {
          console.log('📥 Restoring streaming state:', {
            messageCount: streamingState.messages.length,
            contentLength: streamingState.accumulatedContent.length,
            streamingMessageId: streamingState.streamingMessageId
          });
          setCurrentMessages(streamingState.messages);
          setStreamingMessageId(streamingState.streamingMessageId);
          setMessagesLoaded(true);
          setChatLoadingState('loaded');
        }
        
        setIsBotTyping(true); // Restore typing indicator
      } else {
        // ✅ FIX: Don't reset isBotTyping if it's already true
        // This prevents race condition where navigation fires before markStreaming completes
        // The typing indicator was JUST set, so preserve it
        if (!isBotTyping) {
          setStreamingMessageId(null);
          setMessagesLoaded(false);
        }
        // Always allow these resets regardless of typing state
      }
      
      setHighlightedMessageIndex(null); // Clear highlight when switching chats
      sessionStartTime.current = new Date();
      lastResumedChatId.current = resumedChatId;
    }
  }, [resumedChatId, setIsBotTyping, setStreamingMessageId, setChatLoadingState, isBotTyping]);

  // ✅ CRITICAL: Subscribe to live streaming updates from global tracker
  // This hook handles BOTH restoring typing state when returning to streaming chat
  // AND clearing typing state when streaming completes - single source of truth
  // This keeps the UI in sync when returning to a streaming chat
  useStreamingSubscription({
    chatId: currentChatId,
    setCurrentMessages,
    setStreamingMessageId,
    setIsBotTyping
  });

  const handleTitleUpdate = async (newTitle: string) => {
    if (currentChatId && !currentChatId.startsWith('guest-') && !currentChatId.startsWith('temp-')) {
      console.log(`🏷️ Updating title to: "${newTitle}" for chat:`, currentChatId);
      await updateChatTitle(currentChatId, newTitle);
      console.log(`🏷️ ✅ Title updated successfully in database and local state`);
    }
  };

  const handleModeChange = async (mode: string) => {
    // Clear sub-prompts when changing modes to prevent style conflicts
    setSubPrompts([]);

    // Remember the last selected mode across sessions.
    if (typeof window !== 'undefined') {
      try { window.localStorage.setItem('chat:mode', mode); } catch { /* ignore */ }
    }
    setStoredMode(mode as ChatMode);
    
    
    // Show notification above input area (no UI changes yet)
    if (messages.length > 0) {
      setPendingModeChange(mode as ChatMode);
    }
    
    if (currentChatId && currentChat && !currentChatId.startsWith('guest-') && !currentChatId.startsWith('temp-')) {
      
      await saveChat(currentChatId, messages, mode as ChatMode, getModeChangeEvents());
    }
  };

  const handleLengthChange = (length: string) => {
    setCurrentLength(length);
  };

  // ✅ REFACTORED: Use centralized new chat session function
  const handleNewChatClick = async () => {
    
    
    // Reset states for new chat
    setCurrentMessages([]);
    setMessagesLoaded(true);
    setHighlightedMessageIndex(null);
    setShowWelcomeMessage(true); // ✅ FIX: Ensure welcome message shows for new chat
    setChatLoadingState('new'); // Mark as genuinely new chat
    setModeChangeDividers([]); // Clear mode dividers
    setModelChangeDividers([]); // Clear model dividers
    setPowerChangeDividers([]); // Clear power dividers
    setKbChangeDividers([]); // Clear KB dividers
    setBlueprintChangeDividers([]); // Clear blueprint dividers
    
    // Use centralized function - handles creation, state update, and navigation
    const newChatId = await chatHandlers.startNewChatSession();
    
    // Optional: Notify parent if callback exists (mainly for backward compatibility)
    if (onParentStartNewChat && newChatId) {
      
      onParentStartNewChat(newChatId);
    }
  };

  const handleSubPromptsChange = (newSubPrompts: string[]) => {
    const newMode = newSubPrompts[0];
    const previousMode = subPrompts[0];
    
    // Only add divider if mode actually changed and there are messages
    if (newMode !== previousMode && currentMessages.length > 0) {
      setModeChangeDividers(prev => [...prev, {
        id: `mode-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        mode: newMode as ChatMode,
        timestamp: new Date()
      }]);
    }
    
    setSubPrompts(newSubPrompts);
  };

  const handleModelChange = (newModel: string) => {
    // Only add divider if model actually changed and there are messages
    if (newModel !== selectedModel && currentMessages.length > 0) {
      setModelChangeDividers(prev => [...prev, {
        id: `model-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        model: newModel,
        timestamp: new Date()
      }]);
    }

    setSelectedModel(newModel);
    if (currentChatId) {
      // Per-chat override — do NOT touch the user's saved default.
      writeModelOverride(currentChatId, newModel as any);
    } else {
      try { window.localStorage.setItem('chat:aiModel', newModel); } catch { /* ignore */ }
    }
  };

  const handleDismissWelcome = () => {
    setShowWelcomeMessage(false);
  };

  // When switching chats, apply per-chat overrides (if any) for model + KB.
  useEffect(() => {
    if (!currentChatId) return;
    const modelOverride = readModelOverride(currentChatId);
    if (modelOverride && modelOverride !== selectedModel) {
      setSelectedModel(modelOverride);
    }
    const kbOverride = readKbOverride(currentChatId);
    const kbEffective = kbOverride ?? readKb();
    const shouldEnable = kbEffective.length > 0;
    if (shouldEnable !== useKnowledgebase) {
      setUseKnowledgebase(shouldEnable);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChatId]);

  // Listen for processing power changes and surface a "Now using …" divider
  useEffect(() => {
    const onPowerChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as { value?: string } | undefined;
      const value = detail?.value;
      if (!value) return;
      if (currentMessages.length === 0) return;
      setPowerChangeDividers(prev => [...prev, {
        id: `power-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        value,
        timestamp: new Date(),
      }]);
    };
    window.addEventListener('chat:powerChange', onPowerChange as EventListener);
    return () => window.removeEventListener('chat:powerChange', onPowerChange as EventListener);
  }, [currentMessages.length]);

  // Keep a live copy of the effective processing power for use in transient UI
  // (e.g. the "Daryle is reflecting…" label). Reads per-chat override first,
  // falls back to the global default, and updates on the chat:powerChange event.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const read = async () => {
      try {
        const { readPower, readPowerOverride } = await import('@/lib/chatDefaults');
        const v = readPowerOverride(currentChatId) ?? readPower();
        setSelectedPower(v);
      } catch { /* ignore */ }
    };
    read();
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as { value?: string } | undefined;
      if (detail?.value) setSelectedPower(detail.value);
    };
    window.addEventListener('chat:powerChange', onChange as EventListener);
    return () => window.removeEventListener('chat:powerChange', onChange as EventListener);
  }, [currentChatId]);

  // Listen for knowledge-base toggle changes and surface a divider
  useEffect(() => {
    const onKbChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as { label?: string; enabled?: boolean } | undefined;
      if (!detail || typeof detail.label !== 'string') return;
      if (currentMessages.length === 0) return;
      setKbChangeDividers(prev => [...prev, {
        id: `kb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        label: detail.label!,
        enabled: !!detail.enabled,
        timestamp: new Date(),
      }]);
    };
    window.addEventListener('chat:kbChange', onKbChange as EventListener);
    return () => window.removeEventListener('chat:kbChange', onKbChange as EventListener);
  }, [currentMessages.length]);

  const handleDismissPendingModeChange = () => {
    setPendingModeChange(null);
  };

  // Show loading state while initializing
  if (!initialized) {
    return (
      <div className="flex items-center justify-center h-full bg-[var(--chat-bg)] text-[var(--chat-text)] font-body">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--chat-text)] mx-auto mb-4"></div>
          <div>Loading...</div>
          {!user && (
            <div className="mt-4 text-sm text-[var(--chat-muted)]">
              Sign in to save your conversations
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0 relative overflow-hidden">
      <ChatHeader
        currentMode={currentMode}
        currentLength={currentLength}
        chatTitle={chatTitle}
        sessionStartTime={sessionStartTime.current}
        chatCreatedAt={currentChat ? new Date(currentChat.createdAt) : undefined}
        subPrompts={subPrompts}
        onModeChange={handleModeChange}
        onLengthChange={handleLengthChange}
        onUpdateTitle={handleTitleUpdate}
        chatId={currentChat?.id}
        folderId={currentChat?.folder_id}
        onSubPromptsChange={handleSubPromptsChange}
        isBotTyping={isBotTyping}
        dualResponseMode={dualResponse.isDualResponseMode}
        onToggleDualResponse={(enabled) => {
          const container = messagesContainerRef.current;
          const prevTop = container ? container.scrollTop : undefined;
          dualResponse.toggleDualResponseMode(enabled);
          requestAnimationFrame(() => {
            if (container && prevTop !== undefined) {
              container.scrollTop = prevTop;
            }
          });
        }}
        messages={messages}
        responseMode={responseMode}
        onResponseModeChange={(next) => {
          // Show an in-chat divider when the blueprint actually changes mid-conversation.
          if (next !== responseMode && currentMessages.length > 0) {
            setBlueprintChangeDividers((prev) => [
              ...prev,
              {
                id: `blueprint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                mode: next,
                timestamp: new Date(),
              },
            ]);
          }
          setResponseMode(next);
        }}
        saveStatus={saveStatus}
        selectedMode={subPrompts[0]}
        selectedModel={selectedModel}
        inlineVerificationEnabled={false}
        onToggleInlineVerification={undefined}
        verificationCount={0}
        splitScreenVerification={false}
        onToggleSplitScreenVerification={undefined}
        onToggleResourcesPanel={onToggleResourcesPanel}
      />

      <ChatMonitoringBanner />

      {/* Commentary Layer Toggle */}
      {commentaryLayer.isEnabled && (
        <div className="absolute top-2 right-14 z-30">
          <CommentaryToggle
            displayMode={commentaryLayer.displayMode}
            isEnabled={commentaryLayer.isEnabled}
            sidebarOpen={commentarySidebarOpen}
            onToggleSidebar={() => onToggleCommentarySidebar?.(!commentarySidebarOpen)}
            onCycleMode={() => {
              const modes: Array<'inline' | 'sidebar' | 'off'> = ['inline', 'sidebar', 'off'];
              const currentIdx = modes.indexOf(commentaryLayer.displayMode);
              const nextMode = modes[(currentIdx + 1) % modes.length];
              commentaryLayer.setDisplayMode(nextMode);
              if (nextMode === 'sidebar') {
                onToggleCommentarySidebar?.(true);
              } else if (commentarySidebarOpen) {
                onToggleCommentarySidebar?.(false);
              }
            }}
          />
        </div>
      )}

      {chatLoading ? (
        <div className="flex items-center justify-center h-full bg-[var(--chat-bg)] text-[var(--chat-text)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-yellow mx-auto mb-4"></div>
            <div className="text-[var(--chat-muted)]">Loading chat...</div>
          </div>
        </div>
      ) : (
        <div
          className={
            messages.length === 0
              ? // Mobile: keep ChatContent visible so its empty-state hero renders
                //         instead of a white screen.
                // Desktop (md+): collapse to 0 — desktop has its own empty-state UI.
                "flex-1 relative flex flex-col min-h-0 overflow-hidden md:h-0 md:flex-none"
              : "flex-1 relative overflow-hidden flex flex-col min-h-0"
          }
        >

          {/* GPU-accelerated gradient overlay for smooth 60fps transition */}
          {/* gradient overlay removed — white flash on dark bg */}
          
          <ChatContent
            messages={messages}
            currentMode={currentMode}
            isBotTyping={isBotTyping}
            streamingMessageId={streamingMessageId}
            highlightedMessageIndex={highlightedMessageIndex}
            messagesContainerRef={messagesContainerRef}
            subPrompts={subPrompts}
            onStreamComplete={chatHandlers.handleStreamComplete}
            modeChangeDividers={modeChangeDividers}
            modelChangeDividers={modelChangeDividers}
            powerChangeDividers={powerChangeDividers}
            kbChangeDividers={kbChangeDividers}
            blueprintChangeDividers={blueprintChangeDividers}
            typingHiding={typingHiding}
            pendingDualResponse={dualResponse.pendingDualResponse}
            chatId={currentChatId || undefined}
            folderId={currentChat?.folder_id}
            thinkingSteps={chatHandlers.thinkingSteps}
            selectedModel={selectedModel}
            selectedPower={selectedPower}
            useKnowledgebase={useKnowledgebase}
            commentaryLayer={commentaryLayer}
            chatLoadingState={chatLoadingState}
            onPromoteMessage={content => setPromoteTarget({ content })}
            onReVerify={inlineVerificationEnabled ? async (verificationMsgId: string) => {
              // Find the Daryle message that precedes this verification message
              const msgIndex = currentMessages.findIndex(m => m.id === verificationMsgId);
              if (msgIndex < 0) return;
              // Walk backwards to find the closest Daryle message
              let daryleMsg: MessageType | null = null;
              for (let i = msgIndex - 1; i >= 0; i--) {
                if (currentMessages[i].sender === 'daryle') {
                  daryleMsg = currentMessages[i];
                  break;
                }
              }
              if (!daryleMsg) return;

              // Replace with loading
              setCurrentMessages(prev => prev.map(m =>
                m.id === verificationMsgId
                  ? { ...m, content: JSON.stringify({ loading: true }) }
                  : m
              ));

              try {
                const verificationPrompt = `You are acting as a Third-Party Verification Companion. Your job is to analyze the following AI assistant response and provide a structured review. Use EXACTLY these four section headers in your response:\n\n## What Seems Solid\n## What to Question\n## What to Verify\n## Companion Perspective\n\nKeep each section to 1-3 sentences. Be constructive, not combative.\n\nHere is the AI assistant response to analyze:\n\n---\n${daryleMsg.content}\n---\n\nProvide your structured verification review now.`;

                const { data, error: fnError } = await supabase.functions.invoke('pinecone-rag-chat', {
                  body: {
                    message: verificationPrompt,
                    mode: 'coach',
                    length: 'medium',
                    responseMode: 'coaching',
                    streaming: false,
                    subPrompts: ['quickAnswer'],
                    skipCache: true,
                  },
                });

                let parsed;
                if (fnError || !data?.response) {
                  const wc = daryleMsg.content.split(/\s+/).length;
                  parsed = {
                    whatSeemssolid: `The response is ${wc > 100 ? 'comprehensive' : 'concise'} and addresses the question directly.`,
                    whatToQuestion: wc > 200 ? 'The length may indicate over-explanation.' : 'No major concerns identified.',
                    whatToVerify: 'Any specific dates, statistics, or named references should be independently confirmed.',
                    companionPerspective: 'This response appears reasonable overall.',
                  };
                } else {
                  const text = data.response;
                  const solidMatch = text.match(/## What Seems Solid\s*\n([\s\S]*?)(?=## What to Question|$)/i);
                  const questionMatch = text.match(/## What to Question\s*\n([\s\S]*?)(?=## What to Verify|$)/i);
                  const verifyMatch = text.match(/## What to Verify\s*\n([\s\S]*?)(?=## Companion Perspective|$)/i);
                  const perspectiveMatch = text.match(/## Companion Perspective\s*\n([\s\S]*?)$/i);
                  parsed = {
                    whatSeemssolid: solidMatch?.[1]?.trim() || 'Analysis pending.',
                    whatToQuestion: questionMatch?.[1]?.trim() || 'No concerns identified.',
                    whatToVerify: verifyMatch?.[1]?.trim() || 'No specific claims to verify.',
                    companionPerspective: perspectiveMatch?.[1]?.trim() || 'Response appears reasonable.',
                  };
                }

                setCurrentMessages(prev => prev.map(m =>
                  m.id === verificationMsgId
                    ? { ...m, content: JSON.stringify(parsed), timestamp: new Date() }
                    : m
                ));
              } catch (err) {
                console.error('[ReVerify] Error:', err);
                const fallback = {
                  whatSeemssolid: 'Unable to perform live verification.',
                  whatToQuestion: 'Verification service temporarily unavailable.',
                  whatToVerify: 'Please review the response manually.',
                  companionPerspective: 'Use your own judgment for this response.',
                };
                setCurrentMessages(prev => prev.map(m =>
                  m.id === verificationMsgId
                    ? { ...m, content: JSON.stringify(fallback), timestamp: new Date() }
                    : m
                ));
              }
            } : undefined}
            onDualResponseSelect={async (preference) => {
              const lastUserMessage = messages.filter(m => m.sender === 'user').pop();
              if (lastUserMessage) {
                const selected = await dualResponse.handleUserChoice(
                  preference, 
                  lastUserMessage.content, 
                  currentChatId || undefined
                );
                
                if (selected) {
                  // Add the selected response as a bot message WITH sources/citation
                  const botMessage: MessageType = {
                    id: `bot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    sender: "daryle",
                    content: selected.content,
                    timestamp: new Date(),
                    mode: currentMode,
                    chatId: currentChatId,
                    intent: 'guidance',
                    sources: Array.isArray((selected as any).sources) ? (selected as any).sources : [],
                    citation: (selected as any).citation as any
                  };

                  const updatedMessages = [...messages, botMessage];
                  setCurrentMessages(updatedMessages);

                  // Save the complete conversation
                  if (currentChatId && !currentChatId.startsWith('guest-') && !currentChatId.startsWith('temp-')) {
                    try {
                      await saveChat(currentChatId, updatedMessages, currentMode, getModeChangeEvents());
                    } catch (error) {
                      console.error('❌ Failed to save selected response:', error);
                    }
                  }
                }
              }
            }}
          />
          
        </div>
      )}


        <ChatInputSection
          messages={messages}
          isLoaded={messagesLoaded}
          currentMode={currentMode}
          setCurrentMode={handleModeChange}
          currentLength={currentLength}
          subPrompts={subPrompts}
          selectedModel={selectedModel}
          setSelectedModel={handleModelChange}
          useKnowledgebase={useKnowledgebase}
          onKnowledgebaseChange={setUseKnowledgebase}
          disabled={isBotTyping || chatLoadingState === 'loading'}
          lastResponseTimestamp={lastResponseTimestamp}
          currentChatId={currentChatId}
          folderId={currentChat?.folder_id ?? null}
          isStreaming={!!streamingMessageId || isBotTyping}
          onStopGeneration={chatHandlers.handleStopGeneration}
          ensureChatId={async () => {
            if (
              currentChatId &&
              !currentChatId.startsWith('guest-') &&
              !currentChatId.startsWith('temp-')
            ) {
              return currentChatId;
            }
            const newId = await createNewChat(currentMode);
            if (
              !newId ||
              newId.startsWith('guest-') ||
              newId.startsWith('temp-')
            ) {
              return newId ?? null;
            }
            setCurrentChatId(newId);
            navigate(`/chat/${newId}`, { replace: true });
            return newId;
          }}
           promptImprovement={promptImprovement}
           isSharpening={isSharpening}
          onToggleSharpen={() => {
            if (!user) return;
            const newValue = !promptImprovement.isEnabled;
            // Instant UI feedback
            promptImprovement.setEnabled(newValue);
            // Persist to DB (fire-and-forget)
            supabase
              .from('profiles')
              .update({ prompt_coaching_enabled: newValue })
              .eq('id', user.id);
          }}
          onSendMessage={async (
            content: string,
            attachments?: Array<{
              fileId: string;
              fileName: string;
              parsedText: string;
              fileType?: string;
              pageCount?: number;
            }>
          ) => {
            const advisorPrefix = /^\/advisor\s+/i;
            if (advisorPrefix.test(content)) {
              const outboundMessage = content.replace(advisorPrefix, '').trim();
              if (!outboundMessage) return;

              if (currentMode === 'advisor') {
                await chatHandlers.handleSendMessage(outboundMessage, attachments);
              } else {
                pendingAdvisorSendRef.current = { content: outboundMessage, attachments };
                await handleModeChange('advisor');
              }
              return;
            }

            // If a canvas is open in this chat and the user's message looks like an
            // instruction to modify that canvas, route the message through
            // canvas-chat-edit and apply the returned operations to the editor.
            const openCanvasId = (() => {
              try {
                const p = new URLSearchParams(window.location.search);
                return p.get('canvas');
              } catch { return null; }
            })();

            // Resolve a target canvas id for this message:
            // - canvas already open + edit-intent → patch it.
            // - no canvas open BUT user explicitly says "the canvas" + edit verb →
            //   look up the latest canvas for this chat, open it, then patch it.
            // - otherwise → fall through to normal chat.
            let targetCanvasId: string | null = null;
            let needsOpen = false;
            if (openCanvasId && currentChatId && user?.id && detectCanvasEditIntent(content)) {
              targetCanvasId = openCanvasId;
            } else if (!openCanvasId && currentChatId && user?.id && detectExplicitCanvasReference(content)) {
              const { data: latest } = await supabase
                .from('canvases')
                .select('id')
                .eq('chat_id', currentChatId)
                .eq('status', 'active')
                .order('last_opened_at', { ascending: false })
                .limit(1)
                .maybeSingle();
              if (latest?.id) {
                targetCanvasId = latest.id;
                needsOpen = true;
              }
            }

            if (targetCanvasId && currentChatId && user?.id) {
              const canvasIdForEdit = targetCanvasId;
              const userMsg: MessageType = {
                id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                sender: 'user',
                content,
                timestamp: new Date(),
                mode: currentMode,
                chatId: currentChatId,
              };
              const placeholderId = `daryle-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
              const placeholder: MessageType = {
                id: placeholderId,
                sender: 'daryle',
                content: 'Updating canvas…',
                timestamp: new Date(),
                mode: currentMode,
                chatId: currentChatId,
              };
              const withUser = [...currentMessagesRef.current, userMsg, placeholder];
              setCurrentMessages(withUser);
              try {
                if (needsOpen) {
                  window.dispatchEvent(new CustomEvent('canvas:open-request', {
                    detail: { canvasId: canvasIdForEdit, chatId: currentChatId },
                  }));
                  // Poll for the editor to mount and publish its HTML so the
                  // AI can do targeted edits instead of a blind rewrite.
                  const deadline = Date.now() + 4000;
                  while (Date.now() < deadline) {
                    const w = window as unknown as { __canvasHtml?: Record<string, string> };
                    if (w.__canvasHtml && typeof w.__canvasHtml[canvasIdForEdit] === 'string') break;
                    await new Promise((r) => setTimeout(r, 100));
                  }
                }
                const currentHtml = (window as unknown as { __canvasHtml?: Record<string, string> }).__canvasHtml?.[canvasIdForEdit] ?? '';
                const recentMessages = currentMessagesRef.current.slice(-6).map((m) => ({
                  role: m.sender === 'user' ? 'user' : 'assistant',
                  content: m.content,
                }));
                const { data, error } = await supabase.functions.invoke('canvas-chat-edit', {
                  body: {
                    canvasId: canvasIdForEdit,
                    chatId: currentChatId,
                    userMessage: content,
                    currentHtml,
                    recentMessages,
                  },
                });
                if (error || !data?.operations) {
                  const { describeInvokeError } = await import('@/lib/invokeError');
                  const msg =
                    (data as { error?: string } | null)?.error ||
                    (error ? await describeInvokeError(error, 'canvas-chat-edit') : 'Could not update canvas.');
                  const finalMsgs = currentMessagesRef.current.map((m) =>
                    m.id === placeholderId ? { ...m, content: `Couldn't update canvas — ${msg}` } : m,
                  );
                  setCurrentMessages(finalMsgs);
                  await saveChat(currentChatId, finalMsgs, currentMode, getModeChangeEvents());
                  return;
                }
                window.dispatchEvent(new CustomEvent('canvas:apply-patch', {
                  detail: { canvasId: canvasIdForEdit, operations: data.operations },
                }));
                const summary: string = data.summary || 'Updated the canvas.';
                const finalMsgs = currentMessagesRef.current.map((m) =>
                  m.id === placeholderId ? { ...m, content: `✏️ Updated canvas — ${summary}` } : m,
                );
                setCurrentMessages(finalMsgs);
                await saveChat(currentChatId, finalMsgs, currentMode, getModeChangeEvents());
              } catch (err) {
                console.error('canvas-chat-edit failed', err);
                const finalMsgs = currentMessagesRef.current.map((m) =>
                  m.id === placeholderId ? { ...m, content: "Couldn't update canvas — try rephrasing." } : m,
                );
                setCurrentMessages(finalMsgs);
              }
              return;
            }

            // Detect "in a new canvas, …" style prompts so the response auto-opens a canvas.
            if (detectCanvasIntent(content)) {
              pendingCanvasIntentRef.current = { userMessageId: null };
            }
            // If the user armed Canvas mode via the + menu, treat this message
            // as a canvas request and clear the armed flag.
            if (canvasArmedRef.current) {
              pendingCanvasIntentRef.current = { userMessageId: null };
              canvasArmedRef.current = false;
              window.dispatchEvent(new CustomEvent('canvas:disarm', { detail: { chatId: currentChatId } }));
            }
            // 🔍 DIAGNOSTIC: Log dual response state before evaluation
            console.group('🔍 DUAL RESPONSE DIAGNOSTIC');
            console.log('State snapshot:', {
              isDualResponseMode: dualResponse.isDualResponseMode,
              pendingDualResponse: dualResponse.pendingDualResponse,
              hasPendingResponse: !!dualResponse.pendingDualResponse,
              messageContent: content.substring(0, 50) + '...',
              attachments: attachments?.length || 0,
              timestamp: new Date().toISOString()
            });
            console.log('Condition evaluation:', {
              check1_isDualMode: dualResponse.isDualResponseMode,
              check2_noPending: !dualResponse.pendingDualResponse,
              WILL_TRIGGER: dualResponse.isDualResponseMode && !dualResponse.pendingDualResponse
            });
            console.groupEnd();

            // Check if dual response mode is active
            if (dualResponse.isDualResponseMode && !dualResponse.pendingDualResponse && !attachments?.length) {
              console.log('✅ ENTERING DUAL RESPONSE FLOW');
              const handled = await dualResponseHandler.handleDualResponseMessage(content);
              console.log('🔍 Dual response handled:', handled);
              if (handled) return; // Dual response handled, don't proceed with regular flow
            } else {
              console.log('❌ SKIPPING DUAL RESPONSE - using regular flow');
            }
            // Auto-sharpen: if enabled, improve the prompt inline then send
            const trimmed = content.trim();
            const isSimpleMessage = trimmed.length < 15 || /^(hi|hello|hey|thanks|thank you|ok|okay|yes|no|sure|tell me more)\b/i.test(trimmed);
            if (promptImprovement.isEnabled && !isSimpleMessage) {
              // Fire-and-forget: improve prompt, then send the improved version
              commentaryLayer.reset();
              setIsSharpening(true);
              try {
                const result = await import('@/api/promptImprovement').then(m => m.improvePrompt(content));
                const finalContent = result.fallback ? content : result.improvedPrompt;
                const wasActuallySharpened = !result.fallback && finalContent !== content;
                setIsSharpening(false);
                await chatHandlers.handleSendMessage(
                  finalContent, 
                  attachments,
                  wasActuallySharpened ? { wasSharpened: true, originalPrompt: content } : undefined
                );
              } catch {
                setIsSharpening(false);
                // Fallback: send original on any error
                await chatHandlers.handleSendMessage(content, attachments);
              }
              return;
            }
            // Cancel any in-flight commentary before sending new message
            commentaryLayer.reset();
            // Regular message flow - NOW WITH ATTACHMENTS!
            await chatHandlers.handleSendMessage(content, attachments);
          }}
          onStartNewChat={handleNewChatClick}
          setCurrentLength={handleLengthChange}
          onSubPromptsChange={handleSubPromptsChange}
          pendingModeChange={pendingModeChange}
          onDismissPendingModeChange={() => setPendingModeChange(null)}
          chatInitialized={currentChatId !== null}
          onMessageSent={() => {
            // Trigger gradient transition immediately when the first message is sent
            if (messages.length === 0) {
              triggerGradient();
            }
            // When user sends message, add divider if there was a pending mode change
            if (pendingModeChange) {
              const divider = {
                id: `divider-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                mode: pendingModeChange,
                timestamp: new Date()
              };
              setModeChangeDividers(prev => [...prev, divider]);
              setPendingModeChange(null);
            }
          }}
          dualResponseMode={dualResponse.isDualResponseMode}
          onToggleDualResponse={(enabled) => {
            const container = messagesContainerRef.current;
            const prevTop = container ? container.scrollTop : undefined;
            dualResponse.toggleDualResponseMode(enabled);
            requestAnimationFrame(() => {
              if (container && prevTop !== undefined) {
                container.scrollTop = prevTop;
              }
            });
          }}
        />
      {currentChat?.folder_id && promoteTarget && (
        <PromoteToKnowledgeDialog
          open={!!promoteTarget}
          onClose={() => setPromoteTarget(null)}
          folderId={currentChat.folder_id}
          chatId={currentChat.id}
          initialContent={promoteTarget.content}
        />
      )}
    </div>
  );
};

export default ChatInterface;
