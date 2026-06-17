import React from 'react';
import { Gauge, Rabbit, Brain, Shield } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface PowerChangeDividerProps {
  value: string;
  timestamp: Date;
}

// Keep in sync with POWER_OPTIONS in ChatToolbarSelectors.tsx
const powerIconMap: Record<string, LucideIcon> = {
  auto: Gauge,
  instant: Rabbit,
  thinking: Brain,
  pro: Shield,
};

const powerLabelMap: Record<string, string> = {
  auto: 'Auto',
  instant: 'Instant',
  thinking: 'Thinking',
  pro: 'Pro',
};

const PowerChangeDivider: React.FC<PowerChangeDividerProps> = ({ value, timestamp }) => {
  const key = (value || '').trim().toLowerCase();
  const Icon = powerIconMap[key] || Gauge;
  const label = powerLabelMap[key] || value;

  return (
    <div className="flex items-center my-6" data-power-divider={key}>
      <div className="flex-1 h-px bg-[var(--chat-border)]"></div>
      <div className="flex items-center gap-2 bg-[var(--color-warning-soft)] text-[var(--chat-text)] px-4 py-2 rounded-full text-sm border border-[var(--color-warning-border)] mx-4">
        <Icon className="h-4 w-4 text-[color:var(--color-warning)]" />
        <span>
          Now using <strong>{label}</strong>
        </span>
        <span className="text-xs text-[var(--chat-muted)]">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div className="flex-1 h-px bg-[var(--chat-border)]"></div>
    </div>
  );
};

export default PowerChangeDivider;