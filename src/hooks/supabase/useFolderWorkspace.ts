import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/SupabaseAuthContext';
import { toast } from 'sonner';

export interface FolderSource {
  id: string;
  folder_id: string;
  user_id: string;
  type: string;
  title: string;
  url: string | null;
  content: string | null;
  summary: string | null;
  tags: string[];
  last_indexed_at: string | null;
  status: string;
  visibility: string;
  created_at: string;
  updated_at: string;
  bucket_path?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  vector_count?: number | null;
  processing_error?: string | null;
}

export interface FolderMemoryItem {
  id: string;
  folder_id: string;
  user_id: string;
  category: string;
  content: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface FolderQuickLink {
  id: string;
  folder_id: string;
  user_id: string;
  title: string;
  url: string;
  icon: string | null;
  description: string | null;
  category: string | null;
  created_at: string;
}

export interface FolderKnowledgeItem {
  id: string;
  folder_id: string;
  chat_id: string | null;
  user_id: string;
  type: string;
  content: string;
  tags: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

export interface FolderMember {
  id: string;
  folder_id: string;
  user_id: string;
  role: string;
  invited_by: string;
  created_at: string;
}

export interface FolderDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  color: string | null;
  tags: string[];
  visibility: string;
  is_pinned: boolean;
  user_id: string;
  created_at: string | null;
  updated_at: string | null;
}

export function useFolderWorkspace(folderId: string) {
  const { user } = useAuth();
  const [folder, setFolder] = useState<FolderDetail | null>(null);
  const [sources, setSources] = useState<FolderSource[]>([]);
  const [memory, setMemory] = useState<FolderMemoryItem[]>([]);
  const [quickLinks, setQuickLinks] = useState<FolderQuickLink[]>([]);
  const [knowledge, setKnowledge] = useState<FolderKnowledgeItem[]>([]);
  const [members, setMembers] = useState<FolderMember[]>([]);
  const [recentChats, setRecentChats] = useState<{ id: string; title: string; updated_at: string; chat_category: string | null }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id || !folderId) return;
    setIsLoading(true);
    try {
      const [folderRes, sourcesRes, memoryRes, linksRes, knowledgeRes, membersRes, chatsRes] = await Promise.all([
        supabase.from('folders').select('*').eq('id', folderId).single(),
        supabase.from('folder_sources').select('*').eq('folder_id', folderId).order('created_at', { ascending: false }),
        supabase.from('folder_memory').select('*').eq('folder_id', folderId).order('created_at', { ascending: false }),
        supabase.from('folder_quick_links').select('*').eq('folder_id', folderId).order('created_at', { ascending: false }),
        supabase.from('folder_knowledge').select('*').eq('folder_id', folderId).order('created_at', { ascending: false }),
        supabase.from('folder_members').select('*').eq('folder_id', folderId),
        supabase.from('chats').select('id, title, updated_at, chat_category').eq('folder_id', folderId).order('updated_at', { ascending: false }).limit(10),
      ]);
      if (folderRes.data) setFolder(folderRes.data as unknown as FolderDetail);
      if (sourcesRes.data) setSources(sourcesRes.data as unknown as FolderSource[]);
      if (memoryRes.data) setMemory(memoryRes.data as unknown as FolderMemoryItem[]);
      if (linksRes.data) setQuickLinks(linksRes.data as unknown as FolderQuickLink[]);
      if (knowledgeRes.data) setKnowledge(knowledgeRes.data as unknown as FolderKnowledgeItem[]);
      if (membersRes.data) setMembers(membersRes.data as unknown as FolderMember[]);
      if (chatsRes.data) setRecentChats(chatsRes.data as unknown as { id: string; title: string; updated_at: string; chat_category: string | null }[]);
    } catch (err) {
      console.error('useFolderWorkspace load error', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, folderId]);

  useEffect(() => { load(); }, [load]);

  // --- folder meta ---
  const updateFolder = async (updates: Partial<Pick<FolderDetail, 'title' | 'description' | 'status' | 'color' | 'tags' | 'visibility'>>) => {
    const { error } = await supabase.from('folders').update(updates).eq('id', folderId);
    if (error) { toast.error('Failed to update project'); return false; }
    setFolder(prev => prev ? { ...prev, ...updates } : prev);
    return true;
  };

