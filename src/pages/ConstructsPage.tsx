import React from 'react';
import { SidebarProvider } from '@/hooks/useSidebarState';
import { SourceDrawerProvider } from '@/hooks/useSourceDrawer';
import { SourceComparisonProvider } from '@/hooks/useSourceComparison';
import ConstructsIndexContent from '@/components/ConstructsIndexContent';

const ConstructsPage = () => {
  return (
    <SourceDrawerProvider>
      <SourceComparisonProvider>
        <SidebarProvider>
          <ConstructsIndexContent />
        </SidebarProvider>
      </SourceComparisonProvider>
    </SourceDrawerProvider>
  );
};

export default ConstructsPage;