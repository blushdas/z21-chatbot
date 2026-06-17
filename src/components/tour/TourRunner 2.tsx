import React, { useEffect, useLayoutEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useTour } from '@/context/TourContext';
import { tourSteps } from '@/data/tourSteps';
import { useSidebarState } from '@/hooks/useSidebarState';
import TourOverlay from './TourOverlay';
import TourTooltip from './TourTooltip';
import logger from '@/utils/logger';

interface Rect { top: number; left: number; width: number; height: number; }

const isDesktop = () => typeof window === 'undefined' ? true : window.matchMedia('(min-width: 640px)').matches;

const TourRunner: React.FC = () => {
  const { status, currentStep, totalSteps, next, prev, exit, finish } = useTour();
  const { openSidebar } = useSidebarState();
  const [rect, setRect] = useState<Rect | null>(null);
  const [skipNotice, setSkipNotice] = useState(false);

  const active = status === 'in_progress';
  const step = tourSteps[currentStep] ?? tourSteps[0];

  // Run beforeShow hooks when step changes
  useEffect(() => {
    if (!active) return;
    if (step.beforeShow === 'open-sidebar') {
      openSidebar();
    }
  }, [active, step.id, step.beforeShow, openSidebar]);

  // Mobile gate
  useEffect(() => {
    if (!active) return;
    if (!isDesktop()) {
      toast.info('Guided Tour is available on desktop.');
      exit();
    }
  }, [active, exit]);

  // Resolve target rect + observe
  const resolveRect = useCallback(() => {
    if (!active || !step.targetSelector) {
      setRect(null);
      return;
    }
    // Try resolution with a few retries to let beforeShow open UI
    let attempts = 0;
    let observer: ResizeObserver | null = null;
    let trackedEl: HTMLElement | null = null;
    const tryResolve = () => {
      const el = document.querySelector(step.targetSelector!) as HTMLElement | null;
      if (el) {
        try { el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' }); } catch { /* noop */ }
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        setSkipNotice(false);
        // Re-measure after smooth scroll settles so the spotlight tracks the final position
        window.setTimeout(() => {
          const r2 = el.getBoundingClientRect();
          setRect({ top: r2.top, left: r2.left, width: r2.width, height: r2.height });
        }, 320);
        // Track size changes (e.g. lists rendering in after the initial measure)
        if (typeof ResizeObserver !== 'undefined') {
          trackedEl = el;
          observer = new ResizeObserver(() => {
            const rr = el.getBoundingClientRect();
            setRect({ top: rr.top, left: rr.left, width: rr.width, height: rr.height });
          });
          observer.observe(el);
        }
        return true;
      }
      return false;
    };
    if (tryResolve()) return;
    const interval = window.setInterval(() => {
      attempts += 1;
      if (tryResolve() || attempts > 6) {
        window.clearInterval(interval);
        if (attempts > 6) {
          logger.warn?.(`[tour] target missing for step ${step.id}`);
          setRect(null);
          setSkipNotice(true);
        }
      }
    }, 120);
    return () => {
      window.clearInterval(interval);
      if (observer && trackedEl) observer.unobserve(trackedEl);
      observer?.disconnect();
    };
  }, [active, step.id, step.targetSelector]);

  useLayoutEffect(() => {
    const cleanup = resolveRect();
    return () => { if (typeof cleanup === 'function') cleanup(); };
  }, [resolveRect, currentStep]);

  // Track resize/scroll
  useEffect(() => {
    if (!active) return;
    const onChange = () => resolveRect();
    window.addEventListener('resize', onChange);
    window.addEventListener('scroll', onChange, true);
    return () => {
      window.removeEventListener('resize', onChange);
      window.removeEventListener('scroll', onChange, true);
    };
  }, [active, resolveRect]);

  // Keyboard
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); exit(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, next, prev, exit]);

  if (!active) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  return (
    <>
      <TourOverlay rect={rect} />
      <TourTooltip
        rect={rect}
        placement={step.placement}
        title={step.title}
        body={skipNotice
          ? `${step.body}\n\n(This area isn't visible right now — you can keep going.)`
          : step.body}
        stepIndex={currentStep}
        totalSteps={totalSteps}
        isFirst={isFirst}
        isLast={isLast}
        alpha={step.alpha}
        onPrev={prev}
        onNext={next}
        onFinish={finish}
        onExit={exit}
      />
    </>
  );
};

export default TourRunner;