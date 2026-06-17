import React from 'react';
import ConstructsSidebar from './ConstructsSidebar';
import { useSidebarState } from '@/hooks/useSidebarState';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarProvider } from '@/components/ui/sidebar';

interface MobileConstructsDrawerProps {
  onSelectConstruct: (construct: any) => void;
  onNewConstruct: () => void;
}

const MobileConstructsDrawer: React.FC<MobileConstructsDrawerProps> = ({ 
  onSelectConstruct, 
  onNewConstruct 
}) => {
  const { isOpen, closeSidebar } = useSidebarState();

  const handleSelectConstruct = (construct: any) => {
    onSelectConstruct(construct);
    closeSidebar(); // Close drawer when selecting a construct on mobile
  };

  const handleNewConstruct = () => {
    onNewConstruct();
    closeSidebar(); // Close drawer when starting new construct on mobile
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity sm:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeSidebar}
        aria-hidden="true"
      />
      
      {/* Drawer Panel */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[90vw] max-w-[320px] sm:hidden transition-transform will-change-transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* Close button */}
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={closeSidebar}
            className="bg-brand-yellow/90 hover:bg-brand-yellow text-brand-blue rounded-full shadow-md"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Sidebar Content */}
        <div className="h-full">
          <SidebarProvider>
            <ConstructsSidebar 
              onSelectConstruct={handleSelectConstruct}
              onNewConstruct={handleNewConstruct}
            />
          </SidebarProvider>
        </div>
      </div>
    </>
  );
};

export default MobileConstructsDrawer;