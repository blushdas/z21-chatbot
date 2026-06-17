import React, { useEffect, useState } from 'react';
import { ChevronDown, Sparkles, Zap, Brain, Shield, Bot, Feather, LayoutGrid, BookOpen, Building2, Check, BookX, Gauge, Rabbit, RotateCcw, Globe, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import geminiIcon from '@/assets/models/gemini.png';
import claudeIcon from '@/assets/models/claude.png';
import openaiIcon from '@/assets/models/openai.png';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  readPower, writePower,
  readPowerOverride, writePowerOverride, clearPowerOverride,
  readModelOverride, writeModelOverride, clearModelOverride,
  readKb, writeKb,
  readKbOverride, writeKbOverride, clearKbOverride,
  type PowerValue, type ModelValue, type KbSource,
} from '@/lib/chatDefaults';
import { useBrand } from '@/context/BrandContext';

// ---------------------------------------------------------------------------
// Compact toolbar selector used by the chat composer. Renders a single
// dropdown trigger with an icon + label + chevron, styled to match the
// existing chat input toolbar pills.
// ---------------------------------------------------------------------------
type Option = {
  value: string;
  label: string;
  icon: React.ElementType;
  description?: string;
};

// Build an image-based icon component compatible with React.ElementType used
// across the toolbar selectors. Accepts standard SVG-like sizing props.
const makeImageIcon = (src: string, alt: string): React.ElementType => {
  const ImgIcon: React.FC<React.HTMLAttributes<HTMLImageElement> & { className?: string }> = ({ className, ...rest }) => (
    <img
      src={src}
      alt={alt}
      className={cn('object-contain', className)}
      draggable={false}
      {...(rest as any)}
    />
  );
  return ImgIcon as unknown as React.ElementType;
};

const ChatGPTIcon: React.ElementType = ({ className, ...rest }: any) => (
  <img
    src={openaiIcon}
    alt="ChatGPT"
    className={cn('object-contain dark:invert', className)}
    draggable={false}
    {...rest}
  />
);
const GeminiIcon = makeImageIcon(geminiIcon, 'Gemini');
const ClaudeIcon = makeImageIcon(claudeIcon, 'Claude');

type SelectorProps = {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  disabled?: boolean;
  openUpward?: boolean;
  accent?: 'green' | 'blue' | 'amber';
  ariaLabel: string;
  heading?: string;
  overridden?: boolean;
  onResetToDefault?: () => void;
};

const ACCENT_CLASS: Record<NonNullable<SelectorProps['accent']>, string> = {
  green: 'text-brand-green',
  blue: 'text-sky-400',
  amber: 'text-amber-400',
};

