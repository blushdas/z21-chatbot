import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/SupabaseAuthContext';
import { tiptapToPlainText } from '@/lib/canvas/markdownToTiptap';

export type CanvasVersionSource = 'autosave' | 'manual' | 'ai-edit' | 'restore';

export interface CanvasVersion {
  id: string;
  canvas_id: string;
  owner_id: string;
  title: string;
  content_json: unknown;
  content_plaintext: string;
  source: CanvasVersionSource;
  created_at: string;
}

export function useCanvasVersions(canvasId: string | undefined) {
  const [versions, setVersions] = useState<CanvasVersion[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!canvasId) return;
    setLoading(true);
    const { data } = await supabase
      .from('canvas_versions' as never)
      .select('*')
      .eq('canvas_id', canvasId)
      .order('created_at', { ascending: false })
      .limit(100);
    setVersions((data as unknown as CanvasVersion[]) ?? []);
    setLoading(false);
  }, [canvasId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { versions, loading, refresh };
}

export async function snapshotCanvasVersion(opts: {
  canvasId: string;
  ownerId: string;
  title: string;
  contentJson: unknown;
  source: CanvasVersionSource;
}): Promise<void> {
  const plain = tiptapToPlainText(opts.contentJson);
  await supabase.from('canvas_versions' as never).insert({
    canvas_id: opts.canvasId,
    owner_id: opts.ownerId,
    title: opts.title,
    content_json: opts.contentJson as never,
    content_plaintext: plain,
    source: opts.source,
  } as never);
}

export async function deleteCanvasVersion(versionId: string): Promise<void> {
  await supabase.from('canvas_versions' as never).delete().eq('id', versionId);
}

export function useSnapshotOnSave(
  canvasId: string | undefined,
  status: 'idle' | 'saving' | 'saved' | 'error',
  getSnapshot: () => { title: string; contentJson: unknown } | null,
  options?: { minIntervalMs?: number; onSnapshot?: () => void },
) {
  const { user } = useAuth();
  const minIntervalMs = options?.minIntervalMs ?? 60_000;
  const lastRef = useRef<number>(0);
  const prevStatusRef = useRef(status);

  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;
    if (!canvasId || !user) return;
    if (prev === 'saving' && status === 'saved') {
      const now = Date.now();
      if (now - lastRef.current < minIntervalMs) return;
      const snap = getSnapshot();
      if (!snap) return;
      lastRef.current = now;
      void snapshotCanvasVersion({
        canvasId,
        ownerId: user.id,
        title: snap.title,
        contentJson: snap.contentJson,
        source: 'autosave',
      }).then(() => options?.onSnapshot?.());
    }
  }, [status, canvasId, user, getSnapshot, minIntervalMs, options]);
}
