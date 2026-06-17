import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ConstructInterface from './ConstructInterface';
import ConstructsSidebar from './ConstructsSidebar';
import ConstructsGridOverview from './ConstructsGridOverview';
import ChatTopNav from './ChatTopNav';
import { SourceDrawerProvider } from '@/hooks/useSourceDrawer';
import { SourceComparisonProvider } from '@/hooks/useSourceComparison';
import { useSidebarState } from '@/hooks/useSidebarState';
import { useAuth } from '@/context/SupabaseAuthContext';
import MobileConstructsDrawer from './MobileConstructsDrawer';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

const ConstructsIndexContent = () => {
  const { isOpen } = useSidebarState();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [selectedConstructSlug, setSelectedConstructSlug] = useState<string | null>(null);
  
  const { user } = useAuth();

  // Update selectedConstructSlug when URL changes
  useEffect(() => {
    if (slug) {
      setSelectedConstructSlug(slug);
    } else {
      setSelectedConstructSlug(null);
    }
  }, [slug]);

  const handleSelectConstruct = (construct: any) => {
    setSelectedConstructSlug(construct.slug);
    navigate(`/constructs/${construct.slug}`);
  };

  const handleNewConstruct = () => {
    setSelectedConstructSlug(null);
    navigate('/constructs/new');
  };

  return (
    <SourceDrawerProvider>
      <SourceComparisonProvider>
        <div className="flex h-screen w-full bg-gray-50 dark:bg-background">
          
          {/* Desktop Sidebar */}
          <div className="hidden sm:block">
            <SidebarProvider>
              <ConstructsSidebar 
                onSelectConstruct={handleSelectConstruct}
                onNewConstruct={handleNewConstruct}
              />
            </SidebarProvider>
          </div>
          
          {/* Mobile Drawer */}
          <MobileConstructsDrawer
            onSelectConstruct={handleSelectConstruct}
            onNewConstruct={handleNewConstruct}
          />
          
          {/* Main content */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <ChatTopNav />

            <div className="flex-1 overflow-hidden">
              {selectedConstructSlug ? (
                <ConstructInterface 
                  selectedConstructSlug={selectedConstructSlug}
                  onStartNewConstruct={handleNewConstruct}
                  key={selectedConstructSlug} // Force re-render when construct changes
                />
              ) : (
                <ConstructsGridOverview />
              )}
            </div>
          </div>
        </div>
      </SourceComparisonProvider>
    </SourceDrawerProvider>
  );
};

export default ConstructsIndexContent;