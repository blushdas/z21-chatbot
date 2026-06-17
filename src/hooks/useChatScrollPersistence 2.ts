import { useEffect, useRef } from 'react';

/**
 * Persist the chat scroll position per chatId so refresh / chat switch
 * restores the user to the exact same spot in the conversation.
 * Uses localStorage so it survives full page reloads.
 */
export function useChatScrollPersistence(
  containerRef: React.RefObject<HTMLDivElement>,
  chatId: string | null | undefined,
  ready: boolean, // true once messages are loaded from DB
) {
  const lastSaved = useRef(0);
  const restoredFor = useRef<string | null>(null);

  // Save scrollTop (throttled)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !chatId) return;
    const key = `chatScroll:${chatId}`;
    let raf = 0;
    const onScroll = () => {
      const now = Date.now();
      if (now - lastSaved.current < 250) return;
      lastSaved.current = now;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        try { localStorage.setItem(key, String(el.scrollTop)); } catch {}
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
      // Final flush
      try { localStorage.setItem(key, String(el.scrollTop)); } catch {}
    };
  }, [containerRef, chatId]);

  // Restore scrollTop once messages are loaded for this chat.
  // Runs AFTER useChatScroll's scroll-to-last-message (which uses smooth 100ms delay)
  // so we override it with the persisted position.
  useEffect(() => {
    if (!ready || !chatId) return;
    if (restoredFor.current === chatId) return;
    const el = containerRef.current;
    if (!el) return;
    let raw: string | null = null;
    try { raw = localStorage.getItem(`chatScroll:${chatId}`); } catch {}
    if (raw === null) {
      restoredFor.current = chatId;
      return;
    }
    const target = Number(raw);
    if (!Number.isFinite(target) || target < 0) {
      restoredFor.current = chatId;
      return;
    }
    // Wait for layout + override the default scrollToLastMessageTop.
    const t = window.setTimeout(() => {
      const node = containerRef.current;
      if (!node) return;
      const max = Math.max(0, node.scrollHeight - node.clientHeight);
      node.scrollTop = Math.min(target, max);
      restoredFor.current = chatId;
    }, 400);
    return () => window.clearTimeout(t);
  }, [containerRef, chatId, ready]);
}
