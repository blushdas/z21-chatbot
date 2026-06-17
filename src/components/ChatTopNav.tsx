import React from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useSidebarState } from '@/hooks/useSidebarState';
import MobileOverflowMenu from './MobileOverflowMenu';

const ChatTopNav: React.FC = () => {
  const { user } = useAuth();
  const { openSidebar, isOpen: sidebarOpen } = useSidebarState();

  return (
    <div className="sticky top-0 z-40 border-b safe-top pointer-events-none">
      <div className="flex justify-between items-center px-4 sm:px-6 py-2 sm:py-3 pointer-events-auto">
        <div className="flex items-center gap-3">
          {/* Hamburger menu - shows on mobile always, desktop when sidebar closed */}
          {user && (
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-[var(--ui-bg-hover)] transition-colors sm:hidden"
              onClick={openSidebar}
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>
          )}
          {/* Desktop trigger when sidebar is hidden */}
          {user && !sidebarOpen && (
            <button
              className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-[var(--ui-bg-hover)] transition-colors"
              onClick={openSidebar}
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>
          )}
        </div>

        {/* Mobile overflow menu - keeps mobile functionality */}
        <div className="sm:hidden">
          <MobileOverflowMenu />
        </div>
      </div>
    </div>
  );
};

export default ChatTopNav;
