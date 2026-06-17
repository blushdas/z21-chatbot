import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import AdminQuickActions from './AdminQuickActions';
import CriticalServiceAlert from './CriticalServiceAlert';
import DemoBrandBanner from './DemoBrandBanner';
import { useAuth } from '@/context/SupabaseAuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === 'superadmin';

  // Fetch counts for sidebar badges
  const { data: counts = { users: 0, chats: 0, feedback: 0, notifications: 0 } } = useQuery({
    queryKey: ['admin-sidebar-counts'],
    queryFn: async () => {
      if (!isSuperAdmin) {
        return { users: 0, chats: 0, feedback: 0, notifications: 0 };
      }

      const [usersRes, chatsRes, feedbackRes, notificationsRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('chats').select('*', { count: 'exact', head: true }),
        supabase.from('feedback_logs').select('*', { count: 'exact', head: true }),
        supabase.from('admin_notifications').select('*', { count: 'exact', head: true }).in('status', ['open', 'acknowledged']),
      ]);

      return {
        users: usersRes.count || 0,
        chats: chatsRes.count || 0,
        feedback: feedbackRes.count || 0,
        notifications: notificationsRes.count || 0,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: isSuperAdmin,
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Critical service alert banner — renders above everything for superadmins */}
      <CriticalServiceAlert />

      {/* White-label demo brand banner — superadmin session only */}
      <DemoBrandBanner />

      {/* Header */}
      <AdminHeader onMenuClick={() => setSidebarOpen(true)} />

      {/* Sidebar */}
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        counts={counts}
      />

      {/* Main content */}
      <main className="min-h-[calc(100vh-4rem)]">
        {children}
      </main>

      {/* Quick Actions FAB */}
      <AdminQuickActions />
    </div>
  );
};

export default AdminLayout;
