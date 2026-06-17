import React from 'react';
import { Outlet } from 'react-router-dom';
import AuthGuard from '@/components/auth/AuthGuard';

const AppLayout: React.FC = () => {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[var(--chat-card)]">
        <Outlet />
      </div>
    </AuthGuard>
  );
};

export default AppLayout;
