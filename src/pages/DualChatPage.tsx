import React from 'react';
import { DualChatInterface } from '@/components/DualChatInterface';
import { SidebarProvider } from '@/hooks/useSidebarState';
import { SourceDrawerProvider } from '@/hooks/useSourceDrawer';
import { SourceComparisonProvider } from '@/hooks/useSourceComparison';
import AuthGuard from '@/components/auth/AuthGuard';

const DualChatPage: React.FC = () => {
  return (
    <AuthGuard>
      <SourceDrawerProvider>
        <SourceComparisonProvider>
          <SidebarProvider>
            <div className="min-h-screen bg-white">
              <DualChatInterface />
            </div>
          </SidebarProvider>
        </SourceComparisonProvider>
      </SourceDrawerProvider>
    </AuthGuard>
  );
};

export default DualChatPage;