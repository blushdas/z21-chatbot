import React from 'react';
import { getModeIcon } from '@/utils/modeIcons';
import { useBrand } from '@/context/BrandContext';

interface ModeChangeDividerProps {
  mode: string;
  timestamp: Date;
}

const modeLabelMap: Record<string, string> = {
  standard: "Wisdom Mode",
  quickAnswer: "Standard Mode",
  directQuotes: "Direct Quotes",
  storytelling: "Storytelling",
  noBlueprints: "No Blueprints",
  coach: "Daryle AI"
};

const ModeChangeDivider: React.FC<ModeChangeDividerProps> = ({ mode, timestamp }) => {
  const { brandText } = useBrand();
  const label = brandText(modeLabelMap[mode] || mode);
  const Icon = getModeIcon(mode);
  
  return (
    <div className="flex items-center my-6" data-mode-divider={mode}>
      <div className="flex-1 h-px bg-[var(--chat-border)]"></div>
      <div className="flex items-center gap-2 bg-[var(--chat-card)] text-[var(--chat-text)] px-4 py-2 rounded-full text-sm border border-[var(--chat-border)] mx-4">
        <Icon className="h-4 w-4 text-brand-yellow" />
        <span>
          Switched to {label}
        </span>
        <span className="text-xs text-[var(--chat-muted)]">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div className="flex-1 h-px bg-[var(--chat-border)]"></div>
    </div>
  );
};

export default ModeChangeDivider;