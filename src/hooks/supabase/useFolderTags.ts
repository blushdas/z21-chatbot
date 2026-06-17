import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/SupabaseAuthContext';
import { toast } from 'sonner';

export interface ProjectTag {
  id: string;
  name: string;
  color: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface FolderTagLink {
  folder_id: string;
  tag_id: string;
}

export function useFolderTags() {
  const { user } = useAuth();
  const [tags, setTags] = useState<ProjectTag[]>([]);
  const [links, setLinks] = useState<FolderTagLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const [{ data: tagRows, error: tagErr }, { data: linkRows, error: linkErr }] = await Promise.all([
        supabase.from('project_tags').select('*').eq('user_id', user.id).order('name'),
        supabase.from('folder_tags').select('folder_id,tag_id').eq('user_id', user.id),
      ]);
      if (tagErr) throw tagErr;
      if (linkErr) throw linkErr;
      setTags((tagRows ?? []) as ProjectTag[]);
      setLinks((linkRows ?? []) as FolderTagLink[]);
    } catch (e) {
      console.error('useFolderTags load error', e);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { void load(); }, [load]);

  const createTag = useCallback(async (name: string, color?: string | null) => {
    if (!user?.id) return null;
    const trimmed = name.trim();
    if (!trimmed) return null;
    const { data, error } = await supabase
      .from('project_tags')
      .insert({ user_id: user.id, name: trimmed, color: color ?? null })
      .select()
      .single();
    if (error) {
      toast.error(error.message.includes('duplicate') ? 'Tag already exists' : 'Failed to create tag');
      return null;
    }
    setTags(prev => [...prev, data as ProjectTag].sort((a, b) => a.name.localeCompare(b.name)));
    return data as ProjectTag;
  }, [user?.id]);

  const renameTag = useCallback(async (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const prev = tags;
    setTags(p => p.map(t => t.id === id ? { ...t, name: trimmed } : t));
    const { error } = await supabase.from('project_tags').update({ name: trimmed }).eq('id', id);
    if (error) {
      setTags(prev);
      toast.error('Failed to rename tag');
      return false;
    }
    return true;
  }, [tags]);

  const updateTagColor = useCallback(async (id: string, color: string | null) => {
    const prev = tags;
    setTags(p => p.map(t => t.id === id ? { ...t, color } : t));
    const { error } = await supabase.from('project_tags').update({ color }).eq('id', id);
    if (error) { setTags(prev); toast.error('Failed to update color'); return false; }
    return true;
  }, [tags]);

  const deleteTag = useCallback(async (id: string) => {
    const prevTags = tags;
    const prevLinks = links;
    setTags(p => p.filter(t => t.id !== id));
    setLinks(p => p.filter(l => l.tag_id !== id));
    const { error } = await supabase.from('project_tags').delete().eq('id', id);
    if (error) { setTags(prevTags); setLinks(prevLinks); toast.error('Failed to delete tag'); return false; }
    return true;
  }, [tags, links]);

  const assignTag = useCallback(async (folderId: string, tagId: string) => {
    if (!user?.id) return false;
    if (links.some(l => l.folder_id === folderId && l.tag_id === tagId)) return true;
    setLinks(p => [...p, { folder_id: folderId, tag_id: tagId }]);
    const { error } = await supabase.from('folder_tags').insert({ folder_id: folderId, tag_id: tagId, user_id: user.id });
    if (error) {
      setLinks(p => p.filter(l => !(l.folder_id === folderId && l.tag_id === tagId)));
      toast.error('Failed to assign tag');
      return false;
    }
    return true;
  }, [user?.id, links]);

  const unassignTag = useCallback(async (folderId: string, tagId: string) => {
    const prev = links;
    setLinks(p => p.filter(l => !(l.folder_id === folderId && l.tag_id === tagId)));
    const { error } = await supabase.from('folder_tags').delete().eq('folder_id', folderId).eq('tag_id', tagId);
    if (error) { setLinks(prev); toast.error('Failed to remove tag'); return false; }
    return true;
  }, [links]);

  const getTagsForFolder = useCallback((folderId: string): ProjectTag[] => {
    const tagIds = new Set(links.filter(l => l.folder_id === folderId).map(l => l.tag_id));
    return tags.filter(t => tagIds.has(t.id));
  }, [tags, links]);

  return {
    tags,
    links,
    isLoading,
    reload: load,
    createTag,
    renameTag,
    updateTagColor,
    deleteTag,
    assignTag,
    unassignTag,
    getTagsForFolder,
  };
}