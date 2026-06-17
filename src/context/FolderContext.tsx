import React, { createContext, useContext, ReactNode } from 'react';
import { useFolderState } from '@/hooks/supabase/useFolderState';
import { useFolderRealTime } from '@/hooks/supabase/useFolderRealTime';
import { useAuth } from '@/context/SupabaseAuthContext';
import { Folder } from '@/hooks/supabase/useFolderOperations';

interface FolderContextType {
  folders: Folder[];
  expandedFolders: Set<string>;
  isLoading: boolean;
  loadFolders: () => Promise<void>;
  toggleFolderExpanded: (folderId: string) => void;
  isFolderExpanded: (folderId: string) => boolean;
  addFolder: (folder: Folder) => void;
  updateFolder: (folderId: string, updates: Partial<Folder>) => void;
  removeFolder: (folderId: string) => void;
}

const FolderContext = createContext<FolderContextType | undefined>(undefined);

export const useFolders = () => {
  const context = useContext(FolderContext);
  if (context === undefined) {
    return { folders: [], loading: false, createFolder: async ()=>{}, updateFolder: async ()=>{}, deleteFolder: async ()=>{} };
  }
  return context;
};

interface FolderProviderProps {
  children: ReactNode;
}

export const FolderProvider: React.FC<FolderProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const folderState = useFolderState();

  // Real-time subscription
  useFolderRealTime({
    userId: user?.id || null,
    addFolder: folderState.addFolder,
    updateFolder: folderState.updateFolder,
    removeFolder: folderState.removeFolder,
    loadFolders: folderState.loadFolders
  });

  return (
    <FolderContext.Provider value={folderState}>
      {children}
    </FolderContext.Provider>
  );
};