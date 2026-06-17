import React from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import type { VerificationResult } from '@/hooks/useVerificationCompanion';

interface VerificationCompanionMessageProps {
  result: VerificationResult | null;
  loading: boolean;
  error: string | null;
  onReVerify?: () => void;
  timestamp?: Date;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const sectionMeta: { key: keyof VerificationResult; label: string; emoji: string }[] = [
  { key: 'whatSeemssolid', label: 'What Seems Solid', emoji: '✅' },
  { key: 'whatToQuestion', label: 'What to Question', emoji: '🤔' },
  { key: 'whatToVerify', label: 'What to Verify', emoji: '🔍' },
  { key: 'companionPerspective', label: 'Companion Perspective', emoji: '💡' },
];

const VerificationCompanionMessage: React.FC<VerificationCompanionMessageProps> = ({
  result,
  loading,
  error,
  onReVerify,
  timestamp,
}) => {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-5xl mx-auto px-4 py-3"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 h-9 w-9 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-sm">
            <ShieldCheck size={17} className="text-white" />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm font-semibold text-teal-700 dark:text-teal-300">Verification Companion</span>
              <span className="text-[9px] font-bold uppercase tracking-widest bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 px-1.5 py-0.5 rounded-sm">Demo</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              <span className="text-xs text-muted-foreground/70">Analyzing response…</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!result) return null;

  const sections = sectionMeta
    .map(s => ({ ...s, content: result[s.key] }))
    .filter(s => s.content?.trim());

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="max-w-5xl mx-auto px-4 py-3"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0 h-9 w-9 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-sm">
          <ShieldCheck size={17} className="text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          {/* Name line */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-sm font-semibold text-teal-700 dark:text-teal-300">Verification Companion</span>
            <span className="text-[9px] font-bold uppercase tracking-widest bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 px-1.5 py-0.5 rounded-sm">Demo</span>
            {timestamp && (
              <span className="text-[11px] text-muted-foreground/60">{formatTime(timestamp)}</span>
            )}
          </div>

          {error && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1">
              <span>⚠</span> Fallback analysis (live service unavailable)
            </p>
          )}

          {/* Prose body */}
          <div className="text-sm text-foreground/90 leading-relaxed space-y-3">
            {sections.map((s) => (
              <p key={s.key}>
                <span className="font-semibold text-foreground">{s.emoji} {s.label}:</span>{' '}
                <span className="text-muted-foreground">{s.content}</span>
              </p>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-2 flex items-center gap-3">
            {timestamp && (
              <span className="text-[10px] text-muted-foreground/40">{formatTime(timestamp)}</span>
            )}
            {onReVerify && (
              <button
                onClick={onReVerify}
                className="flex items-center gap-1 text-[11px] text-muted-foreground/50 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
              >
                <RefreshCw size={10} />
                Re-verify
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VerificationCompanionMessage;
