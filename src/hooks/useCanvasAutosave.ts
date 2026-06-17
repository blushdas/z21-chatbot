import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { tiptapToPlainText } from '@/lib/canvas/markdownToTiptap';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useCanvasAutosave(canvasId: string | undefined, doc: unknown, delayMs = 1500) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRunRef = useRef(true);
  const lastCanvasIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!canvasId) return;
    if (firstRunRef.current) {
      firstRunRef.current = false;
      lastCanvasIdRef.current = canvasId;
      return;
    }
    // When switching canvases, the parent's `doc` state still holds the
    // previous canvas's content until its load effect replaces it. Skip
    // the save so we don't overwrite the newly selected canvas with the
    // prior canvas's doc.
    if (lastCanvasIdRef.current !== canvasId) {
      lastCanvasIdRef.current = canvasId;
      if (timerRef.current) clearTimeout(timerRef.current);
      setStatus('idle');
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus('saving');
    timerRef.current = setTimeout(async () => {
      const plain = tiptapToPlainText(doc);
      const { error } = await supabase
        .from('canvases')
        .update({ content_json: doc as never, content_plaintext: plain })
        .eq('id', canvasId);
      if (error) {
        setStatus('error');
      } else {
        setStatus('saved');
        setLastSavedAt(new Date());
      }
    }, delayMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasId, doc]);

  return { status, lastSavedAt };
}