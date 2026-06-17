import { supabase } from '@/integrations/supabase/client';

/**
 * Lightweight product-analytics client. Batches user-action events and
 * ships them to the `ingest-analytics` edge function. Never throws.
 */

export type AnalyticsCategory =
  | 'ai'
  | 'chat'
  | 'file'
  | 'folder'
  | 'canvas'
  | 'nav'
  | 'auth'
  | 'settings'
  | 'feedback'
  | 'construct'
  | 'voice'
  | 'prompt'
  | 'dual'
  | 'favorite';

export interface AnalyticsEventInput {
  event_name: string;
  category: AnalyticsCategory;
  chat_id?: string | null;
  message_id?: string | null;
  folder_id?: string | null;
  canvas_id?: string | null;
  file_id?: string | null;
  mode?: string | null;
  model?: string | null;
  response_mode?: string | null;
  duration_ms?: number | null;
  prompt_tokens?: number | null;
  completion_tokens?: number | null;
  total_tokens?: number | null;
  properties?: Record<string, unknown>;
}

interface QueuedEvent extends AnalyticsEventInput {
  occurred_at: string;
  session_id: string;
  source: 'client';
  client: Record<string, unknown>;
}

const SESSION_KEY = 'analytics_session_id';
const MAX_BATCH = 20;
const FLUSH_MS = 4000;

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = (crypto?.randomUUID?.() ?? `s_${Date.now()}_${Math.random().toString(36).slice(2)}`);
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return 'no-session';
  }
}

function getClientContext(): Record<string, unknown> {
  if (typeof window === 'undefined') return {};
  return {
    ua: navigator.userAgent,
    platform: (navigator as any).userAgentData?.platform ?? navigator.platform,
    lang: navigator.language,
    vw: window.innerWidth,
    vh: window.innerHeight,
    route: window.location.pathname + window.location.search,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

let queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let listenersBound = false;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flush();
  }, FLUSH_MS);
}

async function flush(useBeacon = false): Promise<void> {
  if (queue.length === 0) return;
  const batch = queue.splice(0, queue.length);
  try {
    const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/ingest-analytics`;
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const body = JSON.stringify({ events: batch });

    if (useBeacon && typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
      const blob = new Blob([body], { type: 'application/json' });
      // sendBeacon cannot set auth headers; fall back to fetch if we have a token
      if (!token) {
        navigator.sendBeacon(url, blob);
        return;
      }
    }

    await fetch(url, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body,
    });
  } catch {
    // Swallow — analytics must never break the app
  }
}

function bindUnloadListeners() {
  if (listenersBound || typeof window === 'undefined') return;
  listenersBound = true;
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flush(true);
  });
  window.addEventListener('pagehide', () => void flush(true));
}

/**
 * Enqueue a user-action event. Safe to call from anywhere; never throws.
 */
export function track(input: AnalyticsEventInput): void {
  try {
    bindUnloadListeners();
    queue.push({
      ...input,
      properties: input.properties ?? {},
      occurred_at: new Date().toISOString(),
      session_id: getSessionId(),
      source: 'client',
      client: getClientContext(),
    });
    if (queue.length >= MAX_BATCH) {
      if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
      void flush();
    } else {
      scheduleFlush();
    }
  } catch {
    // ignore
  }
}

/** Force-flush queued events (e.g. before navigation away). */
export function flushAnalytics(): Promise<void> {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
  return flush();
}