  // --- sources ---
  const addSource = async (data: Partial<FolderSource> & Pick<FolderSource, 'type' | 'title'>) => {
    if (!user?.id) return null;
    const { data: row, error } = await supabase.from('folder_sources').insert({ ...data, folder_id: folderId, user_id: user.id }).select().single();
    if (error) { toast.error(`Failed to add source: ${error.message}`); return null; }

    // FALLBACK: invoke process-folder-source directly in case the DB trigger
    // hasn't been deployed to Lovable's Supabase (net.http_post trigger may be missing).
    // Safe to call even if the trigger already handled it — function is idempotent (upsert).
    try {
      void supabase.functions.invoke('process-folder-source', {
        body: {
          source_id: row.id,
          folder_id: folderId,
          user_id: user.id,
          type: row.type,
          bucket_path: (row as any).bucket_path ?? data.bucket_path ?? null,
          url: row.url,
        },
      });
    } catch (e) {
      // Non-fatal: trigger likely handled it. Log and continue.
      console.warn('[useFolderWorkspace] direct ingestion invoke failed:', e);
    }

    setSources(prev => [row as unknown as FolderSource, ...prev]);
    return row;
  };
  const deleteSource = async (id: string) => {
    const { error } = await supabase.from('folder_sources').delete().eq('id', id);
    if (error) { toast.error('Failed to remove source'); return; }
    setSources(prev => prev.filter(s => s.id !== id));
  };
  const updateSourceStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('folder_sources').update({ status }).eq('id', id);
    if (error) { toast.error('Failed to update source status'); return; }
    setSources(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  // --- memory ---
  const addMemory = async (data: Pick<FolderMemoryItem, 'category' | 'content' | 'status'>) => {
    if (!user?.id) return null;
    const { data: row, error } = await supabase.from('folder_memory').insert({ ...data, folder_id: folderId, user_id: user.id }).select().single();
    if (error) { toast.error('Failed to add memory item'); return null; }
    setMemory(prev => [row as unknown as FolderMemoryItem, ...prev]);
    return row;
  };
  const updateMemory = async (id: string, content: string) => {
    const { error } = await supabase.from('folder_memory').update({ content }).eq('id', id);
    if (error) { toast.error('Failed to update memory'); return; }
    setMemory(prev => prev.map(m => m.id === id ? { ...m, content } : m));
  };
  const deleteMemory = async (id: string) => {
    const { error } = await supabase.from('folder_memory').delete().eq('id', id);
    if (error) { toast.error('Failed to delete memory item'); return; }
    setMemory(prev => prev.filter(m => m.id !== id));
  };
  const updateMemoryStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('folder_memory').update({ status }).eq('id', id);
    if (error) { toast.error('Failed to update memory status'); return; }
    setMemory(prev => prev.map(m => m.id === id ? { ...m, status } : m));
  };

  // --- quick links ---
  const addQuickLink = async (data: Pick<FolderQuickLink, 'title' | 'url' | 'icon' | 'description' | 'category'>) => {
    if (!user?.id) return null;
    const { data: row, error } = await supabase.from('folder_quick_links').insert({ ...data, folder_id: folderId, user_id: user.id }).select().single();
    if (error) { toast.error('Failed to add quick link'); return null; }
    setQuickLinks(prev => [row as unknown as FolderQuickLink, ...prev]);
    return row;
  };
  const deleteQuickLink = async (id: string) => {
    const { error } = await supabase.from('folder_quick_links').delete().eq('id', id);
    if (error) { toast.error('Failed to remove quick link'); return; }
    setQuickLinks(prev => prev.filter(l => l.id !== id));
  };
  const updateQuickLink = async (id: string, data: Partial<Pick<FolderQuickLink, 'title' | 'url' | 'icon' | 'description' | 'category'>>) => {
    const { data: row, error } = await supabase.from('folder_quick_links').update(data).eq('id', id).select().single();
    if (error) { toast.error('Failed to update quick link'); return null; }
    setQuickLinks(prev => prev.map(link => link.id === id ? row as unknown as FolderQuickLink : link));
    return row;
  };

  // --- knowledge ---
  const addKnowledge = async (data: Pick<FolderKnowledgeItem, 'type' | 'content' | 'tags' | 'status' | 'chat_id'>) => {
    if (!user?.id) return null;
    const { data: row, error } = await supabase.from('folder_knowledge').insert({ ...data, folder_id: folderId, user_id: user.id }).select().single();
    if (error) { toast.error('Failed to save knowledge item'); return null; }
    setKnowledge(prev => [row as unknown as FolderKnowledgeItem, ...prev]);
    toast.success('Saved to project knowledge');
    return row;
  };
  const deleteKnowledge = async (id: string) => {
    const { error } = await supabase.from('folder_knowledge').delete().eq('id', id);
    if (error) { toast.error('Failed to delete knowledge item'); return; }
    setKnowledge(prev => prev.filter(k => k.id !== id));
  };
  const updateKnowledgeStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('folder_knowledge').update({ status }).eq('id', id);
    if (error) return;
    setKnowledge(prev => prev.map(k => k.id === id ? { ...k, status } : k));
  };

  // --- members ---
  const addMember = async (userId: string, role: string) => {
    if (!user?.id) return null;
    const { data: row, error } = await supabase.from('folder_members').insert({ folder_id: folderId, user_id: userId, role, invited_by: user.id }).select().single();
    if (error) { toast.error('Failed to add member'); return null; }
    setMembers(prev => [...prev, row as unknown as FolderMember]);
    return row;
  };
  const updateMemberRole = async (id: string, role: string) => {
    const { error } = await supabase.from('folder_members').update({ role }).eq('id', id);
    if (error) { toast.error('Failed to update role'); return; }
    setMembers(prev => prev.map(m => m.id === id ? { ...m, role } : m));
  };
  const removeMember = async (id: string) => {
    const { error } = await supabase.from('folder_members').delete().eq('id', id);
    if (error) { toast.error('Failed to remove member'); return; }
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  return {
    folder, sources, memory, quickLinks, knowledge, members, recentChats, isLoading, reload: load,
    updateFolder,
    addSource, deleteSource, updateSourceStatus,
    addMemory, updateMemory, deleteMemory, updateMemoryStatus,
    addQuickLink, updateQuickLink, deleteQuickLink,
    addKnowledge, deleteKnowledge, updateKnowledgeStatus,
    addMember, updateMemberRole, removeMember,
  };
}
