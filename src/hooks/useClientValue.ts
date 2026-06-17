import { useEffect, useState } from 'react';

/**
 * Returns a value that is safe to use during SSR / first paint by deferring
 * any browser-only read (e.g. localStorage) until after mount. The initial
 * render always returns `fallback`, then `read()` runs once on the client
 * and the value is swapped in. Prevents hydration mismatches caused by
 * reading storage during render.
 */
export function useClientValue<T>(read: () => T, fallback: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(fallback);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try { setValue(read()); } catch { /* keep fallback */ }
    setHydrated(true);
    // read is intentionally not in deps — caller controls re-runs via key prop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Expose a hydrated flag via a function-returned setter not required; we
  // only return the tuple to keep usage ergonomic.
  void hydrated;
  return [value, setValue];
}

/** True after the component has mounted on the client. */
export function useIsHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  return hydrated;
}