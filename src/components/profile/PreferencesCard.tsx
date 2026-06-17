
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MockUserProfile } from '@/data/mockUserProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useTheme } from '@/components/ui/theme-provider';
import {
  RotateCcw, Gauge, Sparkles, BookOpen, MessageSquare, Layout,
  Wand2, Zap, Brain, Rocket, Quote, Ban, Sun, Moon,
  type LucideIcon,
} from 'lucide-react';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  readPower, writePower, readModel, writeModel, readKb, writeKb,
  readBlueprint, writeBlueprint,
  POWER_VALUES, MODEL_VALUES, KB_VALUES, BLUEPRINT_VALUES, BLUEPRINT_LABELS,
  type PowerValue, type ModelValue, type KbSource, type BlueprintValue,
} from '@/lib/chatDefaults';

const POWER_ICONS: Record<PowerValue, LucideIcon> = {
  auto: Wand2, instant: Zap, thinking: Brain, pro: Rocket,
};
const ModelLogo: React.FC<{ model: ModelValue; size?: number }> = ({ model, size = 14 }) => {
  if (model === 'auto') return <Wand2 size={size} className="text-brand-yellow" />;
  const common = { width: size, height: size, viewBox: '0 0 24 24', xmlns: 'http://www.w3.org/2000/svg' };
  if (model === 'chatgpt') {
    return (
      <svg {...common} fill="currentColor" className="text-[#10A37F]" aria-hidden>
        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.05 6.05 0 0 0 6.515 2.9A5.98 5.98 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.205 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.074zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
      </svg>
    );
  }
  if (model === 'gemini') {
    return (
      <svg {...common} fill="currentColor" className="text-[#4796E3]" aria-hidden>
        <path d="M12 0c.39 4.13 1.79 7.7 4.21 10.12C18.62 12.54 22.2 13.94 26.33 14v-.01l-2.33-.01c-4.13-.06-7.7-1.46-10.12-3.88C11.46 7.7 10.06 4.13 10 0zm0 24c-.06-4.13-1.46-7.7-3.88-10.12C5.7 11.46 2.13 10.06 0 10v4c2.13-.06 5.7-1.46 8.12-3.88C10.54 7.7 11.94 4.13 12 0c.06 4.13 1.46 7.7 3.88 10.12 2.42 2.42 5.99 3.82 10.12 3.88-4.13.06-7.7 1.46-10.12 3.88C13.46 20.3 12.06 23.87 12 24z"/>
      </svg>
    );
  }
  // claude
  return (
    <svg {...common} fill="currentColor" className="text-[#D97757]" aria-hidden>
      <path d="M4.709 15.955l4.72-2.647.079-.23-.079-.128h-.23l-.79-.048-2.695-.073-2.337-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.448.255h.389l.054-.157-.133-.097-.103-.097-2.357-1.599-2.552-1.688-1.336-.972-.722-.491-.365-.462-.158-1.012.658-.724.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.146-.103.018-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.066-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312z"/>
    </svg>
  );
};
const MODEL_LABELS: Record<ModelValue, string> = {
  auto: 'Auto', chatgpt: 'ChatGPT', gemini: 'Gemini', claude: 'Claude',
};
const BLUEPRINT_ICONS: Record<BlueprintValue, LucideIcon> = {
  quickAnswer: Zap, standard: Layout, directQuotes: Quote, noBlueprints: Ban,
};

const OptionRow: React.FC<{ icon: LucideIcon; label: string }> = ({ icon: Icon, label }) => (
  <span className="flex items-center gap-2">
    <Icon size={14} className="text-brand-yellow" />
    {label}
  </span>
);
const ModelOptionRow: React.FC<{ model: ModelValue }> = ({ model }) => (
  <span className="flex items-center gap-2">
    <ModelLogo model={model} size={14} />
    {MODEL_LABELS[model]}
  </span>
);

interface PreferencesCardProps {
  userProfile: MockUserProfile;
  onUpdatePreferences: (preferences: MockUserProfile['preferences']) => void;
}

