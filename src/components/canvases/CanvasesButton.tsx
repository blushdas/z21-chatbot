import React, { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import CanvasesDrawer from './CanvasesDrawer';

const CanvasesButton: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { count: c } = await supabase
        .from('canvases')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', user.id)
        .neq('status', 'deleted');
      if (!cancelled && typeof c === 'number') setCount(c);
    })();
    return () => { cancelled = true; };
  }, [user?.id, isOpen]);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        data-tour="canvases"
        className="flex items-center gap-1.5 text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)] dark:hover:bg-gray-700"
        onClick={() => setIsOpen(true)}
      >
        <FileText size={16} className={count > 0 ? 'text-brand-blue' : ''} />
        <span className="hidden sm:inline">Canvases</span>
        {count > 0 && (
          <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs rounded-full px-1.5 py-0.5 min-w-5 text-center">
            {count}
          </span>
        )}
      </Button>
      <CanvasesDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default CanvasesButton;