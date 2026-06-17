import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Bell, Lock, ShieldAlert, Upload, UserCog, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MetricSparkline from '@/components/admin/MetricSparkline';
import { supabase } from '@/integrations/supabase/client';

type AuditRow = { event_type: string; severity: string; created_at: string; metadata?: Record<string, unknown> | null };
type NotificationRow = { severity: string; status: string };
type TableQuery<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null; count?: number | null }> & {
  select: (columns: string, options?: Record<string, unknown>) => TableQuery<T>;
  eq: (column: string, value: string) => TableQuery<T>;
  in: (column: string, values: string[]) => TableQuery<T>;
  gte: (column: string, value: string) => TableQuery<T>;
  order: (column: string, options: { ascending: boolean }) => TableQuery<T>;
  limit: (count: number) => TableQuery<T>;
};

type Db = { from: <T>(table: string) => TableQuery<T> };
const db = supabase as unknown as Db;

const since = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
const last30Days = () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

function sparkline(rows: AuditRow[], hours = 24) {
  const buckets = Array.from({ length: 7 }, () => 0);
  const windowMs = hours * 60 * 60 * 1000;
  const bucketMs = windowMs / buckets.length;
  const start = Date.now() - windowMs;
  rows.forEach((row) => {
    const idx = Math.min(6, Math.max(0, Math.floor((new Date(row.created_at).getTime() - start) / bucketMs)));
    buckets[idx] += 1;
  });
  return buckets;
}

const MetricCard = ({ title, value, href, icon: Icon, tone, children }: {
  title: string;
  value: string | number;
  href: string;
  icon: React.ElementType;
  tone: string;
  children?: React.ReactNode;
}) => (
  <Link to={href} className="block focus:outline-none focus:ring-2 focus:ring-ring rounded-lg">
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${tone}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="mt-2 min-h-8">{children}</div>
      </CardContent>
    </Card>
  </Link>
);

const SecurityMetricsCards: React.FC = () => {
  const { data } = useQuery({
    queryKey: ['security-metrics-cards'],
    queryFn: async () => {
      const [audit, notifications, mfaEnabled, profiles] = await Promise.all([
        db.from<AuditRow>('security_audit_log').select('event_type,severity,created_at,metadata').gte('created_at', last30Days()).order('created_at', { ascending: false }).limit(500),
        db.from<NotificationRow>('admin_notifications').select('severity,status').eq('status', 'open').limit(500),
        db.from<{ user_id: string }>('two_factor_settings').select('user_id').eq('enabled', 'true').limit(1000),
        db.from<{ id: string }>('profiles').select('id').limit(1000),
      ]);

      if (audit.error) throw new Error(audit.error.message);
      const rows = audit.data ?? [];
      const failed24 = rows.filter((row) => row.event_type === 'login_failed' && row.created_at >= since(24));
      const suspicious7 = rows.filter((row) => ['login_failed', 'prompt_injection_attempt', 'dlp_detected'].includes(row.event_type) && row.created_at >= since(24 * 7));
      const permissionChanges = rows.filter((row) => row.event_type === 'role_changed');
      const kbUploads = rows.filter((row) => row.event_type === 'kb_source_added');
      const newAdmins = permissionChanges.filter((row) => {
        const nextRole = String(row.metadata?.new_role ?? '');
        return ['admin', 'superadmin'].includes(nextRole) && row.created_at >= last30Days();
      });
      const enabledMfa = new Set((mfaEnabled.data ?? []).map((row) => row.user_id));
      const usersWithoutMfa = Math.max(0, (profiles.data ?? []).filter((row) => !enabledMfa.has(row.id)).length);

      return {
        failed24,
        suspicious7,
        openNotifications: notifications.data ?? [],
        usersWithoutMfa,
        permissionChanges,
        kbUploads,
        newAdmins,
      };
    },
  });

  const metrics = data ?? { failed24: [], suspicious7: [], openNotifications: [], usersWithoutMfa: 0, permissionChanges: [], kbUploads: [], newAdmins: [] };
  const criticalOpen = metrics.openNotifications.filter((row) => row.severity === 'critical').length;
  const highOpen = metrics.openNotifications.filter((row) => row.severity === 'high').length;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
      <MetricCard title="Failed logins · 24h" value={metrics.failed24.length} href="/admin/audit-log?event_type=login_failed" icon={ShieldAlert} tone="text-red-500">
        <MetricSparkline data={sparkline(metrics.failed24, 24)} color="#ef4444" />
      </MetricCard>
      <MetricCard title="Suspicious events · 7d" value={metrics.suspicious7.length} href="/admin/audit-log?severity=high" icon={AlertTriangle} tone="text-amber-500">
        <MetricSparkline data={sparkline(metrics.suspicious7, 24 * 7)} color="#f59e0b" />
      </MetricCard>
      <MetricCard title="Open admin notifications" value={metrics.openNotifications.length} href="/admin/notifications" icon={Bell} tone="text-blue-500">
        <div className="flex gap-2"><Badge variant="destructive">{criticalOpen} critical</Badge><Badge>{highOpen} high</Badge></div>
      </MetricCard>
      <MetricCard title="Users without MFA" value={metrics.usersWithoutMfa} href="/admin/users" icon={Lock} tone="text-purple-500">
        <p className="text-xs text-muted-foreground">Approx. from profiles vs enabled 2FA settings</p>
      </MetricCard>
      <MetricCard title="Permission changes" value={metrics.permissionChanges.length} href="/admin/audit-log?event_type=role_changed" icon={UserCog} tone="text-orange-500" />
      <MetricCard title="Recent KB uploads" value={metrics.kbUploads.length} href="/admin/audit-log?event_type=kb_source_added" icon={Upload} tone="text-green-500" />
      <MetricCard title="New admin accounts · 30d" value={metrics.newAdmins.length} href="/admin/audit-log?event_type=role_changed" icon={Users} tone="text-indigo-500" />
    </div>
  );
};

export default SecurityMetricsCards;
