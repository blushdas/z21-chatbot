import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Canvases are chat-native. A standalone /canvas/:id URL must redirect
 * into the parent chat with the canvas open in split-screen.
 */
const CanvasPage: React.FC = () => {
  const { canvasId } = useParams<{ canvasId: string }>();
  const [target, setTarget] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    if (!canvasId) {
      setResolved(true);
      return;
    }
    let cancelled = false;
    supabase
      .from('canvases')
      .select('chat_id')
      .eq('id', canvasId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data?.chat_id) {
          setTarget(`/chat/${data.chat_id}?canvas=${canvasId}`);
        } else {
          // Orphan / not found — drop into chat home.
          setTarget('/chat');
        }
        setResolved(true);
      });
    return () => {
      cancelled = true;
    };
  }, [canvasId]);

  if (!canvasId) return <Navigate to="/chat" replace />;
  if (!resolved) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return <Navigate to={target ?? '/chat'} replace />;
};

export default CanvasPage;