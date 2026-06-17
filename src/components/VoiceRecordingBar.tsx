import React from 'react';
import { Check, X, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceRecordingBarProps {
  /** Normalized 0..1 amplitudes, one per bar. */
  levels: number[];
  /** Normalized 0..1 held peak per bar (falls slower than levels). */
  peaks?: number[];
  elapsed: number;
  isTranscribing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Full-width recording overlay shown in place of the chat input, with a
 * ChatGPT-style live waveform, plus a cancel (X) and confirm (✓) on the right.
 */
const VoiceRecordingBar: React.FC<VoiceRecordingBarProps> = ({
  levels,
  peaks,
  elapsed,
  isTranscribing,
  onCancel,
  onConfirm,
}) => {
  const mm = String(Math.floor(elapsed / 60));
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <div className="flex items-center gap-3 px-3 py-3 min-h-[88px]">
      <button
        type="button"
        disabled
        aria-hidden
        className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full text-[var(--chat-muted)] opacity-60"
      >
        <Plus className="h-5 w-5" />
      </button>

      <div className="flex-1 flex items-center gap-3 min-w-0">
        <div className="flex-1 flex items-center justify-center gap-[3px] h-12 overflow-hidden">
          {levels.map((v, i) => {
            // Min baseline so silence renders as a thin centered line.
            const h = Math.max(4, Math.round(v * 44));
            const isActive = v > 0.05;
            const peak = peaks?.[i] ?? 0;
            const peakH = Math.max(h, Math.round(peak * 44));
            const showPeak = peak > v + 0.04;
            return (
              <span
                key={i}
                style={{ height: `${peakH}px` }}
                className="relative w-[3px] flex items-center justify-center"
              >
                {/* Live bar */}
                <span
                  style={{ height: `${h}px` }}
                  className={cn(
                    'absolute left-0 right-0 top-1/2 -translate-y-1/2 rounded-full transition-[height] duration-75',
                    isActive ? 'bg-brand-blue dark:bg-brand-yellow' : 'bg-[var(--chat-muted)]/60',
                  )}
                />
                {/* Held peak indicator (slow falling cap) */}
                {showPeak && (
                  <>
                    <span
                      className="absolute left-0 right-0 h-[2px] rounded-full bg-brand-blue dark:bg-brand-yellow opacity-80"
                      style={{ top: `calc(50% - ${peakH / 2}px)` }}
                    />
                    <span
                      className="absolute left-0 right-0 h-[2px] rounded-full bg-brand-blue dark:bg-brand-yellow opacity-80"
                      style={{ top: `calc(50% + ${peakH / 2 - 2}px)` }}
                    />
                  </>
                )}
              </span>
            );
          })}
        </div>
        <span className="text-xs tabular-nums text-[var(--chat-muted)] shrink-0">
          {mm}:{ss}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel recording"
          className="w-9 h-9 flex items-center justify-center rounded-full text-[var(--chat-muted)] hover:text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)] transition-colors focus-ring"
        >
          <X className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isTranscribing}
          aria-label="Send recording"
          className={cn(
            'w-9 h-9 flex items-center justify-center rounded-full transition-colors',
            'bg-brand-yellow hover:bg-brand-yellow/90 text-brand-blue',
            isTranscribing && 'opacity-70 cursor-wait',
          )}
        >
          {isTranscribing ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
          ) : (
            <Check className="h-4 w-4" strokeWidth={3} />
          )}
        </button>
      </div>
    </div>
  );
};

export default VoiceRecordingBar;