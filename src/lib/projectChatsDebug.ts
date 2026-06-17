// Lightweight dev-only pub/sub so the consistency badge can compare what
// each project view is rendering. Safe in production (no-op outside DEV).

export type ViewKey = 'workspace' | 'hero';

export interface ChatSetSnapshot {
  view: ViewKey;
  folderId: string;
  ids: string[];
  updatedAt: number;
}

declare global {
  interface Window {
    __projectChatsDebug?: Record<string, ChatSetSnapshot>;
  }
}

const EVENT = 'project-chats:update';

const enabled = () => {
  try {
    return !!import.meta.env?.DEV;
  } catch {
    return false;
  }
};

const keyOf = (view: ViewKey, folderId: string) => `${view}:${folderId}`;

export function publishProjectChats(view: ViewKey, folderId: string, ids: string[]) {
  if (!enabled() || typeof window === 'undefined' || !folderId) return;
  window.__projectChatsDebug = window.__projectChatsDebug || {};
  window.__projectChatsDebug[keyOf(view, folderId)] = {
    view,
    folderId,
    ids: [...ids].sort(),
    updatedAt: Date.now(),
  };
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function readProjectChats(folderId: string) {
  if (!enabled() || typeof window === 'undefined' || !folderId) {
    return { workspace: null as ChatSetSnapshot | null, hero: null as ChatSetSnapshot | null };
  }
  const store = window.__projectChatsDebug || {};
  return {
    workspace: store[keyOf('workspace', folderId)] || null,
    hero: store[keyOf('hero', folderId)] || null,
  };
}

export const PROJECT_CHATS_EVENT = EVENT;
export const isDebugEnabled = enabled;
