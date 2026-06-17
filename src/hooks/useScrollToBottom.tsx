import { useEffect, useState, useCallback, useRef } from 'react';

interface UseScrollToBottomReturn {
  isNearBottom: boolean;
  scrollToBottom: () => void;
}

/**
 * Hook to detect if user has scrolled away from bottom and provide scroll function
 * @param containerRef - Reference to the scrollable container
 * @param threshold - Distance from bottom (in pixels) to consider "near bottom" (default: 100)
 */
export const useScrollToBottom = (
  containerRef: React.RefObject<HTMLDivElement>,
  threshold: number = 100
): UseScrollToBottomReturn => {
  const [isNearBottom, setIsNearBottom] = useState(true);
  const rafRef = useRef<number | null>(null);

  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const checkScrollPosition = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        const nearBottom = scrollBottom <= threshold;
        setIsNearBottom(nearBottom);
      });
    };

    // Initial check
    checkScrollPosition();

    // Listen to scroll events
    container.addEventListener('scroll', checkScrollPosition, { passive: true });

    return () => {
      container.removeEventListener('scroll', checkScrollPosition);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [containerRef, threshold]);

  return { isNearBottom, scrollToBottom };
};
