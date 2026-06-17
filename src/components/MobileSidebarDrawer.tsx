
import React from 'react';
import SavedChatsSidebar from './SavedChatsSidebar';
import { useSidebarState } from '@/hooks/useSidebarState';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileSidebarDrawerProps {
  onResumeChat: (chat: any) => void;
  onStartNewChat: () => void;
}

const MobileSidebarDrawer: React.FC<MobileSidebarDrawerProps> = ({ onResumeChat, onStartNewChat }) => {
  const { isOpen, closeSidebar } = useSidebarState();

  return (
    <>
      {/* Scrim */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 transition-opacity sm:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeSidebar}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        className={`fixed inset-y-0 left-0 z-[70] w-[86vw] max-w-[300px] bg-brand-blue sm:hidden transition-transform will-change-transform safe-top no-bounce ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* Close button for mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={closeSidebar}
          className="absolute top-4 right-4 z-10 text-brand-offwhite/80 hover:text-brand-offwhite hover:bg-brand-yellow/10"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </Button>
        
        <div className="h-full">
          <SavedChatsSidebar onResumeChat={onResumeChat} onStartNewChat={onStartNewChat} />
        </div>
      </div>
    </>
  );
};

export default MobileSidebarDrawer;
