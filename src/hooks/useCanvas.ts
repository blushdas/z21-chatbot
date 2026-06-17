import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/SupabaseAuthContext';
import { markdownToTiptap, tiptapToPlainText } from '@/lib/canvas/markdownToTiptap';

export interface Canvas {
  id: string;
  owner_id: string;
  chat_id: string | null;
  title: string;
  content_json: unknown;
  content_plaintext: string;
  status: 'active' | 'archived' | 'deleted';
  created_at: string;
  updated_at: string;
  last_opened_at: string;
  pinned_at: string | null;
  created_from_message_id?: string | null;
}

export function useCanvas(canvasId: string | undefined) {
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!canvasId) {
      setCanvas(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    supabase
      .from('canvases')
      .select('*')
      .eq('id', canvasId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setError(error.message);
        setCanvas((data as unknown as Canvas) ?? null);
        setLoading(false);
        if (data) {
          void supabase.from('canvases').update({ last_opened_at: new Date().toISOString() }).eq('id', canvasId);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [canvasId, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  return { canvas, loading, error, setCanvas, reload };
}

export function useCanvasList(limit = 20) {
  const { user } = useAuth();
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('canvases')
      .select('*')
      .eq('owner_id', user.id)
      .eq('status', 'active')
      .not('chat_id', 'is', null)
      .order('pinned_at', { ascending: false, nullsFirst: false })
      .order('last_opened_at', { ascending: false })
      .limit(limit);
    setCanvases((data as unknown as Canvas[]) ?? []);
    setLoading(false);
  }, [user, limit]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { canvases, loading, refresh };
}

/**
 * Per-chat canvases. Canvases are chat-native: this is the only correct
 * way to list them in the UI.
 */
export function useChatCanvases(chatId: string | null | undefined) {
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!chatId) {
      setCanvases([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('canvases')
      .select('*')
      .eq('chat_id', chatId)
      .eq('status', 'active')
      .order('last_opened_at', { ascending: false });
    setCanvases((data as unknown as Canvas[]) ?? []);
    setLoading(false);
  }, [chatId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { canvases, loading, refresh };
}

export async function createCanvasFromMarkdown(opts: {
  ownerId: string;
  markdown: string;
  title?: string;
  chatId: string; // required — canvases are chat-native
  createdFromMessageId?: string | null;
}): Promise<Canvas | null> {
  if (!opts.chatId) {
    console.error('createCanvasFromMarkdown: chatId is required');
    return null;
  }
  const contentJson = markdownToTiptap(opts.markdown);
  const plain = tiptapToPlainText(contentJson);
  const explicitTitle = opts.title?.trim();
  // Use a neutral placeholder when no title is supplied; the AI titler below
  // will replace it with an accurate summary-based title shortly after insert.
  const title = explicitTitle || 'Untitled canvas';
  const { data, error } = await supabase
    .from('canvases')
    .insert({
      owner_id: opts.ownerId,
      chat_id: opts.chatId,
      created_from_message_id: opts.createdFromMessageId ?? null,
      title,
      content_json: contentJson as never,
      content_plaintext: plain,
    })
    .select()
    .single();
  if (error) {
    console.error('createCanvas error', error);
    return null;
  }
  const canvas = data as unknown as Canvas;

  // Fire-and-forget: ask the AI to title the canvas based on its content so
  // the tab/title reflects the document instead of the first sliced line.
  if (!explicitTitle && plain.trim().length > 0) {
    void autoTitleCanvas(canvas.id, plain);
  }

  return canvas;
}

export async function autoTitleCanvas(canvasId: string, plainText: string): Promise<void> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-canvas-title', {
      body: { content: plainText.slice(0, 6000) },
    });
    if (error) return;
    const aiTitle = (data as { title?: string } | null)?.title?.trim();
    if (!aiTitle) return;
    await supabase.from('canvases').update({ title: aiTitle }).eq('id', canvasId);
    try {
      window.dispatchEvent(new CustomEvent('canvas:titleUpdated', { detail: { canvasId, title: aiTitle } }));
    } catch { /* noop */ }
  } catch (e) {
    console.warn('autoTitleCanvas failed', e);
  }
}

// Title a brand-new (blank) canvas based on the surrounding chat conversation
// so the tab doesn't read "Untitled canvas" while the user starts working.
export async function autoTitleCanvasFromChat(canvasId: string, chatId: string): Promise<void> {
  try {
    const { data } = await supabase
      .from('chats')
      .select('messages')
      .eq('id', chatId)
      .maybeSingle();
    const raw = (data?.messages ?? []) as Array<{ role?: string; content?: string }>;
    if (!Array.isArray(raw) || raw.length === 0) return;
    const transcript = raw
      .slice(-8)
      .map((m) => {
        const role = typeof m?.role === 'string' ? m.role : 'user';
        const content = typeof m?.content === 'string' ? m.content : '';
        return content.trim() ? `${role.toUpperCase()}: ${content}` : '';
      })
      .filter(Boolean)
      .join('\n\n');
    if (!transcript.trim()) return;
    await autoTitleCanvas(canvasId, transcript);
  } catch (e) {
    console.warn('autoTitleCanvasFromChat failed', e);
  }
}

export async function createBlankCanvas(ownerId: string, chatId: string, title = 'Untitled canvas'): Promise<Canvas | null> {
  if (!chatId) {
    console.error('createBlankCanvas: chatId is required');
    return null;
  }
  const { data, error } = await supabase
    .from('canvases')
    .insert({ owner_id: ownerId, chat_id: chatId, title })
    .select()
    .single();
  if (error) return null;
  return data as unknown as Canvas;
}

export async function renameCanvas(id: string, title: string): Promise<void> {
  await supabase.from('canvases').update({ title }).eq('id', id);
}

export async function deleteCanvas(id: string): Promise<void> {
  const { error } = await supabase
    .from('canvases')
    .update({ status: 'deleted' })
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error) throw error;
}

export async function setCanvasPinned(id: string, pinned: boolean): Promise<void> {
  await supabase
    .from('canvases')
    // `pinned_at` doubles as both the flag and the sort key.
    .update({ pinned_at: pinned ? new Date().toISOString() : null })
    .eq('id', id);
}