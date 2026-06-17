import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/SupabaseAuthContext';
import { tourSteps, TOUR_ID } from '@/data/tourSteps';
import logger from '@/utils/logger';

export type TourStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped' | 'disabled';

interface TourState {
  status: TourStatus;
  currentStep: number;
  loaded: boolean;
}

interface TourContextValue extends TourState {
  totalSteps: number;
  start: () => void;
  next: () => void;
  prev: () => void;
  exit: () => void;
  finish: () => void;
  restart: () => void;
  goTo: (step: number) => void;
}

const LS_KEY = 'daryle.tour.main';

function readLocal(): Partial<TourState> | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function writeLocal(s: TourState) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch { /* noop */ }
}

const TourContext = createContext<TourContextValue | null>(null);

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<TourState>(() => {
    const local = readLocal();
    return {
      status: (local?.status as TourStatus) ?? 'not_started',
      currentStep: local?.currentStep ?? 0,
      loaded: false,
    };
  });
  const saveTimer = useRef<number | null>(null);

  // Load from Supabase on auth
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.id) {
        setState((s) => ({ ...s, loaded: true }));
        return;
      }
      const { data, error } = await (supabase as any)
        .from('user_onboarding_tours')
        .select('status,current_step')
        .eq('user_id', user.id)
        .eq('tour_id', TOUR_ID)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        logger.warn?.('[tour] load failed', error.message);
        setState((s) => ({ ...s, loaded: true }));
        return;
      }
      if (data) {
        setState({ status: data.status as TourStatus, currentStep: data.current_step ?? 0, loaded: true });
      } else {
        setState((s) => ({ ...s, loaded: true }));
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const persist = useCallback((patch: Partial<{ status: TourStatus; current_step: number; completed_at: string | null; skipped_at: string | null; disabled_at: string | null }>) => {
    if (!user?.id) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      const { error } = await (supabase as any)
        .from('user_onboarding_tours')
        .upsert({ user_id: user.id, tour_id: TOUR_ID, ...patch }, { onConflict: 'user_id,tour_id' });
      if (error) logger.warn?.('[tour] persist failed', error.message);
    }, 150);
  }, [user?.id]);

  const update = useCallback((next: Partial<TourState>, persistPatch?: Parameters<typeof persist>[0]) => {
    setState((prev) => {
      const merged = { ...prev, ...next, loaded: true };
      writeLocal(merged);
      return merged;
    });
    if (persistPatch) persist(persistPatch);
  }, [persist]);

  const totalSteps = tourSteps.length;

  const start = useCallback(() => {
    update({ status: 'in_progress', currentStep: 0 }, { status: 'in_progress', current_step: 0 });
  }, [update]);

  const next = useCallback(() => {
    setState((prev) => {
      const nextStep = Math.min(prev.currentStep + 1, totalSteps - 1);
      const merged = { ...prev, currentStep: nextStep, status: 'in_progress' as TourStatus };
      writeLocal(merged);
      persist({ status: 'in_progress', current_step: nextStep });
      return merged;
    });
  }, [persist, totalSteps]);

  const prev = useCallback(() => {
    setState((p) => {
      const s = Math.max(p.currentStep - 1, 0);
      const merged = { ...p, currentStep: s };
      writeLocal(merged);
      persist({ current_step: s });
      return merged;
    });
  }, [persist]);

  const goTo = useCallback((step: number) => {
    const clamped = Math.max(0, Math.min(step, totalSteps - 1));
    update({ currentStep: clamped, status: 'in_progress' }, { status: 'in_progress', current_step: clamped });
  }, [update, totalSteps]);

  const exit = useCallback(() => {
    update({ status: 'skipped' }, { status: 'skipped', skipped_at: new Date().toISOString() });
  }, [update]);

  const finish = useCallback(() => {
    update({ status: 'completed', currentStep: totalSteps - 1 }, { status: 'completed', current_step: totalSteps - 1, completed_at: new Date().toISOString() });
  }, [update, totalSteps]);

  const restart = useCallback(() => {
    update({ status: 'in_progress', currentStep: 0 }, { status: 'in_progress', current_step: 0 });
  }, [update]);

  const value = useMemo<TourContextValue>(() => ({
    ...state, totalSteps, start, next, prev, exit, finish, restart, goTo,
  }), [state, totalSteps, start, next, prev, exit, finish, restart, goTo]);

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used within TourProvider');
  return ctx;
}