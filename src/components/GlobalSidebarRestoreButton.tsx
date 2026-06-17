import React from 'react';
import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useSidebarState } from '@/hooks/useSidebarState';
import { useAuth } from '@/context/SupabaseAuthContext';

// Routes where the left sidebar concept doesn't apply.
const HIDDEN_PREFIXES = [
  '/auth', '/login', '/signup', '/sign-up', '/confirm',
  '/onboarding', '/reset-password', '/verify',
];

const GlobalSidebarRestoreButton: React.FC = () => {
  const { isOpen, openSidebar } = useSidebarState();
  const { user } = useAuth();
  const { pathname } = useLocation();

  if (!user || isOpen) return null;
  if (HIDDEN_PREFIXES.some(p => pathname.startsWith(p))) return null;

  return (
    <button
      type="button"
      onClick={openSidebar}
      aria-label="Open sidebar (Ctrl/Cmd+B)"
      title="Open sidebar (Ctrl/Cmd+B)"
      className="fixed top-3 left-3 z-[80] inline-flex h-9 w-9 items-center justify-center rounded-md bg-[var(--chat-card)] text-[var(--chat-text)] shadow-md hover:bg-[var(--ui-bg-hover)] transition-colors"
    >
      <Menu size={18} />
    </button>
  );
};

export default GlobalSidebarRestoreButton;
