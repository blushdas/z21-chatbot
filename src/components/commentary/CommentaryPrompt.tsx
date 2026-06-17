import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircleHeart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CommentaryVoice } from '@/types/commentary';

type CommentaryPromptProps = {
  voice: CommentaryVoice;
  onAccept: () => void;
  onDecline: () => void;
};

const containerVariants = {
  initial: { opacity: 0, y: 10, filter: 'blur(4px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
      filter: { duration: 0.3 },
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    filter: 'blur(4px)',
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

const shimmer = {
  initial: { x: '-100%' },
  animate: {
    x: '200%',
    transition: { duration: 2.5, ease: 'linear', repeat: Infinity, repeatDelay: 3 },
  },
};

const CommentaryPrompt: React.FC<CommentaryPromptProps> = ({
  voice,
  onAccept,
  onDecline,
}) => {
  const acceptRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => acceptRef.current?.focus(), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-4xl mx-auto my-4"
    >
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-brand-yellow/10 via-brand-yellow/5 to-transparent border border-brand-yellow/20 backdrop-blur-sm">
        {/* Shimmer effect */}
        <motion.div
          variants={shimmer}
          initial="initial"
          animate="animate"
          className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-brand-yellow/10 to-transparent skew-x-[-20deg] pointer-events-none"
        />

        {/* Left accent line */}
        <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-gradient-to-b from-brand-yellow via-brand-yellow/60 to-brand-yellow/20" />

        <div className="flex items-center gap-3.5 pl-5 pr-4 py-3.5">
          {/* Avatar — smaller, refined */}
          <div className="flex-shrink-0 h-7 w-7 rounded-full bg-gradient-to-br from-brand-yellow to-brand-yellow/80 flex items-center justify-center shadow-sm ring-2 ring-brand-yellow/20">
            <MessageCircleHeart size={13} className="text-white/90" />
          </div>

          {/* Prompt text */}
          <p className="flex-1 text-[13px] font-serif text-[var(--chat-text)]/80 leading-snug tracking-[-0.01em]">
            Would you like <span className="font-semibold text-[var(--chat-text)]">{voice.name}</span> on this?
          </p>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-2">
            <Button
              ref={acceptRef}
              size="sm"
              onClick={onAccept}
              className="h-7 px-3.5 text-[11px] font-semibold tracking-wide uppercase rounded-lg bg-brand-yellow hover:bg-brand-yellow/90 text-brand-blue shadow-sm transition-all duration-200 hover:shadow-md"
            >
              Yes
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDecline}
              className="h-7 px-3 text-[11px] font-medium text-[var(--chat-muted)] hover:text-[var(--chat-text-secondary)] hover:bg-[var(--ui-bg-hover)] rounded-lg"
            >
              No thanks
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CommentaryPrompt;
