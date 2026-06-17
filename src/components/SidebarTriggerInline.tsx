
import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebarState } from '@/hooks/useSidebarState';

const SidebarTriggerInline = () => {
  const { isOpen, toggleSidebar } = useSidebarState();
  if (isOpen) return null; // hidden when sidebar open
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className="sm:hidden fixed top-4 left-4 z-50 bg-[var(--chat-card)] shadow-lg rounded-full text-[var(--chat-text-secondary)]"
      aria-label="Toggle sidebar"
    >
      <Menu size={20} />
    </Button>
  );
};

export default SidebarTriggerInline;
