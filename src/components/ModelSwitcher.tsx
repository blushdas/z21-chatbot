import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Sparkles, Brain, Shield, LayoutGrid, Feather, ArrowRightLeft, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/SupabaseAuthContext';

interface ModelSwitcherProps {
  currentModel: string;
  onModelChange: (model: string) => void;
  useKnowledgebase: boolean;
  onKnowledgebaseChange: (value: boolean) => void;
  disabled?: boolean;
  openUpward?: boolean;
}

type ModelOption = { label: string; value: string; icon: React.ElementType; description: string; adminOnly?: boolean; isChain?: boolean; isLocked?: boolean };

const MODES: ModelOption[] = [
  { label: 'Auto', value: 'auto', icon: Sparkles, description: 'Selects the best available model' },
  { label: 'Thinking', value: 'fast', icon: Brain, description: 'Reason through complex problems' },
  { label: 'Pro', value: 'pro', icon: Shield, description: 'Most capable for expert work — takes the most time' },
];

const MODELS: ModelOption[] = [
  { label: 'GPT-5.4', value: 'chatgpt', icon: LayoutGrid, description: 'OpenAI GPT-5.4 — structured, comprehensive answers' },
  { label: 'Gemini 2.5 Pro', value: 'gemini', icon: Sparkles, description: 'Google Gemini 2.5 Pro — broad coverage and speed' },
  { label: 'Claude Sonnet 4.6', value: 'claude', icon: Feather, description: 'Anthropic Sonnet 4.6 — nuanced, natural writing' },
  { label: 'Claude Opus 4.7', value: 'pro', icon: Feather, description: 'Anthropic Opus 4.7 — most capable model', isLocked: true },
];

const ADMIN_MODELS: ModelOption[] = [
  { label: 'Structure + Polish', value: 'chatgpt-claude', icon: ArrowRightLeft, description: 'GPT-5.1 structures, then Claude Sonnet 4.6 polishes (2-step)', isChain: true },
];

const ALL_OPTIONS = [...MODES, ...MODELS, ...ADMIN_MODELS];

function getLabel(model: string): string {
  return ALL_OPTIONS.find(o => o.value === model)?.label ?? 'Auto';
}

function getIcon(model: string): React.ElementType {
  return ALL_OPTIONS.find(o => o.value === model)?.icon ?? Sparkles;
}

const ModelSwitcher: React.FC<ModelSwitcherProps> = ({
  currentModel,
  onModelChange,
  useKnowledgebase,
  onKnowledgebaseChange,
  disabled = false,
  openUpward = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';

  const Icon = getIcon(currentModel);
  const label = getLabel(currentModel);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (value: string) => {
    onModelChange(value);
    setIsOpen(false);
  };

  const renderRow = (opt: ModelOption) => {
    const selected = currentModel === opt.value;
    const RowIcon = opt.icon;
    return (
      <button
        key={opt.value}
        onClick={() => !opt.isLocked && select(opt.value)}
        className={cn(
          'w-full text-left px-3 py-2.5 transition-colors flex items-start gap-3',
          opt.isLocked
            ? 'opacity-50 cursor-not-allowed'
            : selected ? 'bg-brand-green/10 text-brand-green' : 'text-[var(--chat-text)] hover:bg-[var(--chat-card-2)]'
        )}
      >
        <RowIcon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', selected ? 'text-brand-green' : 'text-[var(--chat-muted)]')} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{opt.label}</span>
            {selected && !opt.isLocked && <div className="w-1.5 h-1.5 bg-brand-green rounded-full" />}
            {opt.isLocked && (
              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-[var(--chat-muted)] border border-[var(--chat-border)] rounded px-1 py-0.5">
                <Lock className="h-2.5 w-2.5" />
                Max
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--chat-muted)] mt-0.5">{opt.description}</p>
          {opt.isChain && (
            <div className="flex items-center gap-1 mt-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <div className="h-px w-4 bg-gray-300" />
              <div className="w-2 h-2 rounded-full bg-violet-500" />
            </div>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="relative llm-selector z-50" ref={menuRef}>
      <button
        onClick={() => !disabled && setIsOpen(p => !p)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors',
          'bg-[var(--chat-card)] border-[var(--chat-border)] text-[var(--chat-text)] hover:bg-[var(--chat-card-2)]',
          disabled && 'opacity-50 cursor-not-allowed hover:bg-[var(--chat-card)]'
        )}
        aria-label="Select model"
      >
        <Icon className="h-3.5 w-3.5 text-brand-green" />
        <span className="whitespace-nowrap">{label}</span>
        {!useKnowledgebase && (
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" title="Knowledge base off" />
        )}
        <ChevronDown className={cn('h-3 w-3 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className={cn(
          'absolute left-0 w-80 bg-[var(--chat-card)] rounded-xl shadow-xl border border-[var(--chat-border)] z-[99999] flex flex-col max-h-[min(70vh,560px)] overflow-hidden',
          openUpward ? 'bottom-full mb-2' : 'top-full mt-2'
        )}>
          {/* Scrollable list */}
          <div className="overflow-y-auto flex-1">
            <div className="py-1">
              {MODES.map(renderRow)}
            </div>

            <div className="border-t border-[var(--chat-border)]">
              <div className="py-1">
                {MODELS.map(renderRow)}
              </div>
            </div>

            {isAdmin && (
              <>
                <div className="px-3 py-1.5 border-t border-[var(--chat-border)] bg-[var(--chat-card-2)]">
                  <p className="text-[10px] font-semibold text-[var(--chat-muted)] uppercase tracking-wider">Admin</p>
                </div>
                <div className="py-1">
                  {ADMIN_MODELS.map(renderRow)}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSwitcher;
