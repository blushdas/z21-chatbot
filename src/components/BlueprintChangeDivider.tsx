import React from 'react';
import { Sparkles, MessageSquareQuote, BookOpen } from 'lucide-react';
import type { ResponseMode } from '@/types/chat';

interface BlueprintChangeDividerProps {
  mode: ResponseMode;
  timestamp: Date;
}

const labelMap: Record<ResponseMode, string> = {
  coaching: 'Coaching',
  direct_quotes: 'Direct Quotes',
  storytelling: 'Storytelling',
};

const iconMap: Record<ResponseMode, React.ComponentType<{ className?: string }>> = {
  coaching: Sparkles,
  direct_quotes: MessageSquareQuote,
  storytelling: BookOpen,
};

const BlueprintChangeDivider: React.FC<BlueprintChangeDividerProps> = ({ mode, timestamp }) => {
  const Icon = iconMap[mode] ?? Sparkles;
  const label = labelMap[mode] ?? String(mode);
  return (
    <div className="flex items-center my-6" data-blueprint-divider={mode}>
      <div className="flex-1 h-px bg-[var(--chat-border)]" />
      <div className="flex items-center gap-2 bg-[var(--chat-card)] text-[var(--chat-text)] px-4 py-2 rounded-full text-sm border border-[var(--chat-border)] mx-4">
        <Icon className="h-4 w-4 text-brand-yellow" />
        <span>
          Switched blueprint to <strong>{label}</strong>
        </span>
        <span className="text-xs text-[var(--chat-muted)]">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div className="flex-1 h-px bg-[var(--chat-border)]" />
    </div>
  );
};

export default BlueprintChangeDivider;