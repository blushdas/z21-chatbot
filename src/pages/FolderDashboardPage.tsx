import React, { useEffect, useRef } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import ProjectWorkspace from '@/components/folders/ProjectWorkspace';
import SavedChatsSidebar from '@/components/SavedChatsSidebar';
import MobileSidebarDrawer from '@/components/MobileSidebarDrawer';
import { useSidebarState } from '@/hooks/useSidebarState';
import { useAuth } from '@/context/SupabaseAuthContext';
const FolderDashboardShell: React.FC<{ folderId: string }> = ({ folderId }) => {
  const { isOpen, openSidebar, closeSidebar } = useSidebarState();
  const { user } = useAuth();
  const noop = () => {};

  // Per-folder sidebar persistence: restore on folder switch, save on change.
  const storageKey = `daryle_sidebarOpen_folder_${folderId}`;
  const hydrated = useRef(false);

  useEffect(() => {
    hydrated.current = false;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        const want = JSON.parse(saved) as boolean;
        if (want) openSidebar(); else closeSidebar();
      }
    } catch {}
    hydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId]);

  useEffect(() => {
    if (!hydrated.current) return;
    try { localStorage.setItem(storageKey, JSON.stringify(isOpen)); } catch {}
  }, [isOpen, storageKey]);

  return (
    <div className="relative flex h-screen-safe no-bounce w-full bg-[var(--chat-bg)]">
      <MobileSidebarDrawer onResumeChat={noop} onStartNewChat={noop} />
      <div
        className={`hidden sm:block h-full overflow-hidden ${
          user ? (isOpen ? 'w-[288px] shrink-0' : 'w-0 shrink') : 'w-[288px] shrink-0'
        }`}
        aria-hidden={user ? !isOpen : false}
      >
        <SavedChatsSidebar onResumeChat={noop} onStartNewChat={noop} />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <ProjectWorkspace folderId={folderId} />
      </div>
    </div>
  );
};

const FolderDashboardPage: React.FC = () => {
  const { folderId } = useParams<{ folderId: string }>();
  if (!folderId) return <Navigate to="/chat" replace />;
  return <FolderDashboardShell folderId={folderId} />;
};

export default FolderDashboardPage;
