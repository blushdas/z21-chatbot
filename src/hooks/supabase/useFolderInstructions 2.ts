import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/SupabaseAuthContext';
import { toast } from 'sonner';

export interface FolderInstruction {
  id: string;
  folder_id: string;
  user_id: string;
  content: string;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

export function useFolderInstructions(folderId: string | null | undefined) {
  const { user } = useAuth();
  const [instruction, setInstruction] = useState<FolderInstruction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    if (!folderId || !user?.id) return;
    setIsLoading(true);
    const { data } = await supabase
      .from('folder_instructions')
      .select('*')
      .eq('folder_id', folderId)
      .single();
    setInstruction(data as unknown as FolderInstruction | null);
    setIsLoading(false);
  }, [folderId, user?.id]);

  useEffect(() => { load(); }, [load]);

  const save = async (content: string, is_locked?: boolean) => {
    if (!folderId || !user?.id) return false;
    setIsSaving(true);
    try {
      if (instruction) {
        const updates: Partial<FolderInstruction> = { content };
        if (is_locked !== undefined) updates.is_locked = is_locked;
        const { data, error } = await supabase
          .from('folder_instructions')
          .update(updates)
          .eq('id', instruction.id)
          .select()
          .single();
        if (error) throw error;
        setInstruction(data as unknown as FolderInstruction);
      } else {
        const { data, error } = await supabase
          .from('folder_instructions')
          .insert({ folder_id: folderId, user_id: user.id, content, is_locked: is_locked ?? false })
          .select()
          .single();
        if (error) throw error;
        setInstruction(data as unknown as FolderInstruction);
      }
      toast.success('Instructions saved');
      return true;
    } catch {
      toast.error('Failed to save instructions');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const toggleLock = async () => {
    if (!instruction) return;
    await save(instruction.content, !instruction.is_locked);
  };

  return { instruction, isLoading, isSaving, save, toggleLock, reload: load };
}
