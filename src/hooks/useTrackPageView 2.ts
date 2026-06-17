import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { track } from '@/lib/analytics';

/**
 * Fires a `nav.page_view` event on every route change.
 */
export function useTrackPageView() {
  const location = useLocation();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const path = location.pathname;
    if (lastPath.current === path) return;
    lastPath.current = path;
    track({
      event_name: 'nav.page_view',
      category: 'nav',
      properties: {
        path,
        search: location.search || undefined,
      },
    });
  }, [location.pathname, location.search]);
}