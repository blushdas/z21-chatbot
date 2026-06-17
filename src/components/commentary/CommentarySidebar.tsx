import React, { useRef, useEffect } from 'react';
import { MessageCircleHeart, X, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import CommentaryBlock from './CommentaryBlock';
import type { UseCommentaryLayerReturn } from '@/hooks/useCommentaryLayer';

type CommentarySidebarProps = {
  commentaryLayer: UseCommentaryLayerReturn;
  onClose: () => void;
};

const headerVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

const emptyVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.15 },
  },
};

const CommentarySidebar: React.FC<CommentarySidebarProps> = ({
  commentaryLayer,
  onClose,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const entries = Object.values(commentaryLayer.commentaryMap);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [entries.length, commentaryLayer.streamingContent]);

  return (
    <motion.div
      variants={headerVariants}
      initial="initial"
      animate="animate"
      className="h-full flex flex-col"
      style={{
        background: 'linear-gradient(180deg, rgba(246,240,225,0.3) 0%, rgba(255,255,255,0.95) 40%, #ffffff 100%)',
      }}
    >
      {/* Header */}
      <div className="relative flex items-center justify-between px-4 py-3.5 border-b border-brand-yellow/10">
        {/* Warm gradient accent at top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-yellow/40 via-brand-yellow to-brand-yellow/40" />

        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-yellow to-brand-yellow/80 flex items-center justify-center shadow-sm ring-2 ring-brand-yellow/15">
            <MessageCircleHeart size={14} className="text-white/90" />
          </div>
          <div>
            <h3 className="text-[13px] font-heading font-semibold text-[var(--chat-text)] leading-tight">
              {commentaryLayer.activeVoice.name}
            </h3>
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-brand-yellow/70 mt-0.5">
              Advisory Companion
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-7 w-7 p-0 text-[var(--chat-text)]/25 hover:text-[var(--chat-muted)] hover:bg-[var(--ui-bg-hover)] rounded-lg"
        >
          <X size={13} />
        </Button>
      </div>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4">
        {entries.length === 0 && !commentaryLayer.isGenerating ? (
          <motion.div
            variants={emptyVariants}
            initial="initial"
            animate="animate"
            className="flex flex-col items-center justify-center h-full text-center px-8"
          >
            {/* Decorative book icon with gold ring */}
            <div className="relative mb-5">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-yellow/15 to-transparent border border-brand-yellow/10 flex items-center justify-center shadow-sm">
                <BookOpen size={22} className="text-brand-yellow/50" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-br from-brand-yellow to-brand-yellow/80 flex items-center justify-center ring-2 ring-white">
                <MessageCircleHeart size={9} className="text-white" />
              </div>
            </div>

            <p className="text-[13px] font-heading font-semibold text-[var(--chat-text-secondary)] mb-1.5">
              Perspective awaiting
            </p>
            <p className="text-[11px] text-[var(--chat-muted)] leading-relaxed max-w-[200px]">
              As you chat, {commentaryLayer.activeVoice.name.replace("'s Perspective", "")} will offer advisory commentary on each response.
            </p>

            {/* Decorative separator */}
            <div className="flex items-center gap-2 mt-6 opacity-30">
              <div className="h-px w-8 bg-brand-yellow" />
              <div className="h-1 w-1 rounded-full bg-brand-yellow" />
              <div className="h-px w-8 bg-brand-yellow" />
            </div>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {entries.map((entry) => (
              <div key={entry.messageId} className="mb-3">
                <CommentaryBlock
                  entry={entry}
                  voice={commentaryLayer.activeVoice}
                  onDismiss={() => commentaryLayer.dismissCommentary(entry.messageId)}
                  compact
                />
              </div>
            ))}

            {commentaryLayer.isGenerating && commentaryLayer.currentOffer && (
              <div className="mb-3">
                <CommentaryBlock
                  voice={commentaryLayer.activeVoice}
                  isStreaming
                  streamingContent={commentaryLayer.streamingContent}
                  compact
                />
              </div>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
};

export default CommentarySidebar;
