import React from 'react';
import { Sparkles, Zap, Brain, Shield, ArrowRightLeft } from 'lucide-react';
import { getModelLabel } from '@/utils/messageMetadataLabels';
import geminiIcon from '@/assets/models/gemini.png';
import claudeIcon from '@/assets/models/claude.png';
import openaiIcon from '@/assets/models/openai.png';

interface ModelChangeDividerProps {
  model: string;
  timestamp: Date;
}

const ChatGPTBrandIcon: React.FC<{ className?: string }> = ({ className }) => (
  <img src={openaiIcon} alt="ChatGPT" className={`${className ?? ''} object-contain dark:invert`} draggable={false} />
);
const GeminiBrandIcon: React.FC<{ className?: string }> = ({ className }) => (
  <img src={geminiIcon} alt="Gemini" className={`${className ?? ''} object-contain`} draggable={false} />
);
const ClaudeBrandIcon: React.FC<{ className?: string }> = ({ className }) => (
  <img src={claudeIcon} alt="Claude" className={`${className ?? ''} object-contain`} draggable={false} />
);

const modelIconMap: Record<string, React.ElementType> = {
  auto: Sparkles,
  grounded: Zap,
  fast: Brain,
  deep: Shield,
  instant: Zap,
  thinking: Brain,
  pro: Shield,
  chatgpt: ChatGPTBrandIcon,
  claude: ClaudeBrandIcon,
  gemini: GeminiBrandIcon,
  'chatgpt-claude': ArrowRightLeft,
};

const ModelChangeDivider: React.FC<ModelChangeDividerProps> = ({ model, timestamp }) => {
  const Icon = modelIconMap[model] || Sparkles;
  const label = getModelLabel(model);
  
  return (
    <div className="flex items-center my-6" data-model-divider={model}>
      <div className="flex-1 h-px bg-[var(--chat-border)]"></div>
      <div className="flex items-center gap-2 bg-blue-500/10 text-[var(--chat-text)] px-4 py-2 rounded-full text-sm border border-blue-500/20 mx-4">
        <Icon className="h-4 w-4 text-blue-600 dark:text-blue-300" />
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

export default ModelChangeDivider;
