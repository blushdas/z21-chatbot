import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import ChatInterface from '@/components/ChatInterface';
import SavedChatsSidebar from '@/components/SavedChatsSidebar';
import { useSidebarState } from '@/hooks/useSidebarState';
import { useAuth } from '@/context/SupabaseAuthContext';
import MobileSidebarDrawer from '@/components/MobileSidebarDrawer';
import AlphaBadge from '@/components/canvas/AlphaBadge';
import { useAppReady } from '@/context/AppReadyContext';
import ChatLoadingSkeleton from '@/components/ChatLoadingSkeleton';
import VerificationPanel from '@/components/verification/VerificationPanel';
import CommentarySidebar from '@/components/commentary/CommentarySidebar';
import { useCommentaryLayer } from '@/hooks/useCommentaryLayer';
import { VerificationProvider } from '@/context/VerificationContext';
import ResourcesPanel from '@/components/ResourcesPanel';
import CanvasPanel from '@/components/canvas/CanvasPanel';
import { AnimatePresence, motion } from 'framer-motion';
import { X, MessageSquare } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const { isOpen } = useSidebarState();
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const { isReady } = useAppReady();

  const rawCanvasId = searchParams.get('canvas');
  const canvasId = isMobile ? null : rawCanvasId;

  const [mobileView, setMobileView] = useState<'chat' | 'canvas'>('chat');

  useEffect(() => {
    if (!isMobile || !rawCanvasId) return;
    const next = new URLSearchParams(searchParams);
    next.delete('canvas');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, rawCanvasId]);

  useEffect(() => {
    if (canvasId) setMobileView('canvas');
    else setMobileView('chat');
  }, [canvasId]);

  const { commentarySidebarOpen } = useCommentaryLayer();
  const [showVerification, setShowVerification] = useState(false);

  if (!isReady) {
    return <ChatLoadingSkeleton />;
  }

  return (
    <VerificationProvider>
      <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-black">
        {/* Desktop sidebar */}
        {!isMobile && isOpen && (
          <aside className="w-64 flex-shrink-0 border-r border-border overflow-y-auto">
            <SavedChatsSidebar />
          </aside>
        )}

        {/* Mobile sidebar drawer */}
        <MobileSidebarDrawer>
          <SavedChatsSidebar />
        </MobileSidebarDrawer>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Mobile: show chat or canvas */}
          {isMobile && mobileView === 'canvas' ? (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-black">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Canvas</span>
                <button
                  onClick={() => setMobileView('chat')}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <CanvasPanel />
            </div>
          ) : (
            <ChatInterface
              commentarySidebarOpen={commentarySidebarOpen}
              onToggleCommentarySidebar={(open) => {
                // commentary toggle handled by hook
              }}
            />
          )}
        </div>

        {/* Right panels */}
        {!isMobile && (
          <>
            <AnimatePresence>
              {commentarySidebarOpen && (
                <motion.aside
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 320, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-80 flex-shrink-0 border-l border-border overflow-y-auto"
                >
                  <CommentarySidebar />
                </motion.aside>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {canvasId && (
                <motion.aside
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 400, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-[400px] flex-shrink-0 border-l border-border overflow-y-auto"
                >
                  <CanvasPanel />
                </motion.aside>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </VerificationProvider>
  );
};

export default Index;