const ToolbarSelect: React.FC<SelectorProps> = ({
  value,
  onChange,
  options,
  disabled,
  openUpward = true,
  accent = 'green',
  ariaLabel,
  heading,
  overridden,
  onResetToDefault,
}) => {
  const current = options.find((o) => o.value === value) ?? options[0];
  const Icon = current.icon;
  const accentClass = ACCENT_CLASS[accent];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={ariaLabel}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors',
            'bg-[var(--chat-card)] border-[var(--chat-border)] text-[var(--chat-text)] hover:bg-[var(--chat-card-2)]',
            disabled && 'opacity-50 cursor-not-allowed hover:bg-[var(--chat-card)]',
            overridden && 'ring-1 ring-amber-400/60',
          )}
        >
          <Icon className={cn('h-3.5 w-3.5', accentClass)} />
          <span className="whitespace-nowrap">{current.label}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side={openUpward ? 'top' : 'bottom'}
        className="w-64"
      >
        {heading && (
          <>
            <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-[var(--chat-muted)] font-semibold">
              {heading}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        {options.map((opt) => {
          const OptIcon = opt.icon;
          const selected = opt.value === value;
          return (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className="flex items-start gap-2.5 py-2"
            >
              <OptIcon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', selected ? accentClass : 'text-[var(--chat-muted)]')} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{opt.label}</span>
                  {selected && <Check className={cn('h-3.5 w-3.5', accentClass)} />}
                </div>
                {opt.description && (
                  <p className="text-[11px] text-[var(--chat-muted)] mt-0.5 leading-snug">{opt.description}</p>
                )}
              </div>
            </DropdownMenuItem>
          );
        })}
        {onResetToDefault && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => { e.preventDefault(); onResetToDefault(); }}
              className="flex items-center gap-2 py-2 text-[var(--chat-muted)]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="text-xs">Reset to default</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// ---------------------------------------------------------------------------
// Processing Power — persisted model tier (defaults to Auto). The backend
// combines this with AI Model/provider to resolve the concrete model ID.
// ---------------------------------------------------------------------------
const POWER_OPTIONS: Option[] = [
  { value: 'auto', label: 'Auto', icon: Gauge, description: 'Automatically pick the best tier' },
  { value: 'instant', label: 'Instant', icon: Rabbit, description: 'Fast tier: GPT-5.4 mini/nano, Claude Haiku 4.5, Gemini Flash' },
  { value: 'thinking', label: 'Thinking', icon: Brain, description: 'Reasoning tier: GPT-5.5, Claude Sonnet 4.6, Gemini Pro Thinking' },
  { value: 'pro', label: 'Pro', icon: Shield, description: 'Max tier: GPT-5.5 Pro, Claude Opus 4.7, Gemini 3.1 Pro Preview' },
];

const POWER_KEY = 'chat:processingPower';

export const ProcessingPowerSelect: React.FC<{
  disabled?: boolean;
  openUpward?: boolean;
  chatId?: string | null;
}> = ({ disabled, openUpward, chatId }) => {
  // Defer any localStorage read to a post-mount effect to avoid hydration
  // mismatches. First paint uses the SSR-safe 'auto' default.
  const [value, setValue] = useState<string>('auto');
  const [hasOverride, setHasOverride] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const override = readPowerOverride(chatId);
    setHasOverride(!!override);
    setValue(override ?? readPower());
  }, [chatId]);

  const handleChange = (next: string) => {
    if (next === value) return;
    setValue(next);
    if (chatId) {
      writePowerOverride(chatId, next as PowerValue);
      setHasOverride(true);
    } else {
      writePower(next as PowerValue);
    }
    try {
      window.dispatchEvent(new CustomEvent('chat:powerChange', { detail: { value: next } }));
    } catch { /* ignore */ }
  };

  const handleReset = () => {
    if (!chatId) return;
    clearPowerOverride(chatId);
    setHasOverride(false);
    const defaultVal = readPower();
    setValue(defaultVal);
    try {
      window.dispatchEvent(new CustomEvent('chat:powerChange', { detail: { value: defaultVal } }));
    } catch { /* ignore */ }
  };

  return (
    <ToolbarSelect
      ariaLabel="Processing power"
      heading="Processing Power"
      value={value}
      onChange={handleChange}
      options={POWER_OPTIONS}
      disabled={disabled}
      openUpward={openUpward}
      accent="amber"
      overridden={hasOverride}
      onResetToDefault={hasOverride ? handleReset : undefined}
    />
  );
};

// ---------------------------------------------------------------------------
// AI Model — drives the underlying selected model.
// ---------------------------------------------------------------------------
const MODEL_OPTIONS: Option[] = [
  { value: 'auto', label: 'Auto', icon: Sparkles, description: 'Automatically choose the provider' },
  { value: 'chatgpt', label: 'ChatGPT', icon: ChatGPTIcon, description: 'OpenAI — uses the selected Instant / Thinking / Pro tier' },
  { value: 'gemini', label: 'Gemini', icon: GeminiIcon, description: 'Google — uses the selected Instant / Thinking / Pro tier' },
  { value: 'claude', label: 'Claude', icon: ClaudeIcon, description: 'Anthropic — uses the selected Instant / Thinking / Pro tier' },
];

const MODEL_LABEL: Record<string, string> = {
  auto: 'Auto',
  chatgpt: 'ChatGPT',
  gemini: 'Gemini',
  claude: 'Claude',
};

function normalizeModelValue(model: string): string {
  if (MODEL_LABEL[model]) return model;
  // Map legacy/processing values onto a default visible model so the pill
  // always shows one of ChatGPT / Gemini / Claude.
  return 'chatgpt';
}

export const AIModelSelect: React.FC<{
  currentModel: string;
  onModelChange: (value: string) => void;
  disabled?: boolean;
  openUpward?: boolean;
  chatId?: string | null;
}> = ({ currentModel, onModelChange, disabled, openUpward, chatId }) => {
  const hasOverride = !!readModelOverride(chatId);
  const handleChange = (next: string) => {
    if (chatId) writeModelOverride(chatId, next as ModelValue);
    onModelChange(next);
  };
  const handleReset = () => {
    if (!chatId) return;
    clearModelOverride(chatId);
    const def = (typeof window !== 'undefined' && window.localStorage.getItem('chat:aiModel')) || 'auto';
    onModelChange(def);
  };
  return (
    <ToolbarSelect
      ariaLabel="AI model"
      heading="AI Model"
      value={normalizeModelValue(currentModel)}
      onChange={handleChange}
      options={MODEL_OPTIONS}
      disabled={disabled}
      openUpward={openUpward}
      accent="green"
      overridden={hasOverride}
      onResetToDefault={hasOverride ? handleReset : undefined}
    />
  );
};

