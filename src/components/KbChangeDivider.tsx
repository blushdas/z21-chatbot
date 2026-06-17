import React from 'react';
import { BookOpen, BookX } from 'lucide-react';

interface KbChangeDividerProps {
  label: string;
  enabled: boolean;
  timestamp: Date;
}

const KbChangeDivider: React.FC<KbChangeDividerProps> = ({ label, enabled, timestamp }) => {
  const Icon = enabled ? BookOpen : BookX;
  const message = enabled ? (
    <>Now using <strong>{label}</strong></>
  ) : (
    <>Knowledge base <strong>off</strong></>
  );

  return (
    <div className="flex items-center my-6" data-kb-divider={enabled ? 'on' : 'off'}>
      <div className="flex-1 h-px bg-[var(--chat-border)]"></div>
      <div className="flex items-center gap-2 bg-sky-500/10 text-[var(--chat-text)] px-4 py-2 rounded-full text-sm border border-sky-500/20 mx-4">
        <Icon className={`h-4 w-4 ${enabled ? 'text-sky-500' : 'text-amber-500'}`} />
        <span>{message}</span>
        <span className="text-xs text-[var(--chat-muted)]">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div className="flex-1 h-px bg-[var(--chat-border)]"></div>
    </div>
  );
};

export default KbChangeDivider;