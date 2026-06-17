import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type PromptImprovementCardProps = {
  state: 'offering' | 'generating' | 'reviewing';
  originalPrompt: string;
  improvedPrompt: string | null;
  onAcceptImprovement: () => void;
  onDeclineImprovement: () => void;
  onUseImproved: () => void;
  onKeepOriginal: () => void;
  onUseEdited: (edited: string) => void;
};

// ─── Animation variants ───────────────────────────────────────────────────────

const containerVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const crossfade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

// ─── Offering ────────────────────────────────────────────────────────────────

type OfferingProps = Pick<
  PromptImprovementCardProps,
  'originalPrompt' | 'onAcceptImprovement' | 'onDeclineImprovement'
>;

const OfferingState = React.memo(function OfferingState({
  originalPrompt,
  onAcceptImprovement,
  onDeclineImprovement,
}: OfferingProps) {
  const acceptRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    acceptRef.current?.focus();
  }, []);

  return (
    <motion.div key="offering" {...crossfade} className="space-y-2">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <Sparkles size={14} className="text-brand-yellow shrink-0" />
        <span className="font-heading text-sm font-semibold text-[var(--chat-text)]">
          Want to sharpen this?
        </span>
      </div>

      {/* Prompt preview */}
      <p className="text-sm text-[var(--chat-text-secondary)] line-clamp-2 leading-snug">
        {originalPrompt}
      </p>

      {/* Subtext */}
      <p className="text-xs text-[var(--chat-muted)]">
        I can help phrase this to get a better answer
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-0.5">
        <Button
          ref={acceptRef}
          size="sm"
          className="bg-brand-yellow hover:bg-brand-yellow/90 text-brand-blue h-7 text-xs px-3"
          onClick={onAcceptImprovement}
        >
          Yes, improve it
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-[var(--chat-text-secondary)] h-7 text-xs px-3"
          onClick={onDeclineImprovement}
        >
          No thanks
        </Button>
      </div>
    </motion.div>
  );
});

// ─── Generating ───────────────────────────────────────────────────────────────

const GeneratingState = React.memo(function GeneratingState() {
  return (
    <motion.div key="generating" {...crossfade} className="space-y-2.5">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <Sparkles size={14} className="text-brand-yellow shrink-0 animate-pulse" />
        <span className="font-heading text-sm text-[var(--chat-text-secondary)]">
          Improving…
        </span>
      </div>

      {/* Single shimmer bar */}
      <div className="h-2 w-3/4 rounded-full bg-gradient-to-r from-brand-yellow/20 via-brand-yellow/40 to-brand-yellow/20 animate-pulse" />
    </motion.div>
  );
});

// ─── Reviewing ───────────────────────────────────────────────────────────────

type ReviewingProps = Pick<
  PromptImprovementCardProps,
  | 'originalPrompt'
  | 'improvedPrompt'
  | 'onUseImproved'
  | 'onKeepOriginal'
  | 'onUseEdited'
>;

const ReviewingState = React.memo(function ReviewingState({
  originalPrompt,
  improvedPrompt,
  onUseImproved,
  onKeepOriginal,
  onUseEdited,
}: ReviewingProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(improvedPrompt ?? '');
  const useThisRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    useThisRef.current?.focus();
  }, []);

  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus();
    }
  }, [isEditing]);

  const handleEdit = () => {
    setEditedText(improvedPrompt ?? '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSubmitEdited = () => {
    onUseEdited(editedText.trim());
    setIsEditing(false);
  };

  return (
    <motion.div key="reviewing" {...crossfade} className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <Sparkles size={14} className="text-brand-yellow shrink-0" />
        <span className="font-heading text-sm font-semibold text-[var(--chat-text)]">
          Here&apos;s a sharper version
        </span>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 md:gap-4 gap-2">
        {/* Left — Original (muted) */}
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-[var(--chat-muted)] font-heading">
            Your question
          </p>
          <p className="text-xs text-[var(--chat-muted)] leading-relaxed">
            {originalPrompt}
          </p>
        </div>

        {/* Right — Improved (promoted) */}
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-brand-yellow font-heading">
            Suggested
          </p>

          <AnimatePresence mode="wait" initial={false}>
            {isEditing ? (
              <motion.div
                key="textarea"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.2 } }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
              >
                <Textarea
                  ref={textareaRef}
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className={cn(
                    'bg-[var(--chat-input-bg)] border-brand-yellow/30 text-[var(--chat-text)] text-sm',
                    'resize-none focus-visible:ring-brand-yellow/40',
                  )}
                  rows={3}
                />
              </motion.div>
            ) : (
              <motion.p
                key="static"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.2 } }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                className="text-sm text-[var(--chat-text)] leading-relaxed border-l-2 border-brand-yellow/40 pl-3"
              >
                {improvedPrompt}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <Button
              size="sm"
              className="bg-brand-yellow hover:bg-brand-yellow/90 text-brand-blue h-7 text-xs px-3"
              onClick={handleSubmitEdited}
              disabled={editedText.trim().length === 0}
            >
              Submit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-[var(--chat-text-secondary)] h-7 text-xs px-3"
              onClick={handleCancelEdit}
            >
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button
              ref={useThisRef}
              size="sm"
              className="bg-brand-yellow hover:bg-brand-yellow/90 text-brand-blue h-7 text-xs px-3 gap-1"
              onClick={onUseImproved}
            >
              Use this
              <ArrowRight size={12} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-[var(--chat-text-secondary)] h-7 text-xs px-3"
              onClick={onKeepOriginal}
            >
              Keep mine
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-3 gap-1"
              onClick={handleEdit}
            >
              <Pencil size={11} />
              Edit
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
});

// ─── Root ─────────────────────────────────────────────────────────────────────

const PromptImprovementCard = React.memo(function PromptImprovementCard({
  state,
  originalPrompt,
  improvedPrompt,
  onAcceptImprovement,
  onDeclineImprovement,
  onUseImproved,
  onKeepOriginal,
  onUseEdited,
}: PromptImprovementCardProps) {
  return (
    <motion.div
      layout
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      role="region"
      aria-label="Prompt improvement suggestion"
      className={cn(
        'border-l-4 border-brand-yellow',
        'bg-brand-yellow/5',
        'rounded-r-xl',
        'py-3 px-4',
        'shadow-sm',
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {state === 'offering' && (
          <OfferingState
            originalPrompt={originalPrompt}
            onAcceptImprovement={onAcceptImprovement}
            onDeclineImprovement={onDeclineImprovement}
          />
        )}

        {state === 'generating' && <GeneratingState />}

        {state === 'reviewing' && (
          <ReviewingState
            originalPrompt={originalPrompt}
            improvedPrompt={improvedPrompt}
            onUseImproved={onUseImproved}
            onKeepOriginal={onKeepOriginal}
            onUseEdited={onUseEdited}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default PromptImprovementCard;
export type { PromptImprovementCardProps };