// ---------------------------------------------------------------------------
// Knowledge Base — independent toggles per KB plus a master "No knowledge
// base" toggle that disables them all. The upstream `enabled` flag is true
// whenever at least one KB toggle is on.
// ---------------------------------------------------------------------------
type KB = {
  value: string;
  label: string;
  icon: React.ElementType;
  description: string;
  comingSoon?: boolean;
  comingSoonTitle?: string;
  comingSoonBody?: string;
};

const KB_SOURCES: KB[] = [
  { value: 'ambassador', label: 'Ambassador Way', icon: BookOpen, description: 'Project Smart articles, Learning Time, Daryle Doden emails, and more.' },
  // Bill Yeargin entry hidden temporarily — keep type/values in chatDefaults
  // so existing saved selections continue to deserialize without errors.
  {
    value: 'company',
    label: 'Your Company',
    icon: Building2,
    description: 'Your private company knowledge base',
    comingSoon: true,
    comingSoonTitle: 'Your Company knowledge base — coming soon',
    comingSoonBody: 'Connect your private company docs so Daryle can cite them in replies. Targeting Q3 2026.',
  },
  {
    value: 'web',
    label: 'Search the Internet',
    icon: Globe,
    description: 'Pull fresh answers from the live web with citations',
    comingSoon: true,
    comingSoonTitle: 'Web search — coming soon',
    comingSoonBody: 'Let Daryle pull fresh, cited answers from the live web. Targeting Q3 2026.',
  },
];

const KB_KEY = 'chat:knowledgeBaseSources';

