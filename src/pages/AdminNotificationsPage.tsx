import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, Bell, CheckCircle2, Inbox, Loader2, ShieldAlert } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import BackToAdminButton from '@/components/admin/BackToAdminButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { toastError } from '@/utils/toastError';

type AdminNotification = Database['public']['Tables']['admin_notifications']['Row'];
type AdminNotificationUpdate = Database['public']['Tables']['admin_notifications']['Update'];
type NotificationStatus = 'open' | 'acknowledged' | 'resolved' | 'dismissed';
type NotificationSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';
type NotificationTab = 'active' | 'resolved' | 'all';

type ProfileSummary = {
  id: string;
  email: string | null;
  name: string | null;
};

const SEVERITY_ORDER: Record<NotificationSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

const SEVERITY_COLORS: Record<NotificationSeverity, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300',
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
  info: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

const STATUS_LABELS: Record<NotificationStatus, string> = {
  open: 'Open',
  acknowledged: 'Acknowledged',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
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

const AdminNotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<NotificationTab>('active');
  const [selectedNotification, setSelectedNotification] = useState<AdminNotification | null>(null);
  const [nextStatus, setNextStatus] = useState<NotificationStatus>('acknowledged');
  const [notes, setNotes] = useState('');
  const [assignToMe, setAssignToMe] = useState(true);

  const { data: notifications = [], isLoading } = useQuery<AdminNotification[]>({
    queryKey: ['admin-notifications-page', activeTab],
    queryFn: async () => {
      let query = supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeTab === 'active') {
        query = query.in('status', ['open', 'acknowledged']);
      }

      if (activeTab === 'resolved') {
        query = query.in('status', ['resolved', 'dismissed']);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return sortNotifications((data ?? []) as AdminNotification[]);
    },
  });

  const { data: stats = { active: 0, critical: 0, assignedToMe: 0 } } = useQuery({
    queryKey: ['admin-notification-stats', user?.id],
    queryFn: async () => {
      const [activeRes, criticalRes, assignedRes] = await Promise.all([
        supabase.from('admin_notifications').select('*', { count: 'exact', head: true }).in('status', ['open', 'acknowledged']),
        supabase.from('admin_notifications').select('*', { count: 'exact', head: true }).eq('status', 'open').eq('severity', 'critical'),
        user?.id
          ? supabase.from('admin_notifications').select('*', { count: 'exact', head: true }).eq('assigned_to', user.id).in('status', ['open', 'acknowledged'])
          : Promise.resolve({ count: 0 }),
      ]);

      return {
        active: activeRes.count ?? 0,
        critical: criticalRes.count ?? 0,
        assignedToMe: assignedRes.count ?? 0,
      };
    },
  });

  const profileIds = useMemo(() => {
    const ids = notifications.flatMap((notification) => [notification.assigned_to, notification.acknowledged_by, notification.resolved_by]);
    return [...new Set(ids.filter((id): id is string => Boolean(id)))];
  }, [notifications]);

  const { data: profiles = {} } = useQuery<Record<string, ProfileSummary>>({
    queryKey: ['admin-notification-profiles', profileIds],
    enabled: profileIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name')
        .in('id', profileIds);
      if (error) throw error;
      return (data ?? []).reduce<Record<string, ProfileSummary>>((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {});
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes, shouldAssignToMe }: { id: string; status: NotificationStatus; adminNotes: string; shouldAssignToMe: boolean }) => {
      const now = new Date().toISOString();
      const payload: AdminNotificationUpdate = {
        status,
        notes: adminNotes || null,
        assigned_to: shouldAssignToMe ? user?.id ?? null : null,
      };

      if (status === 'acknowledged') {
        payload.acknowledged_by = user?.id ?? null;
        payload.acknowledged_at = now;
      }

      if (status === 'resolved' || status === 'dismissed') {
        payload.resolved_by = user?.id ?? null;
        payload.resolved_at = now;
      }

      const { error } = await supabase
        .from('admin_notifications')
        .update(payload)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notification-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      toast({ title: 'Alert updated', description: 'Notification status saved.' });
      setSelectedNotification(null);
    },
    onError: (error) => toastError(error, 'Error', 'Failed to update notification.'),
  });

  const openDialog = (notification: AdminNotification) => {
    setSelectedNotification(notification);
    setNextStatus(notification.status === 'open' ? 'acknowledged' : notification.status as NotificationStatus);
    setNotes(notification.notes ?? '');
    setAssignToMe(!notification.assigned_to || notification.assigned_to === user?.id);
  };

  const sourcePath = selectedNotification?.source_table === 'chat_safety_flags' ? '/admin/safety' : null;

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        <BackToAdminButton />
        <div className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 dark:bg-red-950/40 rounded-lg flex items-center justify-center">
            <Bell className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-3xl font-heading text-brand-blue dark:text-foreground">Admin Notifications</h1>
            <p className="text-muted-foreground mt-1">Central alert feed for safety and security events</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card><CardContent className="p-4 flex items-center gap-3"><Inbox className="w-5 h-5 text-blue-500" /><div><p className="text-2xl font-bold">{stats.active}</p><p className="text-xs text-muted-foreground">Active alerts</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><ShieldAlert className="w-5 h-5 text-red-500" /><div><p className="text-2xl font-bold">{stats.critical}</p><p className="text-xs text-muted-foreground">Open critical</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /><div><p className="text-2xl font-bold">{stats.assignedToMe}</p><p className="text-xs text-muted-foreground">Assigned to me</p></div></CardContent></Card>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as NotificationTab)}>
          <TabsList className="mb-4">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <Card>
              <CardHeader><CardTitle className="text-base">Notification Feed</CardTitle></CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground"><Bell className="w-10 h-10 opacity-30" /><p className="text-sm">No notifications</p></div>
                ) : (
                  <Table>
                    <TableHeader><TableRow><TableHead>Severity</TableHead><TableHead>Type</TableHead><TableHead>Alert</TableHead><TableHead>Owner</TableHead><TableHead>Status</TableHead><TableHead>Time</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {notifications.map((notification) => (
                        <TableRow key={notification.id}>
                          <TableCell><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_COLORS[notification.severity as NotificationSeverity]}`}>{notification.severity}</span></TableCell>
                          <TableCell className="text-sm">{TYPE_LABELS[notification.type] ?? notification.type}</TableCell>
                          <TableCell className="max-w-[360px]"><p className="text-sm font-medium truncate">{notification.title}</p><p className="text-xs text-muted-foreground truncate">{notification.message}</p></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{notification.assigned_to ? profiles[notification.assigned_to]?.name ?? profiles[notification.assigned_to]?.email ?? 'Assigned' : 'Unassigned'}</TableCell>
                          <TableCell><Badge variant="outline">{STATUS_LABELS[notification.status as NotificationStatus]}</Badge></TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</TableCell>
                          <TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => openDialog(notification)}>Review</Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" />Review Alert</DialogTitle></DialogHeader>
          {selectedNotification && (
            <div className="space-y-4">
              <div className="flex items-center gap-2"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_COLORS[selectedNotification.severity as NotificationSeverity]}`}>{selectedNotification.severity}</span><span className="text-sm text-muted-foreground">{TYPE_LABELS[selectedNotification.type] ?? selectedNotification.type}</span></div>
              <div><Label className="text-xs font-semibold uppercase text-muted-foreground">Alert</Label><div className="mt-1 rounded-lg bg-muted p-3"><p className="text-sm font-medium">{selectedNotification.title}</p><p className="text-sm text-muted-foreground mt-1">{selectedNotification.message}</p></div></div>
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Status</Label><Select value={nextStatus} onValueChange={(value) => setNextStatus(value as NotificationStatus)}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="open">Open</SelectItem><SelectItem value="acknowledged">Acknowledged</SelectItem><SelectItem value="resolved">Resolved</SelectItem><SelectItem value="dismissed">Dismissed</SelectItem></SelectContent></Select></div>
                <div><Label>Owner</Label><Select value={assignToMe ? 'me' : 'unassigned'} onValueChange={(value) => setAssignToMe(value === 'me')}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="me">Assign to me</SelectItem><SelectItem value="unassigned">Unassigned</SelectItem></SelectContent></Select></div>
              </div>
              <div><Label htmlFor="notification-notes">Internal Notes</Label><Textarea id="notification-notes" className="mt-1" rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Add context, owner notes, or resolution details..." /></div>
              {sourcePath && <Button variant="outline" asChild><Link to={sourcePath}>Open source record</Link></Button>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedNotification(null)}>Cancel</Button>
            <Button disabled={updateMutation.isPending} onClick={() => selectedNotification && updateMutation.mutate({ id: selectedNotification.id, status: nextStatus, adminNotes: notes, shouldAssignToMe: assignToMe })}>{updateMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminNotificationsPage;
