import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/SupabaseAuthContext';

export interface FolderStat {
  chatCount: number;
  lastChatAt: string | null;
}

export function useFolderStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Record<string, FolderStat>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('chats')
        .select('folder_id, updated_at')
        .eq('user_id', user.id)
        .not('folder_id', 'is', null);
      if (cancelled) return;
      if (error) {
        console.error('useFolderStats error', error);
        setIsLoading(false);
        return;
      }
      const map: Record<string, FolderStat> = {};
      for (const row of data ?? []) {
        const fid = (row as { folder_id: string | null }).folder_id;
        const upd = (row as { updated_at: string | null }).updated_at;
        if (!fid) continue;
        const existing = map[fid];
        if (!existing) {
          map[fid] = { chatCount: 1, lastChatAt: upd };
        } else {
          existing.chatCount += 1;
          if (upd && (!existing.lastChatAt || upd > existing.lastChatAt)) existing.lastChatAt = upd;
        }
      }
      setStats(map);
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  return { stats, isLoading };
}