export const KnowledgeBaseSelect: React.FC<{
  enabled: boolean;
  onEnabledChange: (value: boolean) => void;
  disabled?: boolean;
  openUpward?: boolean;
  chatId?: string | null;
  folderId?: string | null;
}> = ({ enabled, onEnabledChange, disabled, openUpward, chatId, folderId }) => {
  const { activeBrand } = useBrand();
  const isCityChangers = activeBrand?.slug === 'city-changers';
  const brandTextFn = (text: string) =>
    activeBrand ? text.replace(/Daryle Doden/g, activeBrand.product_name).replace(/Daryle/g, activeBrand.product_name) : text;
  // Visual-only fake KB toggle for the City Changers white-label demo.
  const [cityChangersKbOn, setCityChangersKbOn] = useState<boolean>(true);
  // Synthetic, folder-scoped KB entry. Only present when the chat belongs to a
  // project; defaults to ON and stays independent of the other KB sources.
  const visibleSources = React.useMemo<KB[]>(() => {
    const base = isCityChangers
      ? KB_SOURCES.filter((k) => k.value !== 'company')
      : KB_SOURCES;
    const branded = activeBrand
      ? base.map((k) => {
          if (k.value !== 'company') return k;
          const shortName = activeBrand.product_name.replace(/\s*AI\s*$/i, '').trim() || activeBrand.product_name;
          const kbLabel = `${shortName} Knowledge`;
          return {
            ...k,
            label: kbLabel,
            description: `Your private ${shortName} knowledge base`,
            comingSoon: false,
            comingSoonTitle: undefined,
            comingSoonBody: undefined,
          };
        })
      : base;
    const finalSources = branded.map((k) => ({
      ...k,
      description: brandTextFn(k.description),
      comingSoonBody: k.comingSoonBody ? brandTextFn(k.comingSoonBody) : k.comingSoonBody,
    }));
    if (!folderId) return finalSources;
    return [
      {
        value: 'project',
        label: 'Project Knowledge Base',
        icon: FolderOpen,
        description: "Files, instructions, and memory from this project. Additive — independent of other knowledge bases.",
      },
      ...finalSources,
    ];
  }, [folderId, isCityChangers, activeBrand]);

  // Defer storage reads until after mount to avoid hydration mismatches.
  // First paint uses the SSR-safe ['ambassador'] default.
  const [selected, setSelected] = useState<string[]>(['ambassador']);
  const [hasOverride, setHasOverride] = useState<boolean>(false);
  const previousSelectedRef = React.useRef<string[] | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const override = readKbOverride(chatId);
    setHasOverride(!!override);
    if (override) {
      setSelected(override);
    } else {
      const base = readKb();
      // Project KB defaults to ON for any chat in a project, without
      // polluting the global KB defaults.
      setSelected(folderId && !base.includes('project' as KbSource)
        ? [...base, 'project']
        : base);
    }
    previousSelectedRef.current = null;
  }, [chatId, folderId]);

  const isCityChangersKbActive = isCityChangers && cityChangersKbOn;

  // Persist + keep upstream enabled flag in sync with whether any KB is on.
  useEffect(() => {
    const anyOn = selected.length > 0 || isCityChangersKbActive;
    if (anyOn !== enabled) onEnabledChange(anyOn);

    // Skip the initial mount; only fire on user-driven changes.
    const prev = previousSelectedRef.current;
    if (prev !== null) {
      const prevKey = [...prev].sort().join('|');
      const nextKey = [...selected].sort().join('|');
      if (prevKey !== nextKey) {
        if (chatId) {
          writeKbOverride(chatId, selected as KbSource[]);
          setHasOverride(true);
        } else {
          writeKb(selected as KbSource[]);
        }
        const label = (() => {
          if (isCityChangersKbActive && selected.length === 0) return 'City Changers KB';
          if (selected.length === 0) return 'No knowledge base';
          if (selected.length === visibleSources.length) return 'All knowledge bases';
          const primary = folderId && selected.includes('project')
            ? 'project'
            : selected[0];
          const first = visibleSources.find((k) => k.value === primary)?.label ?? 'Knowledge base';
          return selected.length > 1 ? `${first} +${selected.length - 1}` : first;
        })();
        try {
          window.dispatchEvent(new CustomEvent('chat:kbChange', {
            detail: { label, enabled: anyOn, sources: selected },
          }));
        } catch { /* ignore */ }
      }
    }
    previousSelectedRef.current = selected;
  }, [selected, enabled, onEnabledChange, chatId, visibleSources, isCityChangersKbActive]);

  const toggleSource = (value: string) => {
    setSelected((prev) => {
      const isOn = prev.includes(value);
      if (isOn) return prev.filter((v) => v !== value);
      // Bill Yeargin is exclusive: turning it on clears all others, and
      // turning any other KB on clears Bill Yeargin.
      if (value === 'bill_yeargin') return ['bill_yeargin'];
      const without = prev.filter((v) => v !== 'bill_yeargin');
      return [...without, value];
    });
  };

  const noneActive = selected.length === 0 && !isCityChangersKbActive;
  const computeDefaultSources = (): string[] => {
    const base = readKb();
    return folderId && !base.includes('project' as KbSource)
      ? [...base, 'project']
      : base;
  };
  // Toggle handler for the "No knowledge base" row. When turning ON, clear all
  // sources. When turning OFF, restore sensible defaults (saved KB sources +
  // Project KB if in a folder). Falls back to Ambassador Way if nothing else.
  const setNone = (checked?: boolean) => {
    const turnOn = typeof checked === 'boolean' ? checked : !noneActive;
    if (turnOn) {
      if (isCityChangers) setCityChangersKbOn(false);
      if (!noneActive) setSelected([]);
      return;
    }
    if (isCityChangers) setCityChangersKbOn(true);
    const restored = computeDefaultSources();
    setSelected(restored.length > 0 ? restored : ['ambassador']);
  };

  const handleResetKb = () => {
    if (!chatId) return;
    clearKbOverride(chatId);
    setHasOverride(false);
    const base = readKb();
    const def = folderId && !base.includes('project' as KbSource)
      ? [...base, 'project']
      : base;
    if (isCityChangers) setCityChangersKbOn(true);
    setSelected(def);
    previousSelectedRef.current = null;
    const anyOn = def.length > 0 || isCityChangers;
    if (anyOn !== enabled) onEnabledChange(anyOn);
  };

  // Trigger label: summarize current state.
  const triggerLabel = (() => {
    if (isCityChangersKbActive && selected.length === 0) return 'City Changers KB';
    if (noneActive) return 'No knowledge base';
    if (selected.length === visibleSources.length) return 'All knowledge bases';
    const primary = folderId && selected.includes('project')
      ? 'project'
      : selected[0];
    const first = visibleSources.find((k) => k.value === primary)?.label ?? 'Knowledge base';
    return selected.length > 1 ? `${first} +${selected.length - 1}` : first;
  })();
  const TriggerIcon = noneActive && !isCityChangersKbActive ? BookX : BookOpen;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label="Knowledge base"
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors',
            'bg-[var(--chat-card)] border-[var(--chat-border)] text-[var(--chat-text)] hover:bg-[var(--chat-card-2)]',
            disabled && 'opacity-50 cursor-not-allowed hover:bg-[var(--chat-card)]',
            hasOverride && 'ring-1 ring-amber-400/60',
          )}
        >
          <TriggerIcon className={cn('h-3.5 w-3.5', noneActive ? 'text-amber-400' : 'text-sky-400')} />
          <span className="whitespace-nowrap">{triggerLabel}</span>
          
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side={openUpward ? 'top' : 'bottom'}
        className="w-72 p-1"
      >
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-[var(--chat-muted)] font-semibold">
          Knowledge Base
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {visibleSources.map((kb) => {
          const Icon = kb.icon;
          const isOn = selected.includes(kb.value);
          if (kb.comingSoon) {
            return (
              <TooltipProvider key={kb.value} delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    aria-disabled="true"
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toast(kb.comingSoonTitle ?? `${kb.label} — coming soon`, {
                        description: kb.comingSoonBody ?? kb.description,
                      });
                    }}
                    className="flex items-start gap-2.5 rounded-sm px-2 py-2 opacity-50 cursor-not-allowed"
                  >
                    <Icon className="h-4 w-4 mt-0.5 flex-shrink-0 text-[var(--chat-muted)]" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium">{kb.label}</span>
                        <span className="rounded px-1 py-px text-[9px] font-semibold uppercase tracking-wider bg-amber-400/15 text-amber-500 ring-1 ring-amber-400/40">
                          Coming soon
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--chat-muted)] mt-0.5 leading-snug">{kb.description}</p>
                    </div>
                    <Switch checked={false} disabled aria-label={`${kb.label} (coming soon)`} />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[240px] text-xs leading-snug">
                  <p className="font-medium mb-0.5">{kb.comingSoonTitle ?? `${kb.label} — coming soon`}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {kb.comingSoonBody ?? kb.description}
                  </p>
                </TooltipContent>
              </Tooltip>
              </TooltipProvider>
            );
          }
          return (
            <React.Fragment key={kb.value}>
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => { e.preventDefault(); toggleSource(kb.value); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleSource(kb.value);
                }
              }}
              className="flex items-start gap-2.5 rounded-sm px-2 py-2 cursor-pointer hover:bg-accent focus:bg-accent focus:outline-none"
            >
              <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', isOn ? 'text-sky-400' : 'text-[var(--chat-muted)]')} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{kb.label}</div>
                <p className="text-[11px] text-[var(--chat-muted)] mt-0.5 leading-snug">{kb.description}</p>
              </div>
              <Switch
                checked={isOn}
                onCheckedChange={() => toggleSource(kb.value)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Toggle ${kb.label}`}
              />
            </div>
            {isCityChangers && kb.value === 'ambassador' && (
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => { e.preventDefault(); setCityChangersKbOn((v) => !v); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setCityChangersKbOn((v) => !v);
                  }
                }}
                className="flex items-start gap-2.5 rounded-sm px-2 py-2 cursor-pointer hover:bg-accent focus:bg-accent focus:outline-none"
              >
                <BookOpen className={cn('h-4 w-4 mt-0.5 flex-shrink-0', cityChangersKbOn ? 'text-sky-400' : 'text-[var(--chat-muted)]')} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">City Changers Knowledge Base</div>
                  <p className="text-[11px] text-[var(--chat-muted)] mt-0.5 leading-snug">
                    City Changers Movement teachings, talks, and resources from Alan Platt.
                  </p>
                </div>
                <Switch
                  checked={cityChangersKbOn}
                  onCheckedChange={(v) => setCityChangersKbOn(!!v)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Toggle City Changers Knowledge Base"
                />
              </div>
            )}
            </React.Fragment>
          );
        })}
        <div className="my-1 h-px bg-border" />
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => { e.preventDefault(); setNone(); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setNone(); }
          }}
          className="flex items-start gap-2.5 rounded-sm px-2 py-2 cursor-pointer hover:bg-accent focus:bg-accent focus:outline-none"
        >
          <BookX className={cn('h-4 w-4 mt-0.5 flex-shrink-0', noneActive ? 'text-amber-400' : 'text-[var(--chat-muted)]')} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">No knowledge base</div>
            <p className="text-[11px] text-[var(--chat-muted)] mt-0.5 leading-snug">Use the raw model only — no citations or KB lookups.</p>
          </div>
          <Switch
            checked={noneActive}
            onCheckedChange={(v) => setNone(v)}
            onClick={(e) => e.stopPropagation()}
            aria-label="Toggle no knowledge base"
          />
        </div>
        {hasOverride && (
          <>
            <div className="my-1 h-px bg-border" />
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => { e.preventDefault(); handleResetKb(); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleResetKb(); }
              }}
              className="flex items-center gap-2 rounded-sm px-2 py-2 cursor-pointer hover:bg-accent focus:bg-accent focus:outline-none text-[var(--chat-muted)]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="text-xs">Reset to default</span>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};