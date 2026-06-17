import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  SlidersHorizontal, UserCog, Gauge, Zap, Brain, Rocket,
  Sparkles, Bot, MessageSquare, Database, FolderOpen, Building2, Library, User,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getModeIcon } from '@/utils/modeIcons';
import {
  POWER_VALUES, MODEL_VALUES, KB_VALUES, BLUEPRINT_VALUES, BLUEPRINT_LABELS,
  type PowerValue, type ModelValue, type KbSource, type BlueprintValue,
} from '@/lib/chatDefaults';

type Props = {
  folderId: string;
  isOwner: boolean;
  onSaved?: () => void;
};

const POWER_LABELS: Record<PowerValue | 'inherit', string> = {
  inherit: 'Use each member\'s personal default',
  auto: 'Auto',
  instant: 'Instant',
  thinking: 'Thinking',
  pro: 'Pro',
};
const POWER_ICONS: Record<PowerValue | 'inherit', LucideIcon> = {
  inherit: UserCog,
  auto: Gauge,
  instant: Zap,
  thinking: Brain,
  pro: Rocket,
};
const MODEL_LABELS: Record<ModelValue | 'inherit', string> = {
  inherit: 'Use each member\'s personal default',
  auto: 'Auto',
  chatgpt: 'ChatGPT',
  gemini: 'Gemini',
  claude: 'Claude',
};
const MODEL_ICONS: Record<ModelValue | 'inherit', LucideIcon> = {
  inherit: UserCog,
  auto: Sparkles,
  chatgpt: MessageSquare,
  gemini: Bot,
  claude: Bot,
};
const KB_LABELS: Record<KbSource, string> = {
  ambassador: 'Ambassador',
  company: 'Company',
  project: 'Project KB',
  bill_yeargin: 'Bill Yeargin only',
};
const KB_ICONS: Record<KbSource, LucideIcon> = {
  ambassador: Library,
  company: Building2,
  project: FolderOpen,
  bill_yeargin: User,
};

