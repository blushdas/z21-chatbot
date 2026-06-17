
import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebarState } from '@/hooks/useSidebarState';

const SidebarToggleButton = () => {
  const { toggleSidebar, isOpen } = useSidebarState();

  // Only show this button when sidebar is closed (as a fallback)
  if (isOpen) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className="fixed top-4 left-4 z-50 bg-[var(--chat-card)] shadow-lg rounded-full text-[var(--chat-text-secondary)] hover:text-[var(--chat-text)] dark:hover:text-[var(--chat-text)]"
      aria-label="Toggle sidebar"
    >
      <Menu size={20} />
    </Button>
  );
};

export default SidebarToggleButton;
