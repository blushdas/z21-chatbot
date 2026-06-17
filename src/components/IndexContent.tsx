import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import ChatInterface from './ChatInterface';
import SavedChatsSidebar from './SavedChatsSidebar';
import { useSidebarState } from '@/hooks/useSidebarState';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useChatManagement } from '@/hooks/useChatManagement';
import MobileSidebarDrawer from './MobileSidebarDrawer';
import AlphaBadge from './canvas/AlphaBadge';
import { useStreamingCompletionToast } from '@/hooks/useStreamingCompletionToast';
import { useAppReady } from '@/context/AppReadyContext';
import ChatLoadingSkeleton from './ChatLoadingSkeleton';
import VerificationPanel from './verification/VerificationPanel';
import CommentarySidebar from './commentary/CommentarySidebar';
import { useCommentaryLayer } from '@/hooks/useCommentaryLayer';
import { VerificationProvider } from '@/context/VerificationContext';
import ResourcesPanel from './ResourcesPanel';
import CanvasPanel from './canvas/CanvasPanel';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { X, MessageSquare, FileText as CanvasIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

const IndexContent = () => {
  const { isOpen } = useSidebarState();
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const rawCanvasId = searchParams.get('canvas');
  // Canvas is disabled on mobile — ignore any ?canvas= param and never render the panel.
  const canvasId = isMobile ? null : rawCanvasId;
  // Strip ?canvas= from the URL on mobile so shared links land cleanly on the chat.
  useEffect(() => {
    if (!isMobile || !rawCanvasId) return;
    const next = new URLSearchParams(searchParams);
    next.delete('canvas');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, rawCanvasId]);
  // Mobile: when a canvas is open, toggle which panel is visible.
  const [mobileView, setMobileView] = useState<'chat' | 'canvas'>('chat');
  useEffect(() => {
    if (canvasId) setMobileView('canvas');
    else setMobileView('chat');
  }, [canvasId]);

  // Mirror the URL canvas id into localStorage so brand-new tabs / lost
  // query strings can still restore the panel.
  useEffect(() => {
    if (canvasId) {
      localStorage.setItem('currentCanvasId', canvasId);
      // Remember which canvas was last opened for this specific chat so we
      // can auto-restore it across sessions when the user returns.
      if (chatId) {
        try { localStorage.setItem(`lastCanvas:${chatId}`, canvasId); } catch { /* ignore */ }
      }
    } else {
      localStorage.removeItem('currentCanvasId');
    }
  }, [canvasId, chatId]);

  const closeCanvas = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('canvas');
    setSearchParams(next, { replace: true });
    localStorage.removeItem('currentCanvasId');
    if (chatId) {
      // Remember user explicitly closed canvas for this chat in this tab,
      // so we don't auto-reopen it on every navigation.
      sessionStorage.setItem(`canvasClosed:${chatId}`, '1');
      // Also clear the persisted "last canvas for this chat" so future
      // sessions don't auto-open it after an explicit close.
      try { localStorage.removeItem(`lastCanvas:${chatId}`); } catch { /* ignore */ }
    }
  };

  // Build a path that preserves the current `?canvas=...` (and other params).
  const withSearch = (pathname: string) => {
    const qs = searchParams.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };
  const [resumedChatId, setResumedChatId] = useState<string | null>(null);
  const [splitScreenVerification, setSplitScreenVerification] = useState(false);
  const [commentarySidebarOpen, setCommentarySidebarOpen] = useState(false);
  const [resourcesPanelOpen, setResourcesPanelOpen] = useState(false);
  const commentaryLayer = useCommentaryLayer(chatId);
  
  const { user } = useAuth();
  const { initialized, savedChats } = useChatManagement();
  const { isAppReady } = useAppReady();
  const hasCreatedInitialChatRef = useRef(false);

  // Wire up background streaming completion toast
  useStreamingCompletionToast();

  // Resume last chat on navigation - only create new chat when user clicks "New Chat"
  useEffect(() => {
    const handleInitialNavigation = async () => {
      if (!user || !initialized || chatId || hasCreatedInitialChatRef.current) {
        return;
      }

      hasCreatedInitialChatRef.current = true;
      
      try {
        const lastActiveChatId = localStorage.getItem('currentChatId');

        // Preserve ?canvas= and any other search params across the redirect
        // so a refresh on `/chat?canvas=X` keeps the canvas open.
        let qs = searchParams.toString();
        if (!qs) {
          const savedCanvas = localStorage.getItem('currentCanvasId');
          if (savedCanvas) qs = `canvas=${encodeURIComponent(savedCanvas)}`;
        }
        const suffix = qs ? `?${qs}` : '';

        if (lastActiveChatId && savedChats.some(chat => chat.id === lastActiveChatId)) {
          console.log('📍 Resuming last active chat:', lastActiveChatId);
          navigate(`/chat/${lastActiveChatId}${suffix}`, { replace: true });
        } else if (savedChats.length > 0) {
          const mostRecentChat = savedChats[0];
          console.log('📍 Resuming most recent chat:', mostRecentChat.id);
          navigate(`/chat/${mostRecentChat.id}${suffix}`, { replace: true });
        }
      } catch (error) {
        console.error('❌ Failed to handle initial navigation:', error);
        hasCreatedInitialChatRef.current = false;
      }
    };

    handleInitialNavigation();
  }, [user, initialized, chatId, navigate, savedChats]);

  useEffect(() => {
    if (chatId) {
      setResumedChatId(chatId);
      localStorage.setItem('currentChatId', chatId);
    } else {
      setResumedChatId(null);
      localStorage.removeItem('currentChatId');
    }
  }, [chatId]);

  const handleResumeChat = (chat: any) => {
    setResumedChatId(chat.id);
  };

  const handleStartNewChat = () => {
    setResumedChatId(null);
  };

  const handleNewChatFromInterface = (newChatId: string) => {
    navigate(withSearch(`/chat/${newChatId}`), { replace: true });
  };

  // Auto-restore the most recent canvas for the active chat
  // (chat-native: returning to a chat brings its canvas back).
  useEffect(() => {
    if (isMobile) return;
    if (!chatId || canvasId) return;
    if (sessionStorage.getItem(`canvasClosed:${chatId}`) === '1') return;
    let cancelled = false;
    void (async () => {
      // 1. Prefer the canvas the user last had open in this chat (persisted
      //    across sessions). Verify it still exists & is active.
      let nextCanvasId: string | null = null;
      const remembered = (() => {
        try { return localStorage.getItem(`lastCanvas:${chatId}`); } catch { return null; }
      })();
      if (remembered) {
        const { data: row } = await supabase
          .from('canvases')
          .select('id')
          .eq('id', remembered)
          .eq('chat_id', chatId)
          .eq('status', 'active')
          .maybeSingle();
        if (row?.id) nextCanvasId = row.id;
        else {
          // Stale pointer — clean up.
          try { localStorage.removeItem(`lastCanvas:${chatId}`); } catch { /* ignore */ }
        }
      }
      // 2. Fallback: most recently opened canvas for this chat.
      if (!nextCanvasId) {
        const { data } = await supabase
          .from('canvases')
          .select('id')
          .eq('chat_id', chatId)
          .eq('status', 'active')
          .order('last_opened_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data?.id) nextCanvasId = data.id;
      }
      if (cancelled || !nextCanvasId) return;
      const next = new URLSearchParams(searchParams);
      next.set('canvas', nextCanvasId);
      setSearchParams(next, { replace: true });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  // Listen for explicit chat-triggered "open the canvas" requests. Fired by
  // ChatInterface when the user says e.g. "update the canvas" while no
  // canvas is currently open in this chat.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ canvasId: string; chatId?: string }>).detail;
      if (!detail?.canvasId) return;
      if (detail.chatId && chatId && detail.chatId !== chatId) return;
      if (chatId) sessionStorage.removeItem(`canvasClosed:${chatId}`);
      const next = new URLSearchParams(searchParams);
      next.set('canvas', detail.canvasId);
      setSearchParams(next, { replace: true });
    };
    window.addEventListener('canvas:open-request', handler as EventListener);
    return () => window.removeEventListener('canvas:open-request', handler as EventListener);
  }, [chatId, searchParams, setSearchParams]);

  const handleToggleSplitScreen = (enabled: boolean) => {
    setSplitScreenVerification(enabled);
    toast(enabled ? '🛡️ Split-Screen Verification Enabled' : 'Split-Screen Verification Disabled', {
      description: enabled
        ? 'Verification panel is now visible alongside the chat.'
        : 'Verification panel closed.',
      duration: 3000,
    });
  };

  return (
    <VerificationProvider>
      <div className="relative flex h-screen-safe no-bounce">
        {/* Skeleton overlay — crossfades out when app is ready */}
        {user && (
          <div className={`absolute inset-0 z-50 transition-opacity duration-300 ${
            isAppReady ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}>
            <ChatLoadingSkeleton />
          </div>
        )}

      {/* Main UI — fades in when ready */}
      <div className={`flex w-full h-full ${isAppReady ? 'animate-app-entrance' : 'opacity-0'}`}>
        <MobileSidebarDrawer onResumeChat={handleResumeChat} onStartNewChat={handleStartNewChat} />
        
        {/* Sidebar */}
        <div
          className={`hidden sm:block h-full overflow-hidden ${
            user ? (isOpen ? 'w-[288px] shrink-0' : 'w-0 shrink') : 'w-[288px] shrink-0'
          }`}
          aria-hidden={user ? !isOpen : false}
          data-tour="saved-chats"
        >
          <SavedChatsSidebar 
            onResumeChat={handleResumeChat}
            onStartNewChat={handleStartNewChat}
          />
        </div>
        
        {/* Main content — always mounted, flex adjusts for verification panel */}
        <div
          className={`flex flex-col min-h-0 min-w-0 overflow-hidden relative transition-all duration-300 ${
            canvasId && mobileView === 'canvas' ? 'hidden md:flex' : 'flex'
          }`}
          style={{ flex: canvasId ? '1 1 0%' : '1 1 0%' }}
          data-tour="chat-area"
        >
          <ChatInterface
            resumedChatId={resumedChatId}
            onStartNewChat={handleNewChatFromInterface}
            key={resumedChatId || 'new-chat'}
            splitScreenVerification={splitScreenVerification}
            onToggleSplitScreenVerification={handleToggleSplitScreen}
            commentarySidebarOpen={commentarySidebarOpen}
            onToggleCommentarySidebar={setCommentarySidebarOpen}
            onToggleResourcesPanel={() => setResourcesPanelOpen((v) => !v)}
          />
        </div>

        {/* Split-screen canvas panel */}
        <AnimatePresence initial={false}>
          {canvasId && (
            <motion.div
              key="canvas-panel"
              initial={{ flexGrow: 0, opacity: 0, x: 40 }}
              animate={{ flexGrow: 2, opacity: 1, x: 0 }}
              exit={{ flexGrow: 0, opacity: 0, x: 40 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className={`h-full min-w-0 overflow-hidden border-l border-border flex-col ${
                mobileView === 'canvas' ? 'flex' : 'hidden md:flex'
              }`}
              style={{ flexBasis: 0, flexShrink: 1 }}
            >
              <div className="flex h-9 shrink-0 items-center justify-between border-b border-border bg-background/80 px-2 backdrop-blur">
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  Canvas
                  <AlphaBadge />
                </span>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={closeCanvas} title="Close canvas">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
                <CanvasPanel canvasId={canvasId} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile chat/canvas toggle (only visible when a canvas is attached to this chat) */}
        {canvasId && (
          <div className="md:hidden fixed bottom-3 left-1/2 z-30 -translate-x-1/2 rounded-full border border-border bg-background/95 p-1 shadow-lg backdrop-blur">
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setMobileView('chat')}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors ${
                  mobileView === 'chat' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Chat
              </button>
              <button
                type="button"
                onClick={() => setMobileView('canvas')}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors ${
                  mobileView === 'canvas' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                <CanvasIcon className="h-3.5 w-3.5" />
                Canvas
              </button>
            </div>
          </div>
        )}

        {/* Split-screen verification panel */}
        {splitScreenVerification && (
          <div className="h-full overflow-hidden border-l border-border" style={{ flex: '1 1 0%' }}>
            <VerificationPanel />
          </div>
        )}

        {/* Commentary sidebar panel */}
        {commentarySidebarOpen && commentaryLayer.displayMode === 'sidebar' && (
          <div className="h-full overflow-hidden border-l border-amber-200/60" style={{ flex: '0 0 340px' }}>
            <CommentarySidebar
              commentaryLayer={commentaryLayer}
              onClose={() => setCommentarySidebarOpen(false)}
            />
          </div>
        )}

        {/* Resources Panel */}
        <ResourcesPanel
          isOpen={resourcesPanelOpen}
          onClose={() => setResourcesPanelOpen(false)}
        />
      </div>
      </div>
    </VerificationProvider>
  );
};

export default IndexContent;
