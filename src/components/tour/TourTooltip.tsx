import React, { useLayoutEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface Rect { top: number; left: number; width: number; height: number; }

interface Props {
  rect: Rect | null;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'auto' | 'inside-top-left';
  title: string;
  body: string;
  stepIndex: number;
  totalSteps: number;
  isFirst: boolean;
  isLast: boolean;
  alpha?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onFinish: () => void;
  onExit: () => void;
}

const TOOLTIP_W = 340;
const GAP = 56;
const VIEWPORT_PAD = 16;

const getTooltipWidth = (viewportWidth: number) => Math.min(TOOLTIP_W, viewportWidth - VIEWPORT_PAD * 2);

function computePosition(
  rect: Rect | null,
  placement: Props['placement'],
  tooltipH: number,
): { top: number; left: number; width: number; place: Props['placement'] } {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768;
  const tooltipW = getTooltipWidth(vw);
  if (!rect) {
    return { top: vh / 2 - tooltipH / 2, left: vw / 2 - tooltipW / 2, width: tooltipW, place: 'auto' };
  }
  if (placement === 'inside-top-left') {
    const top = Math.max(VIEWPORT_PAD, rect.top + VIEWPORT_PAD);
    const left = Math.max(VIEWPORT_PAD, rect.left + VIEWPORT_PAD);
    return { top, left, width: tooltipW, place: 'inside-top-left' };
  }
  let place = placement;
  const spaces = {
    top: rect.top - VIEWPORT_PAD,
    bottom: vh - (rect.top + rect.height) - VIEWPORT_PAD,
    left: rect.left - VIEWPORT_PAD,
    right: vw - (rect.left + rect.width) - VIEWPORT_PAD,
  };
  const fits = {
    top: spaces.top >= tooltipH + GAP,
    bottom: spaces.bottom >= tooltipH + GAP,
    left: spaces.left >= tooltipW + GAP,
    right: spaces.right >= tooltipW + GAP,
  };

  if (place === 'auto' || !fits[place]) {
    const ordered = [
      { place: 'top' as const, space: spaces.top, fits: fits.top },
      { place: 'bottom' as const, space: spaces.bottom, fits: fits.bottom },
      { place: 'left' as const, space: spaces.left, fits: fits.left },
      { place: 'right' as const, space: spaces.right, fits: fits.right },
    ];
    place = ordered.find((option) => option.fits)?.place
      ?? ordered.sort((a, b) => b.space - a.space)[0].place;
  }

  let top = 0, left = 0;
  switch (place) {
    case 'top':
      top = rect.top - GAP - tooltipH;
      left = rect.left + rect.width / 2 - tooltipW / 2;
      break;
    case 'bottom':
      top = rect.top + rect.height + GAP;
      left = rect.left + rect.width / 2 - tooltipW / 2;
      break;
    case 'left':
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.left - tooltipW - GAP;
      break;
    case 'right':
      top = rect.top + rect.height / 2 - tooltipH / 2;
      left = rect.left + rect.width + GAP;
      break;
  }
  // Clamp into viewport
  left = Math.max(VIEWPORT_PAD, Math.min(left, vw - tooltipW - VIEWPORT_PAD));
  top = Math.max(VIEWPORT_PAD, Math.min(top, vh - tooltipH - VIEWPORT_PAD));

  // Anti-overlap: if the clamped tooltip would cover the spotlight rect, shift it away
  const pad = GAP;
  const overlapsV = top < rect.top + rect.height + pad && top + tooltipH > rect.top - pad;
  const overlapsH = left < rect.left + rect.width + pad && left + tooltipW > rect.left - pad;
  if (overlapsV && overlapsH) {
    if (fits.left) {
      left = rect.left - tooltipW - GAP;
    } else if (fits.right) {
      left = rect.left + rect.width + GAP;
    } else if (fits.top) {
      top = rect.top - tooltipH - GAP;
    } else {
      top = rect.top + rect.height + GAP;
    }
    left = Math.max(VIEWPORT_PAD, Math.min(left, vw - tooltipW - VIEWPORT_PAD));
    top = Math.max(VIEWPORT_PAD, Math.min(top, vh - tooltipH - VIEWPORT_PAD));
  }

  return { top, left, width: tooltipW, place };
}

const TourTooltip: React.FC<Props> = ({
  rect, placement, title, body, stepIndex, totalSteps, isFirst, isLast, alpha,
  onPrev, onNext, onFinish, onExit,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [tooltipH, setTooltipH] = useState(180);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const measure = () => {
      if (ref.current) setTooltipH(Math.ceil(ref.current.getBoundingClientRect().height) || 220);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [title, body]);

  const { top, left, width } = computePosition(rect, placement, tooltipH);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={`Guided tour: ${title}`}
      style={{ position: 'fixed', top, left, width, zIndex: 10000 }}
    className="rounded-lg bg-card text-card-foreground shadow-2xl ring-2 ring-primary border-2 border-primary/60 p-3 animate-in fade-in zoom-in-95"
    >
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
            {stepIndex + 1} of {totalSteps}
          </span>
        </div>
        <button
          onClick={onExit}
          aria-label="Exit guided tour"
          className="text-muted-foreground hover:text-foreground transition-colors -mt-1 -mr-1 p-1 rounded-md hover:bg-accent"
        >
          <X size={16} />
        </button>
      </div>
      <h3 className="text-sm font-semibold leading-tight mb-1 flex items-center gap-2">
        <span>{title}</span>
        {alpha && (
          <span
            className="inline-flex items-center rounded-full border border-amber-400/50 bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-300"
            title="This feature is in alpha — expect bugs and tweaks."
            aria-label="Alpha feature"
          >
            Alpha
          </span>
        )}
      </h3>
      <p className="text-[13px] text-muted-foreground leading-snug mb-3">{body}</p>
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onExit}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
        >
          Skip tour
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={onPrev}
            disabled={isFirst}
            className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs font-medium border border-border bg-background hover:bg-accent disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          {isLast ? (
            <button
              onClick={onFinish}
              className="inline-flex items-center gap-1 h-7 px-3 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Check size={14} /> Finish
            </button>
          ) : (
            <button
              onClick={onNext}
              className="inline-flex items-center gap-1 h-7 px-3 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Next <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TourTooltip;