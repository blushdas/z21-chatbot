
import { useEffect, useState } from 'react';

export function useComposerHeight() {
  const [h, setH] = useState<number>(0);
  useEffect(() => {
    const el = document.getElementById('composer-root');
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => setH(entry.contentRect.height));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return h;
}
