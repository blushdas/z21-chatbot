import React from 'react';
import ChatInterface from '@/components/ChatInterface';
import VerificationPanel from './VerificationPanel';
import { VerificationProvider } from '@/context/VerificationContext';

interface VerificationLayoutProps {
  enabled: boolean;
}

const VerificationLayout: React.FC<VerificationLayoutProps> = ({ enabled }) => {
  return (
    <VerificationProvider>
      <div className="h-[calc(100vh-8rem)] flex">
        {/* Main chat — always in the same tree position */}
        <div
          className="min-w-0 h-full overflow-hidden transition-all duration-300"
          style={{ flex: enabled ? '0 0 66%' : '1 1 100%' }}
        >
          <ChatInterface />
        </div>

        {/* Verification panel — slides in/out */}
        <div
          className="h-full overflow-hidden transition-all duration-300 border-l border-border"
          style={{
            flex: enabled ? '0 0 34%' : '0 0 0%',
            opacity: enabled ? 1 : 0,
            borderLeftWidth: enabled ? 1 : 0,
          }}
        >
          {enabled && <VerificationPanel />}
        </div>
      </div>
    </VerificationProvider>
  );
};

export default VerificationLayout;
