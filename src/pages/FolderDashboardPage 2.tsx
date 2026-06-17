import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import FolderDashboard from '@/components/folders/FolderDashboard';

const FolderDashboardPage: React.FC = () => {
  const { folderId } = useParams<{ folderId: string }>();
  if (!folderId) return <Navigate to="/chat" replace />;
  return (
    <div className="h-screen overflow-hidden bg-[var(--chat-bg)]">
      <FolderDashboard folderId={folderId} />
    </div>
  );
};

export default FolderDashboardPage;
