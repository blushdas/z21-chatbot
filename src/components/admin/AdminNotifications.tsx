import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCheck, ShieldAlert, UserPlus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/context/SupabaseAuthContext';
import { toastError } from '@/utils/toastError';

type AdminNotification = Database['public']['Tables']['admin_notifications']['Row'];
type NotificationSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

type RealtimeNotification = {
  new: AdminNotification;
};

const SEVERITY_ORDER: Record<NotificationSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

const TYPE_LABELS: Record<string, string> = {
  chat_safety_flag: 'Chat Safety Flag',
  suspicious_login: 'Suspicious Login',
  failed_login: 'Failed Login',
  new_device: 'New Device',
  blocked_location: 'Blocked Location',
  file_upload_blocked: 'File Upload Blocked',
  kb_permission_change: 'KB Permission Change',
  new_admin: 'New Admin',
  restricted_access_request: 'Restricted Access',
  system: 'System',
};

const sortNotifications = (items: AdminNotification[]) =>
  [...items].sort((a, b) => {
    const severityDiff = SEVERITY_ORDER[a.severity as NotificationSeverity] - SEVERITY_ORDER[b.severity as NotificationSeverity];
    if (severityDiff !== 0) return severityDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

const getIcon = (notification: AdminNotification) => {
  if (notification.type === 'new_admin') {
    return <UserPlus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
  }

  if (notification.severity === 'critical' || notification.severity === 'high') {
    return <ShieldAlert className="h-4 w-4 text-destructive" />;
  }

  return <AlertTriangle className="h-4 w-4 text-orange-500" />;
};

const AdminNotifications: React.FC = () => {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const isSuperAdmin = profile?.role === 'superadmin';

  const { data: notifications = [], isError } = useQuery<AdminNotification[]>({
    queryKey: ['admin-notifications'],
    enabled: isSuperAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .in('status', ['open', 'acknowledged'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return sortNotifications((data ?? []) as AdminNotification[]);
    },
  });

  useEffect(() => {
    if (!isSuperAdmin) return;

    const channel = supabase
      .channel('admin-notifications')
      .on(
        // @ts-expect-error - supabase-js realtime types are loose for postgres_changes
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admin_notifications' },
        (payload: RealtimeNotification) => {
          queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
          queryClient.invalidateQueries({ queryKey: ['admin-sidebar-counts'] });

          if (payload.new?.severity === 'critical') {
            queryClient.invalidateQueries({ queryKey: ['admin-notification-stats'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isSuperAdmin, queryClient]);

  const acknowledgeAllMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('admin_notifications')
        .update({
          status: 'acknowledged',
          acknowledged_by: user?.id ?? null,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('status', 'open');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-sidebar-counts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notification-stats'] });
    },
    onError: (error) => toastError(error, 'Error', 'Failed to acknowledge notifications.'),
  });

  const unreadCount = notifications.filter((notification) => notification.status === 'open').length;

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-muted relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-destructive rounded-full text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground" onClick={() => acknowledgeAllMutation.mutate()} disabled={acknowledgeAllMutation.isPending}>
              <CheckCheck className="h-3 w-3 mr-1" />
              Acknowledge all
            </Button>
          )}
        </div>

        <ScrollArea className="h-[300px]">
          {isError ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground px-4 text-center">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Notification table pending migration</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <Link
                  key={notification.id}
                  to="/admin/notifications"
                  onClick={() => setOpen(false)}
                  className={`flex gap-3 px-4 py-3 transition-colors hover:bg-muted/60 ${
                    notification.status === 'open' ? 'bg-accent/5' : 'bg-transparent'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">{getIcon(notification)}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${notification.status === 'open' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {TYPE_LABELS[notification.type] ?? notification.type} · {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {notification.status === 'open' && <div className="flex-shrink-0 w-2 h-2 rounded-full bg-accent mt-2" />}
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>

        <Separator />
        <div className="p-2">
          <Button asChild variant="ghost" className="w-full justify-center text-sm" onClick={() => setOpen(false)}>
            <Link to="/admin/notifications">View notification center</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AdminNotifications;
