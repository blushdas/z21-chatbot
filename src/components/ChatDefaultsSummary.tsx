import React, { useEffect, useState } from 'react';
import { Gauge, Sparkles, BookOpen, BookX } from 'lucide-react';
import {
  readPower, readModel, readKb,
  readPowerOverride, readModelOverride, readKbOverride,
  type PowerValue, type ModelValue, type KbSource,
} from '@/lib/chatDefaults';
import { useIsHydrated } from '@/hooks/useClientValue';

const POWER_LABEL: Record<PowerValue, string> = {
  auto: 'Auto', instant: 'Instant', thinking: 'Thinking', pro: 'Pro',
};
const MODEL_LABEL: Record<ModelValue, string> = {
  auto: 'Auto', chatgpt: 'ChatGPT', gemini: 'Gemini', claude: 'Claude',
};
const KB_LABEL: Record<KbSource, string> = {
  ambassador: 'Ambassador Way',
  company: 'Your Company',
  project: 'Project Knowledge Base',
  bill_yeargin: 'Bill Yeargin',
};

type Props = { chatId?: string | null };

const ChatDefaultsSummary: React.FC<Props> = ({ chatId }) => {
  // Hydration-safe: render nothing on the first paint, then read storage
  // after mount. A tick counter re-reads on change events.
  const hydrated = useIsHydrated();
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!hydrated) return;
    const bump = () => setTick(t => t + 1);
    const events = ['chat:powerChange', 'chat:kbChange', 'storage'];
    events.forEach(ev => window.addEventListener(ev, bump));
    return () => events.forEach(ev => window.removeEventListener(ev, bump));
  }, [hydrated]);
  // Re-read whenever chatId changes too.
  useEffect(() => { if (hydrated) setTick(t => t + 1); }, [chatId, hydrated]);

  if (!hydrated) {
    // Reserve vertical space so the toolbar doesn't jump on hydration.
    return <div className="h-[18px] px-3 pt-2" aria-hidden />;
  }

  const powerOverride = readPowerOverride(chatId);
  const modelOverride = readModelOverride(chatId);
  const kbOverride = readKbOverride(chatId);

  const power = powerOverride ?? readPower();
  const model = modelOverride ?? readModel();
  const kb = kbOverride ?? readKb();

  const anyOverride = !!(powerOverride || modelOverride || kbOverride);

  const kbLabel = kb.length === 0
    ? 'No knowledge base'
    : kb.length === Object.keys(KB_LABEL).length
      ? 'All knowledge bases'
      : kb.map(s => KB_LABEL[s]).join(' + ');
  const KbIcon = kb.length === 0 ? BookX : BookOpen;

  const Chip: React.FC<{ icon: React.ElementType; label: string; overridden: boolean }> = ({ icon: Icon, label, overridden }) => (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 ${
        overridden
          ? 'bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/40'
          : 'text-[var(--chat-muted)]'
      }`}
    >
      <Icon className="h-3 w-3" />
      <span>{label}</span>
    </span>
  );

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 pt-2 text-[11px] text-[var(--chat-muted)]">
      <span className="font-medium">
        {anyOverride ? 'Chat overrides:' : 'Using your defaults:'}
      </span>
      <Chip icon={Gauge} label={POWER_LABEL[power]} overridden={!!powerOverride} />
      <span className="opacity-40">·</span>
      <Chip icon={Sparkles} label={MODEL_LABEL[model]} overridden={!!modelOverride} />
      <span className="opacity-40">·</span>
      <Chip icon={KbIcon} label={kbLabel} overridden={!!kbOverride} />
    </div>
  );
};

export default ChatDefaultsSummary;