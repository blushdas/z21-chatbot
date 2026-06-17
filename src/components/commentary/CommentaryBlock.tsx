import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircleHeart, X } from 'lucide-react';
import type { CommentaryVoice, CommentaryEntry } from '@/types/commentary';

type CommentaryBlockProps = {
  entry?: CommentaryEntry;
  voice: CommentaryVoice;
  isStreaming?: boolean;
  streamingContent?: string;
  onDismiss?: () => void;
  compact?: boolean;
};

const blockVariants = {
  initial: { opacity: 0, y: 14, filter: 'blur(6px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
      filter: { duration: 0.35 },
    },
  },
  exit: {
    opacity: 0,
    filter: 'blur(4px)',
    transition: { duration: 0.2 },
  },
};

const cursorBlink = {
  animate: {
    opacity: [1, 0.3, 1],
    transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
  },
};

const CommentaryBlock: React.FC<CommentaryBlockProps> = ({
  entry,
  voice,
  isStreaming = false,
  streamingContent = '',
  onDismiss,
  compact = false,
}) => {
  const content = isStreaming ? streamingContent : entry?.content ?? '';

  if (!content && !isStreaming) return null;

  return (
    <motion.div
      variants={blockVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={compact ? 'my-2' : 'max-w-4xl mx-auto my-4'}
    >
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-brand-yellow/10 via-brand-yellow/5 to-transparent border border-brand-yellow/15 shadow-[0_1px_3px_rgba(167,137,64,0.08)]">
        {/* Left accent — warm gold gradient bar */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-brand-yellow via-brand-yellow/70 to-brand-yellow/30" />

        {/* Subtle grain texture overlay */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

        <div className="relative pl-5 pr-4 py-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            {/* Avatar */}
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-brand-yellow to-brand-yellow/80 flex items-center justify-center shadow-sm ring-2 ring-brand-yellow/15">
              <MessageCircleHeart size={14} className="text-white/90" />
            </div>

            {/* Label row */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <span className="text-[13px] font-heading font-semibold text-[var(--chat-text)]">
                {voice.name}
              </span>
              <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-brand-yellow/80 bg-brand-yellow/[0.08] px-1.5 py-0.5 rounded">
                Advisory
              </span>
            </div>

            {/* Dismiss */}
            {onDismiss && !isStreaming && (
              <button
                onClick={onDismiss}
                className="text-[var(--chat-text)]/20 hover:text-[var(--chat-muted)] transition-colors p-1 rounded-md hover:bg-[var(--ui-bg-hover)]"
                aria-label="Dismiss commentary"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Content — editorial serif feel */}
          <div className="text-[13.5px] leading-[1.7] font-serif text-[var(--chat-text)]/75 pl-11">
            {content.split('\n').filter(Boolean).map((paragraph, i) => (
              <p key={i} className={i > 0 ? 'mt-2.5' : ''}>
                {paragraph}
              </p>
            ))}

            {/* Streaming cursor — warm gold blinking bar */}
            {isStreaming && (
              <motion.span
                variants={cursorBlink}
                animate="animate"
                className="inline-block w-[2px] h-[14px] bg-brand-yellow rounded-full ml-0.5 align-text-bottom"
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CommentaryBlock;
