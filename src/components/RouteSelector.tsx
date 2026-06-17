import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Sparkles, Brain, Shield, LayoutGrid, Feather, ArrowRightLeft, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/SupabaseAuthContext';

interface RouteSelectorProps {
  currentModel: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}

type RouteOption = {
  label: string;
  description: string;
  icon: React.ElementType;
  value: string;
  adminOnly?: boolean;
  isChain?: boolean;
  isLocked?: boolean;
};

const routeOptions: RouteOption[] = [
  {
    label: 'Auto',
    description: 'Selects the best available model for your question',
    icon: Sparkles,
    value: 'auto',
  },
  {
    label: 'Thinking',
    description: 'Claude Sonnet 4.6 — reason through complex problems',
    icon: Brain,
    value: 'fast',
  },
  {
    label: 'Pro',
    description: 'Claude Opus 4.7 — most capable model for expert work',
    icon: Shield,
    value: 'pro',
    isLocked: true,
  },
  {
    label: 'GPT-5.1',
    description: 'OpenAI GPT-5.1 — structured, comprehensive answers',
    icon: LayoutGrid,
    value: 'chatgpt',
    adminOnly: true,
  },
  {
    label: 'Gemini 3.1 Pro',
    description: 'Google Gemini 3.1 Pro — broad coverage and speed',
    icon: Sparkles,
    value: 'gemini',
    adminOnly: true,
  },
  {
    label: 'Claude Sonnet 4.6',
    description: 'Anthropic Sonnet 4.6 — nuanced, natural writing',
    icon: Feather,
    value: 'claude',
    adminOnly: true,
  },
  {
    label: 'Structure + Polish',
    description: 'GPT-5.1 structures, then Claude Sonnet 4.6 polishes (2-step)',
    icon: ArrowRightLeft,
    value: 'chatgpt-claude',
    adminOnly: true,
    isChain: true,
  },
];

const publicOptions = routeOptions.filter((o) => !o.adminOnly);
const adminOptions = routeOptions.filter((o) => o.adminOnly);

const getConfig = (model: string): RouteOption =>
  routeOptions.find((o) => o.value === model) ?? routeOptions[0];

const RouteSelector: React.FC<RouteSelectorProps> = ({ currentModel, onModelChange, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { profile } = useAuth();

  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';

  const currentConfig = getConfig(currentModel);
  const Icon = currentConfig.icon;

  const toggleDropdown = () => {
    if (!disabled) setIsOpen((prev) => !prev);
  };

  const selectRoute = (value: string) => {
    onModelChange(value);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const renderOption = (config: RouteOption) => {
    const OptionIcon = config.icon;
    const isSelected = config.value === currentModel;

    return (
      <button
        key={config.value}
        onClick={() => !config.isLocked && selectRoute(config.value)}
        className={cn(
          'w-full text-left px-3 py-2.5 transition-colors flex items-start gap-3',
          config.isLocked
            ? 'opacity-50 cursor-not-allowed'
            : isSelected ? 'bg-brand-green/10 text-brand-green' : 'text-[var(--chat-text)] hover:bg-[var(--chat-card-2)]'
        )}
      >
        <OptionIcon
          className={cn('h-4 w-4 mt-0.5 flex-shrink-0', isSelected ? 'text-brand-green' : 'text-[var(--chat-muted)]')}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{config.label}</span>
            {isSelected && !config.isLocked && <div className="w-1.5 h-1.5 bg-brand-green rounded-full" />}
            {config.isLocked && (
              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-[var(--chat-muted)] border border-[var(--chat-border)] rounded px-1 py-0.5">
                <Lock className="h-2.5 w-2.5" />
                Max
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--chat-muted)] mt-0.5">{config.description}</p>
          {config.isChain && (
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
        onClick={toggleDropdown}
        disabled={disabled}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors',
          'bg-[var(--chat-card)] border-[var(--chat-border)] text-[var(--chat-text)] hover:bg-[var(--chat-card-2)]',
          disabled && 'opacity-50 cursor-not-allowed hover:bg-[var(--chat-card)]'
        )}
        aria-label="Select route"
      >
        <Icon className="h-3.5 w-3.5 text-brand-green" />
        <span className="whitespace-nowrap">{currentConfig.label}</span>
        <ChevronDown className={cn('h-3 w-3 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-96 bg-[var(--chat-card)] rounded-lg shadow-xl border border-[var(--chat-border)] z-[99999] overflow-hidden">
          <div className="px-3 py-2 border-b border-[var(--chat-border)] bg-[var(--chat-card-2)]">
            <p className="text-xs font-medium text-[var(--chat-muted)]">Choose your AI route</p>
          </div>

          <div className="py-1">{publicOptions.map(renderOption)}</div>

          {isAdmin && (
            <>
              <div className="px-3 py-2 border-t border-[var(--chat-border)] bg-[var(--chat-card-2)]">
                <p className="text-xs font-medium text-[var(--chat-muted)] uppercase tracking-wide">Multi-Model Routes</p>
              </div>
              <div className="py-1">{adminOptions.map(renderOption)}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default RouteSelector;
