import React from 'react';
import ChatShell from '@/components/ChatShell';

export default function Index() {
  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-black">
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatShell />
      </div>
    </div>
  );
}
