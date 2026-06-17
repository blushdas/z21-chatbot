import { useEffect, useRef } from 'react';

/**
 * Preserves the user's scroll position inside a container when the container
 * is resized (e.g. width changes when the canvas split-screen opens/closes).
 *
 * - If the user is near the bottom, keeps them at the bottom.
 * - Otherwise, preserves their distance from the bottom across the resize.
 *
 * Only width changes trigger correction. Height growth (new messages) is
 * left to the normal auto-scroll logic.
 */
export function usePreserveScrollOnResize(
  containerRef: React.RefObject<HTMLElement | null>,
  threshold = 100,
) {
  const lastWidthRef = useRef<number | null>(null);
  const lastDistanceFromBottomRef = useRef<number>(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const recordDistance = () => {
      lastDistanceFromBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight;
    };

    // Capture distance on scroll so the latest value is ready at resize time.
    el.addEventListener('scroll', recordDistance, { passive: true });
    recordDistance();

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        const prev = lastWidthRef.current;
        lastWidthRef.current = width;
        if (prev === null || prev === width) continue;

        const wasNearBottom = lastDistanceFromBottomRef.current <= threshold;
        // Defer to after layout settles.
        requestAnimationFrame(() => {
          if (!el.isConnected) return;
          if (wasNearBottom) {
            el.scrollTop = el.scrollHeight;
          } else {
            const target = el.scrollHeight - el.clientHeight - lastDistanceFromBottomRef.current;
            el.scrollTop = Math.max(0, target);
          }
        });
      }
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', recordDistance);
    };
  }, [containerRef, threshold]);
}
