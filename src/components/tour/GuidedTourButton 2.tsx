import React from 'react';
import { Compass } from 'lucide-react';
import { toast } from 'sonner';
import { useTour } from '@/context/TourContext';

const GuidedTourButton: React.FC = () => {
  const { status, start, exit, restart } = useTour();
  const active = status === 'in_progress';

  const onClick = () => {
    if (typeof window !== 'undefined' && !window.matchMedia('(min-width: 640px)').matches) {
      toast.info('Guided Tour is available on desktop.');
      return;
    }
    if (active) {
      exit();
      return;
    }
    if (status === 'completed' || status === 'skipped') restart();
    else start();
  };

  return (
    <button
      data-tour="guided-tour-button"
      onClick={onClick}
      aria-pressed={active}
      title={active ? 'Exit guided tour' : 'Start guided tour'}
      className={`hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium transition-all ${
        active
          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
          : 'text-[var(--ui-icon)] hover:text-[var(--ui-icon-hover)] hover:bg-[var(--ui-bg-hover)]'
      }`}
    >
      <Compass size={14} />
      <span>Guided Tour</span>
    </button>
  );
};

export default GuidedTourButton;