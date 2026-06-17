// Local-storage helpers for chat defaults (processing power, AI model,
// knowledge base sources). Mirrors keys used by ChatToolbarSelectors.

export const POWER_KEY = 'chat:processingPower';
export const MODEL_KEY = 'chat:aiModel';
export const KB_KEY = 'chat:knowledgeBaseSources';
export const BLUEPRINT_KEY = 'chat:defaultBlueprint';

export type PowerValue = 'auto' | 'instant' | 'thinking' | 'pro';
export type ModelValue = 'auto' | 'chatgpt' | 'gemini' | 'claude';
export type KbSource = 'ambassador' | 'company' | 'project' | 'bill_yeargin';
export type BlueprintValue = 'quickAnswer' | 'standard' | 'directQuotes' | 'noBlueprints';

export const POWER_VALUES: PowerValue[] = ['auto', 'instant', 'thinking', 'pro'];
export const MODEL_VALUES: ModelValue[] = ['auto', 'chatgpt', 'gemini', 'claude'];
export const KB_VALUES: KbSource[] = ['ambassador', 'company', 'project', 'bill_yeargin'];
export const BLUEPRINT_VALUES: BlueprintValue[] = ['quickAnswer', 'standard', 'directQuotes', 'noBlueprints'];

export const BLUEPRINT_LABELS: Record<BlueprintValue, string> = {
  quickAnswer: 'Standard Mode',
  standard: 'Wisdom Mode',
  directQuotes: 'Direct Quotes',
  noBlueprints: 'No Blueprints',
};

export function readBlueprint(): BlueprintValue {
  if (typeof window === 'undefined') return 'quickAnswer';
  try {
    const v = window.localStorage.getItem(BLUEPRINT_KEY);
    return (BLUEPRINT_VALUES as string[]).includes(v ?? '') ? (v as BlueprintValue) : 'quickAnswer';
  } catch { return 'quickAnswer'; }
}

export function writeBlueprint(v: BlueprintValue) {
  try { window.localStorage.setItem(BLUEPRINT_KEY, v); } catch { /* ignore */ }
}

export function readPower(): PowerValue {
  if (typeof window === 'undefined') return 'auto';
  try {
    const v = window.localStorage.getItem(POWER_KEY);
    return (POWER_VALUES as string[]).includes(v ?? '') ? (v as PowerValue) : 'auto';
  } catch { return 'auto'; }
}

export function writePower(v: PowerValue) {
  try { window.localStorage.setItem(POWER_KEY, v); } catch { /* ignore */ }
  try { window.dispatchEvent(new CustomEvent('chat:powerChange', { detail: { value: v } })); } catch { /* ignore */ }
}

export function readModel(): ModelValue {
  if (typeof window === 'undefined') return 'auto';
  try {
    const v = window.localStorage.getItem(MODEL_KEY);
    return (MODEL_VALUES as string[]).includes(v ?? '') ? (v as ModelValue) : 'auto';
  } catch { return 'auto'; }
}

export function writeModel(v: ModelValue) {
  try { window.localStorage.setItem(MODEL_KEY, v); } catch { /* ignore */ }
}

export function readKb(): KbSource[] {
  if (typeof window === 'undefined') return ['ambassador'];
  try {
    const raw = window.localStorage.getItem(KB_KEY);
    if (!raw) return ['ambassador'];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return ['ambassador'];
    return parsed.filter((v): v is KbSource => (KB_VALUES as string[]).includes(v));
  } catch { return ['ambassador']; }
}

export function writeKb(sources: KbSource[]) {
  try { window.localStorage.setItem(KB_KEY, JSON.stringify(sources)); } catch { /* ignore */ }
  try {
    window.dispatchEvent(new CustomEvent('chat:kbChange', {
      detail: { sources, enabled: sources.length > 0 },
    }));
  } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Per-chat overrides. These let users change processing power, AI model, or
// knowledge base for a single conversation without touching their saved
// defaults. Stored under a chatId-scoped key; absence = use default.
// ---------------------------------------------------------------------------
const overrideKey = (field: 'power' | 'model' | 'kb', chatId: string) =>
  `chat:override:${field}:${chatId}`;

function safeGet(key: string): string | null {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function safeSet(key: string, value: string) {
  try { window.localStorage.setItem(key, value); } catch { /* ignore */ }
}
function safeRemove(key: string) {
  try { window.localStorage.removeItem(key); } catch { /* ignore */ }
}

export function readPowerOverride(chatId?: string | null): PowerValue | null {
  if (!chatId || typeof window === 'undefined') return null;
  const v = safeGet(overrideKey('power', chatId));
  return (POWER_VALUES as string[]).includes(v ?? '') ? (v as PowerValue) : null;
}
export function writePowerOverride(chatId: string, v: PowerValue) {
  safeSet(overrideKey('power', chatId), v);
}
export function clearPowerOverride(chatId: string) {
  safeRemove(overrideKey('power', chatId));
}

export function readModelOverride(chatId?: string | null): ModelValue | null {
  if (!chatId || typeof window === 'undefined') return null;
  const v = safeGet(overrideKey('model', chatId));
  return (MODEL_VALUES as string[]).includes(v ?? '') ? (v as ModelValue) : null;
}
export function writeModelOverride(chatId: string, v: ModelValue) {
  safeSet(overrideKey('model', chatId), v);
}
export function clearModelOverride(chatId: string) {
  safeRemove(overrideKey('model', chatId));
}

export function readKbOverride(chatId?: string | null): KbSource[] | null {
  if (!chatId || typeof window === 'undefined') return null;
  const raw = safeGet(overrideKey('kb', chatId));
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((v): v is KbSource => (KB_VALUES as string[]).includes(v));
  } catch { return null; }
}
export function writeKbOverride(chatId: string, sources: KbSource[]) {
  safeSet(overrideKey('kb', chatId), JSON.stringify(sources));
}
export function clearKbOverride(chatId: string) {
  safeRemove(overrideKey('kb', chatId));
}