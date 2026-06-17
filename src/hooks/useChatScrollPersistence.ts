import { useEffect, useRef } from 'react';

/**
 * No-op. Previously persisted per-chat scroll position; product decision is
 * to always open chats scrolled to the bottom (latest message), so restoration
 * is disabled for consistency across all chats.
 */
export function useChatScrollPersistence(
  containerRef: React.RefObject<HTMLDivElement>,
  chatId: string | null | undefined,
  ready: boolean, // true once messages are loaded from DB
) {
  // Intentionally empty - see file header.
  void containerRef; void chatId; void ready;
}