const ProjectDefaultsCard: React.FC<Props> = ({ folderId, isOwner, onSaved }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [blueprint, setBlueprint] = useState<BlueprintValue | 'inherit'>('inherit');
  const [power, setPower] = useState<PowerValue | 'inherit'>('inherit');
  const [model, setModel] = useState<ModelValue | 'inherit'>('inherit');
  const [kb, setKb] = useState<KbSource[] | null>(null); // null = inherit

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('folders')
        .select('default_blueprint, default_processing, default_model, default_kb_sources')
        .eq('id', folderId)
        .maybeSingle();
      if (cancelled) return;
      const bp = data?.default_blueprint as string | null;
      const pw = data?.default_processing as string | null;
      const md = data?.default_model as string | null;
      const kbs = data?.default_kb_sources as string[] | null;
      setBlueprint(bp && (BLUEPRINT_VALUES as string[]).includes(bp) ? (bp as BlueprintValue) : 'inherit');
      setPower(pw && (POWER_VALUES as string[]).includes(pw) ? (pw as PowerValue) : 'inherit');
      setModel(md && (MODEL_VALUES as string[]).includes(md) ? (md as ModelValue) : 'inherit');
      setKb(Array.isArray(kbs) ? (kbs.filter(v => (KB_VALUES as string[]).includes(v)) as KbSource[]) : null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [folderId]);

  const toggleKb = (src: KbSource) => {
    setKb(prev => {
      const base = prev ?? [];
      return base.includes(src) ? base.filter(s => s !== src) : [...base, src];
    });
  };

  const save = async () => {
    setSaving(true);
    const patch: Record<string, unknown> = {
      default_blueprint: blueprint === 'inherit' ? null : blueprint,
      default_processing: power === 'inherit' ? null : power,
      default_model: model === 'inherit' ? null : model,
      default_kb_sources: kb,
    };
    const { error } = await supabase.from('folders').update(patch).eq('id', folderId);
    setSaving(false);
    if (error) {
      toast({ title: 'Could not save defaults', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Project defaults saved', description: 'New chats in this project will use these settings.' });
    onSaved?.();
  };

  const disabled = !isOwner || loading;

  return (
    <section className="rounded-2xl border border-[var(--chat-border)] bg-[var(--chat-card)] p-5 shadow-sm shadow-black/5">
      <div className="mb-1 flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-[var(--ui-icon)]" />
        <h2 className="font-heading text-lg font-semibold text-[var(--chat-text)]">Default chat settings</h2>
      </div>
      <p className="mb-4 text-xs text-[var(--chat-muted)]">
        These defaults apply project-wide — everyone with access (including collaborators on a shared project)
        starts new chats here with these settings. Leave a field on "Use each member's personal default" to fall
        back to each person's own preference instead. Anyone can still override per chat.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-[var(--chat-muted)]">Response blueprint</Label>
          <Select value={blueprint} onValueChange={(v) => setBlueprint(v as any)} disabled={disabled}>
            <SelectTrigger>
              <SelectValue>
                {(() => {
                  const Icon = blueprint === 'inherit' ? UserCog : getModeIcon(blueprint);
                  const label = blueprint === 'inherit' ? 'Use each member\'s personal default' : BLUEPRINT_LABELS[blueprint as BlueprintValue];
                  return (
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-[var(--ui-icon)]" />
                      {label}
                    </span>
                  );
                })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inherit">
                <span className="flex items-center gap-2"><UserCog className="h-4 w-4 text-[var(--ui-icon)]" />Use each member's personal default</span>
              </SelectItem>
              {BLUEPRINT_VALUES.map(v => {
                const Icon = getModeIcon(v);
                return (
                  <SelectItem key={v} value={v}>
                    <span className="flex items-center gap-2"><Icon className="h-4 w-4 text-[var(--ui-icon)]" />{BLUEPRINT_LABELS[v]}</span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-[var(--chat-muted)]">Processing power</Label>
          <Select value={power} onValueChange={(v) => setPower(v as any)} disabled={disabled}>
            <SelectTrigger>
              <SelectValue>
                {(() => {
                  const Icon = POWER_ICONS[power];
                  return (
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-[var(--ui-icon)]" />
                      {POWER_LABELS[power]}
                    </span>
                  );
                })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(['inherit', ...POWER_VALUES] as (PowerValue | 'inherit')[]).map(v => {
                const Icon = POWER_ICONS[v];
                return (
                  <SelectItem key={v} value={v}>
                    <span className="flex items-center gap-2"><Icon className="h-4 w-4 text-[var(--ui-icon)]" />{POWER_LABELS[v]}</span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-[var(--chat-muted)]">Preferred model</Label>
          <Select value={model} onValueChange={(v) => setModel(v as any)} disabled={disabled}>
            <SelectTrigger>
              <SelectValue>
                {(() => {
                  const Icon = MODEL_ICONS[model];
                  return (
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-[var(--ui-icon)]" />
                      {MODEL_LABELS[model]}
                    </span>
                  );
                })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(['inherit', ...MODEL_VALUES] as (ModelValue | 'inherit')[]).map(v => {
                const Icon = MODEL_ICONS[v];
                return (
                  <SelectItem key={v} value={v}>
                    <span className="flex items-center gap-2"><Icon className="h-4 w-4 text-[var(--ui-icon)]" />{MODEL_LABELS[v]}</span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-[var(--chat-muted)]">Knowledge base</Label>
          <div className="rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg)] p-3 space-y-2">
            <label className="flex items-center gap-2 text-xs text-[var(--chat-muted)]">
              <Checkbox
                checked={kb === null}
                onCheckedChange={(v) => setKb(v ? null : [])}
                disabled={disabled}
              />
              <UserCog className="h-4 w-4 text-[var(--ui-icon)]" />
              Use each member's personal default
            </label>
            {KB_VALUES.map(src => {
              const Icon = KB_ICONS[src];
              return (
                <label key={src} className="flex items-center gap-2 text-sm text-[var(--chat-text)]">
                  <Checkbox
                    checked={Array.isArray(kb) && kb.includes(src)}
                    onCheckedChange={() => toggleKb(src)}
                    disabled={disabled || kb === null}
                  />
                  <Icon className="h-4 w-4 text-[var(--ui-icon)]" />
                  {KB_LABELS[src]}
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {!isOwner && (
        <p className="mt-3 text-xs italic text-[var(--chat-muted)]">Only the project owner can change defaults.</p>
      )}

      <div className="mt-4 flex justify-end">
        <Button onClick={save} disabled={disabled || saving}>
          {saving ? 'Saving…' : 'Save defaults'}
        </Button>
      </div>
    </section>
  );
};

export default ProjectDefaultsCard;