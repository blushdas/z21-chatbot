import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Builds an aggregated project context string for chats that belong to a folder.
 * Includes project description, instructions, active memory items, and approved/reviewed sources.
 * Excludes Quick Links — those are shortcuts only and never fed to the AI.
 *
 * Returned string is passed to the chat edge function as `folderInstructions`,
 * which prepends it to the system prompt for that request.
 */
export function useFolderProjectContext(folderId?: string | null) {
  const [context, setContext] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!folderId) {
      setContext('');
      return;
    }
    setLoading(true);
    (async () => {
      const [folderRes, instrRes, memRes, srcRes] = await Promise.all([
        supabase.from('folders').select('title, description').eq('id', folderId).maybeSingle(),
        supabase.from('folder_instructions').select('content').eq('folder_id', folderId).maybeSingle(),
        supabase.from('folder_memory').select('category, content, status').eq('folder_id', folderId).order('updated_at', { ascending: false }).limit(50),
        supabase.from('folder_sources').select('title, url, summary, content, status').eq('folder_id', folderId).order('updated_at', { ascending: false }).limit(20),
      ]);
      if (cancelled) return;

      const parts: string[] = [];
      const f = folderRes.data as { title?: string; description?: string | null } | null;
      if (f?.title || f?.description) {
        parts.push(`# Project: ${f?.title ?? 'Untitled'}`);
        if (f?.description?.trim()) parts.push(f.description.trim());
      }

      const instr = (instrRes.data as { content?: string } | null)?.content?.trim();
      if (instr) {
        parts.push('## Project instructions');
        parts.push(instr);
      }

      const memActive = ((memRes.data ?? []) as Array<{ category: string; content: string; status: string }>).filter(m => m.status === 'active');
      if (memActive.length) {
        parts.push('## Project memory');
        for (const m of memActive) {
          parts.push(`- (${m.category}) ${m.content.trim()}`);
        }
      }

      // Project Knowledge Base — include everything except explicitly excluded statuses.
      // Uploaded/processing/ingested/reviewed/approved/needs_review all feed the model.
      const EXCLUDE = new Set(['archived', 'do_not_use', 'error']);
      const srcOk = ((srcRes.data ?? []) as Array<{ title: string; url: string | null; summary: string | null; content: string | null; status: string }>)
        .filter(s => !EXCLUDE.has(s.status));
      if (srcOk.length) {
        parts.push('## Project Knowledge Base (authoritative — consult FIRST before general knowledge)');
        for (const s of srcOk) {
          const head = s.url ? `${s.title} — ${s.url}` : s.title;
          const body = (s.content?.trim() || s.summary?.trim() || '').slice(0, 4000);
          parts.push(body ? `- ${head}\n  ${body}` : `- ${head} (file attached; reference by title)`);
        }
      }

      setContext(parts.join('\n\n').trim());
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [folderId]);

  return { context, loading };
}