import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Small "Alpha" badge used next to the Canvas feature name to signal that
 * Canvas is still in testing.
 */
const AlphaBadge: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (
  <span
    title={title ?? 'Alpha testing — expect minor issues and ongoing changes'}
    className={cn(
      'inline-flex items-center rounded px-1 py-px text-[9px] font-semibold uppercase tracking-wider',
      'bg-amber-400/15 text-amber-500 ring-1 ring-amber-400/40',
      className,
    )}
  >
    Alpha
  </span>
);

export default AlphaBadge;