const PreferencesCard: React.FC<PreferencesCardProps> = ({ userProfile, onUpdatePreferences }) => {
  const navigate = useNavigate();
  const { user, profile, setThemePreference } = useAuth();
  const { theme, setTheme } = useTheme();
  const currentTheme: 'light' | 'dark' = theme === 'light' ? 'light' : 'dark';
  const applyTheme = (next: 'light' | 'dark') => {
    if (next === currentTheme) return;
    setTheme(next);
    setThemePreference(next);
  };
  const [customInstructions, setCustomInstructions] = useState<string>(profile?.custom_instructions ?? '');
  useEffect(() => {
    setCustomInstructions(profile?.custom_instructions ?? '');
  }, [profile?.custom_instructions]);
  const CUSTOM_INSTRUCTIONS_MAX = 20000;
  const customInstructionsOverLimit = customInstructions.length > CUSTOM_INSTRUCTIONS_MAX;
  // SSR-safe defaults; hydrate from localStorage after mount.
  const [defaultPower, setDefaultPower] = useState<PowerValue>('auto');
  const [defaultModel, setDefaultModel] = useState<ModelValue>('auto');
  const [defaultKb, setDefaultKb] = useState<KbSource[]>(['ambassador']);
  const [defaultBlueprint, setDefaultBlueprint] = useState<BlueprintValue>('quickAnswer');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setDefaultPower(readPower());
    setDefaultModel(readModel());
    setDefaultKb(readKb());
    setDefaultBlueprint(readBlueprint());
  }, []);
  const [isChanged, setIsChanged] = useState(false);
  const [isResettingOnboarding, setIsResettingOnboarding] = useState(false);

  // Save all preferences
  const handleSavePreferences = () => {
    if (customInstructions.length > CUSTOM_INSTRUCTIONS_MAX) {
      toast.error(`Custom instructions exceed the ${CUSTOM_INSTRUCTIONS_MAX.toLocaleString()} character limit.`);
      return;
    }
    onUpdatePreferences({ ...userProfile.preferences });

    // Persist chat defaults
    writePower(defaultPower);
    writeModel(defaultModel);
    writeKb(defaultKb);
    writeBlueprint(defaultBlueprint);

    // Persist custom instructions to profiles table
    if (user?.id) {
      supabase
        .from('profiles')
        .update({
          custom_instructions: customInstructions.trim() ? customInstructions.trim().slice(0, CUSTOM_INSTRUCTIONS_MAX) : null,
        })
        .eq('id', user.id)
        .then(({ error }) => {
          if (error) console.error('Failed to save preferences:', error);
        });
    }

    setIsChanged(false);
    toast.success("Preferences updated successfully");
  };
  
  // Reset all preferences
  const handleResetPreferences = () => {
    if (confirm("Are you sure you want to reset all preferences to default values?")) {
      const defaultPreferences = { ...userProfile.preferences };
      setDefaultPower('auto');
      setDefaultModel('auto');
      setDefaultKb(['ambassador']);
      setDefaultBlueprint('quickAnswer');
      writePower('auto');
      writeModel('auto');
      writeKb(['ambassador']);
      writeBlueprint('quickAnswer');

      onUpdatePreferences(defaultPreferences);
      toast.success("Preferences have been reset to default");
      setIsChanged(false);
    }
  };

  // Re-do onboarding flow
  const handleRedoOnboarding = async () => {
    if (!user?.id) {
      toast.error('Please sign in to continue');
      return;
    }

    setIsResettingOnboarding(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: false })
        .eq('id', user.id);

      if (error) {
        console.error('Failed to reset onboarding:', error);
        toast.error('Failed to start onboarding. Please try again.');
        setIsResettingOnboarding(false);
        return;
      }

      localStorage.removeItem('daryleBot_onboardingComplete');
      localStorage.removeItem('daryleBot_preferences');
      
      navigate('/onboarding');
    } catch (err) {
      console.error('Error resetting onboarding:', err);
      toast.error('Something went wrong. Please try again.');
      setIsResettingOnboarding(false);
    }
  };
  
  return (
    <div className="rounded-2xl bg-[var(--chat-card)] border border-[var(--chat-border)] p-6 space-y-5">
      <h3 className="text-base font-semibold text-[var(--chat-text)]">Preferences</h3>

      {/* Appearance */}
      <div className="space-y-2">
        <div>
          <p className="text-sm font-semibold text-[var(--chat-text)]">Appearance</p>
          <p className="text-xs text-[var(--chat-muted)]">Switch between light and dark mode.</p>
        </div>
        <div className="inline-flex rounded-lg border border-[var(--chat-border)] p-1 bg-[var(--chat-bg)]">
          <button
            type="button"
            onClick={() => applyTheme('light')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              currentTheme === 'light'
                ? 'bg-brand-yellow/20 text-[var(--chat-text)]'
                : 'text-[var(--chat-muted)] hover:text-[var(--chat-text)]'
            }`}
            aria-pressed={currentTheme === 'light'}
          >
            <Sun size={14} /> Light
          </button>
          <button
            type="button"
            onClick={() => applyTheme('dark')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              currentTheme === 'dark'
                ? 'bg-brand-yellow/20 text-[var(--chat-text)]'
                : 'text-[var(--chat-muted)] hover:text-[var(--chat-text)]'
            }`}
            aria-pressed={currentTheme === 'dark'}
          >
            <Moon size={14} /> Dark
          </button>
        </div>
      </div>

      {/* Chat defaults */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--chat-text)]">Chat defaults</p>
            <p className="text-xs text-[var(--chat-muted)]">Used when you start a new chat. You can still change them per conversation.</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setDefaultPower('auto');
              setDefaultModel('auto');
              setDefaultKb(['ambassador']);
              setDefaultBlueprint('quickAnswer');
              writePower('auto');
              writeModel('auto');
              writeKb(['ambassador']);
              writeBlueprint('quickAnswer');
              setIsChanged(false);
              toast.success('Chat defaults restored to recommended values');
            }}
            className="flex-shrink-0 flex items-center gap-1.5 text-[var(--chat-muted)] hover:text-[var(--chat-text)] border border-[var(--chat-border)] hover:bg-[var(--ui-bg-hover)]"
          >
            <RotateCcw size={13} />
            Reset chat defaults
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Processing Power */}
          <div className="rounded-lg border border-[var(--chat-border)] bg-[var(--chat-card-2)] p-3">
            <label className="text-[10px] uppercase tracking-widest text-[var(--chat-muted)] mb-2 flex items-center gap-1.5">
              <Gauge size={11} className="text-brand-yellow" />
              Default Processing Power
            </label>
            <Select
              value={defaultPower}
              onValueChange={(v) => { setDefaultPower(v as PowerValue); setIsChanged(true); }}
            >
              <SelectTrigger className="w-full bg-[var(--chat-bg)] border-[var(--chat-border)] text-[var(--chat-text)] focus:ring-brand-yellow">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POWER_VALUES.map((v) => (
                  <SelectItem key={v} value={v}>
                    <OptionRow icon={POWER_ICONS[v]} label={v[0].toUpperCase() + v.slice(1)} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* AI Model */}
          <div className="rounded-lg border border-[var(--chat-border)] bg-[var(--chat-card-2)] p-3">
            <label className="text-[10px] uppercase tracking-widest text-[var(--chat-muted)] mb-2 flex items-center gap-1.5">
              <Sparkles size={11} className="text-brand-yellow" />
              Default AI Model
            </label>
            <Select
              value={defaultModel}
              onValueChange={(v) => { setDefaultModel(v as ModelValue); setIsChanged(true); }}
            >
              <SelectTrigger className="w-full bg-[var(--chat-bg)] border-[var(--chat-border)] text-[var(--chat-text)] focus:ring-brand-yellow">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['auto', 'chatgpt', 'gemini', 'claude'] as ModelValue[]).map((v) => (
                  <SelectItem key={v} value={v}>
                    <ModelOptionRow model={v} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Default Blueprint (Mode) */}
        <div className="rounded-lg border border-[var(--chat-border)] bg-[var(--chat-card-2)] p-3">
          <label className="text-[10px] uppercase tracking-widest text-[var(--chat-muted)] mb-2 flex items-center gap-1.5">
            <Layout size={11} className="text-brand-yellow" />
            Default Blueprint
          </label>
          <Select
            value={defaultBlueprint}
            onValueChange={(v) => { setDefaultBlueprint(v as BlueprintValue); setIsChanged(true); }}
          >
            <SelectTrigger className="w-full bg-[var(--chat-bg)] border-[var(--chat-border)] text-[var(--chat-text)] focus:ring-brand-yellow">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BLUEPRINT_VALUES.map((v) => (
                <SelectItem key={v} value={v}>
                  <OptionRow icon={BLUEPRINT_ICONS[v]} label={BLUEPRINT_LABELS[v]} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-[var(--chat-muted)] mt-1.5">Used when you start a new chat. You can still switch mid-conversation.</p>
        </div>

        {/* Knowledge Base */}
        <div className="rounded-lg border border-[var(--chat-border)] bg-[var(--chat-card-2)] p-3">
          <label className="text-[10px] uppercase tracking-widest text-[var(--chat-muted)] mb-2 flex items-center gap-1.5">
            <BookOpen size={11} className="text-brand-yellow" />
            Default Knowledge Base
          </label>
          <div className="space-y-2">
            {[
              { value: 'ambassador' as KbSource, label: 'Ambassador Way' },
              { value: 'company' as KbSource, label: 'Your Company', comingSoon: true },
              { value: 'websearch' as unknown as KbSource, label: 'Web Search', comingSoon: true },
            ].map(({ value, label }) => {
              const checked = defaultKb.includes(value);
              const comingSoon = (value as string) === 'company' || (value as string) === 'websearch';
              return (
                <div key={value} className="flex items-center justify-between">
                  <div className={`flex items-center gap-2 ${comingSoon ? 'opacity-50' : ''}`}>
                    <p className="text-sm text-[var(--chat-text)]">{label}</p>
                    {comingSoon && (
                      <span className="rounded px-1 py-px text-[9px] font-semibold uppercase tracking-wider bg-amber-400/15 text-amber-500 ring-1 ring-amber-400/40">
                        Coming soon
                      </span>
                    )}
                  </div>
                  <Switch
                    checked={comingSoon ? false : checked}
                    disabled={comingSoon}
                    onCheckedChange={(c) => {
                      if (comingSoon) return;
                      setDefaultKb((prev) => {
                        const next = c ? Array.from(new Set([...prev, value])) : prev.filter((v) => v !== value);
                        return next;
                      });
                      setIsChanged(true);
                    }}
                    className="data-[state=checked]:bg-brand-yellow"
                  />
                </div>
              );
            })}
            <p className="text-[11px] text-[var(--chat-muted)]">Turn both off to default to no knowledge base.</p>
          </div>
        </div>
      </div>

      <div className="h-px bg-[var(--chat-border)]" />

      {/* Custom Instructions */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MessageSquare size={13} className="text-brand-yellow" />
          <p className="text-sm font-semibold text-[var(--chat-text)]">Custom instructions</p>
        </div>
        <p className="text-xs text-[var(--chat-muted)]">
          Applied to every chat. Tell Daryle how you want responses (tone, format, role, things to avoid).
        </p>
        <textarea
          id="custom-instructions"
          value={customInstructions}
          onChange={(e) => {
            setCustomInstructions(e.target.value);
            setIsChanged(true);
          }}
          rows={5}
          aria-invalid={customInstructionsOverLimit}
          aria-describedby="custom-instructions-counter custom-instructions-error"
          placeholder="e.g. I'm a sales leader. Keep answers concise, use bullets, and reference frameworks where helpful."
          className={`w-full px-3 py-2 rounded-lg border bg-[var(--chat-bg)] text-sm text-[var(--chat-text)] placeholder:text-[var(--chat-muted)] focus:outline-none resize-y ${
            customInstructionsOverLimit
              ? 'border-destructive focus:border-destructive'
              : 'border-[var(--chat-border)] focus:border-brand-yellow'
          }`}
        />
        <div className="flex items-center justify-between gap-2">
          <p
            id="custom-instructions-error"
            role="alert"
            aria-live="polite"
            className={`text-[11px] text-destructive ${customInstructionsOverLimit ? '' : 'sr-only'}`}
          >
            {customInstructionsOverLimit
              ? `Custom instructions must be ${CUSTOM_INSTRUCTIONS_MAX.toLocaleString()} characters or fewer. Remove ${(customInstructions.length - CUSTOM_INSTRUCTIONS_MAX).toLocaleString()} character${customInstructions.length - CUSTOM_INSTRUCTIONS_MAX === 1 ? '' : 's'} to save.`
              : ''}
          </p>
          <span
            id="custom-instructions-counter"
            aria-live="polite"
            className={`text-[11px] ml-auto ${customInstructionsOverLimit ? 'text-destructive font-medium' : 'text-[var(--chat-muted)]'}`}
          >
            {customInstructions.length.toLocaleString()}/{CUSTOM_INSTRUCTIONS_MAX.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="h-px bg-[var(--chat-border)]" />

      {/* Update preferences card */}
      <div className="rounded-xl bg-[var(--chat-card-2)] border border-[var(--chat-border)] p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--chat-text)]">Update your preferences</p>
          <p className="text-xs text-[var(--chat-muted)] mt-0.5">Go through the setup wizard again to change your mode and preferences</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRedoOnboarding}
          disabled={isResettingOnboarding}
          className="flex items-center gap-1.5 text-[var(--chat-muted)] hover:text-[var(--chat-text)] border border-[var(--chat-border)] hover:bg-[var(--ui-bg-hover)] flex-shrink-0"
        >
          <RotateCcw size={13} />
          {isResettingOnboarding ? 'Starting...' : 'Re-do Setup'}
        </Button>
      </div>

      <div className="h-px bg-[var(--chat-border)]" />

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button
          variant="outline"
          onClick={handleResetPreferences}
          className="border-red-500/40 text-red-700 dark:text-red-400 hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-400"
        >
          Reset All Preferences
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setCustomInstructions(profile?.custom_instructions ?? '');
              setDefaultPower(readPower());
              setDefaultModel(readModel());
              setDefaultKb(readKb());
              setDefaultBlueprint(readBlueprint());
              setIsChanged(false);
            }}
            disabled={!isChanged}
            className="text-[var(--chat-muted)] hover:text-[var(--chat-text)]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSavePreferences}
            disabled={!isChanged || customInstructionsOverLimit}
            className="bg-brand-yellow hover:bg-brand-yellow/90 text-brand-blue font-semibold"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PreferencesCard;
