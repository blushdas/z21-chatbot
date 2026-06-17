import { useState, useEffect } from 'react';
import { Folder, useFolderOperations } from './useFolderOperations';
import { useAuth } from '@/context/SupabaseAuthContext';

export const useFolderState = () => {
  const { user } = useAuth();
  const { getFolders } = useFolderOperations();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Load expanded folders from localStorage
  useEffect(() => {
    const savedExpanded = localStorage.getItem('expandedFolders');
    if (savedExpanded) {
      try {
        const parsed = JSON.parse(savedExpanded);
        setExpandedFolders(new Set(parsed));
      } catch (error) {
        console.error('Error loading expanded folders from localStorage:', error);
      }
    }
  }, []);

  // Save expanded folders to localStorage
  useEffect(() => {
    localStorage.setItem('expandedFolders', JSON.stringify(Array.from(expandedFolders)));
  }, [expandedFolders]);

  // Load folders from Supabase
  const loadFolders = async () => {
    if (!user?.id) {
      setFolders([]);
      return;
    }

    setIsLoading(true);
    try {
      const folderData = await getFolders();
      setFolders(folderData);
    } catch (error) {
      console.error('Error loading folders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load folders when user changes
  useEffect(() => {
    loadFolders();
  }, [user?.id]);

  const toggleFolderExpanded = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const isFolderExpanded = (folderId: string) => {
    return expandedFolders.has(folderId);
  };

  const addFolder = (folder: Folder) => {
    setFolders(prev => {
      const exists = prev.some(f => f.id === folder.id);
      if (exists) {
        // Merge updates if folder already exists (prevents duplicates from realtime + optimistic)
        return prev.map(f => (f.id === folder.id ? { ...f, ...folder } : f));
      }
      return [folder, ...prev];
    });
  };

  const updateFolder = (folderId: string, updates: Partial<Folder>) => {
    setFolders(prev => prev.map(folder => 
      folder.id === folderId ? { ...folder, ...updates } : folder
    ));
  };

  const removeFolder = (folderId: string) => {
    setFolders(prev => prev.filter(folder => folder.id !== folderId));
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      newSet.delete(folderId);
      return newSet;
    });
  };

  return {
    folders,
    setFolders,
    expandedFolders,
    isLoading,
    loadFolders,
    toggleFolderExpanded,
    isFolderExpanded,
    addFolder,
    updateFolder,
    removeFolder
  };
};