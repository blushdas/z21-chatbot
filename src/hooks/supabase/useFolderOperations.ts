import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Folder {
  id: string;
  title: string;
  user_id: string;
  is_pinned?: boolean;
  color?: string | null;
  created_at: string;
  updated_at: string;
}

export const useFolderOperations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const createFolder = async (title: string): Promise<Folder | null> => {
    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please log in to create folders",
        variant: "destructive"
      });
      return null;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('folders')
        .insert({
          title: title.trim(),
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Folder created",
        description: `"${title}" folder has been created successfully`
      });

      return data;
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: "Error creating folder",
        description: "Failed to create folder. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateFolderTitle = async (folderId: string, newTitle: string): Promise<boolean> => {
    if (!user?.id) return false;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('folders')
        .update({ title: newTitle.trim() })
        .eq('id', folderId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Folder renamed",
        description: `Folder renamed to "${newTitle}"`
      });

      return true;
    } catch (error) {
      console.error('Error updating folder:', error);
      toast({
        title: "Error renaming folder",
        description: "Failed to rename folder. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFolder = async (folderId: string): Promise<boolean> => {
    if (!user?.id) return false;

    setIsLoading(true);
    try {
      // First, move all chats in this folder to no folder
      await supabase
        .from('chats')
        .update({ folder_id: null })
        .eq('folder_id', folderId)
        .eq('user_id', user.id);

      // Then delete the folder
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Folder deleted",
        description: "Folder has been deleted and chats moved to All Chats"
      });

      return true;
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast({
        title: "Error deleting folder",
        description: "Failed to delete folder. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const moveChatToFolder = async (chatId: string, folderId: string | null): Promise<boolean> => {
    if (!user?.id) return false;

    // Get current folder for revert on failure
    const currentChat = await supabase
      .from('chats')
      .select('folder_id')
      .eq('id', chatId)
      .eq('user_id', user.id)
      .single();

    const originalFolderId = currentChat.data?.folder_id || null;

    setIsLoading(true);
    try {
      // Immediate optimistic UI update
      window.dispatchEvent(new CustomEvent('chatFolderOptimistic', { 
        detail: { chatId, folderId } 
      }));

      const { error } = await supabase
        .from('chats')
        .update({ 
          folder_id: folderId,
          updated_at: new Date().toISOString()
        })
        .eq('id', chatId)
        .eq('user_id', user.id);

      if (error) throw error;

      const folderName = folderId ? "folder" : "All Chats";
      toast({
        title: "Chat moved",
        description: `Chat moved to ${folderName}`
      });

      return true;
    } catch (error) {
      console.error('Error moving chat:', error);
      
      // Revert optimistic update on error
      window.dispatchEvent(new CustomEvent('chatFolderRevert', { 
        detail: { chatId, originalFolderId } 
      }));
      
      toast({
        title: "Error moving chat",
        description: "Failed to move chat. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getFolders = async (): Promise<Folder[]> => {
    if (!user?.id) return [];

    try {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', user.id)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching folders:', error);
      return [];
    }
  };

  const updateFolderColor = async (folderId: string, color: string | null): Promise<boolean> => {
    if (!user?.id) return false;
    try {
      const { error } = await supabase
        .from('folders')
        .update({ color })
        .eq('id', folderId)
        .eq('user_id', user.id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating folder color:', error);
      toast({
        title: 'Error updating color',
        description: 'Failed to update folder color. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    createFolder,
    updateFolderTitle,
    deleteFolder,
    moveChatToFolder,
    getFolders,
    updateFolderColor,
    isLoading
  };
};