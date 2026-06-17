import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, Search, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import AdminLayout from '@/components/admin/AdminLayout';
import BackToAdminButton from '@/components/admin/BackToAdminButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/context/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type SecurityAuditRow = {
  id: string;
  event_type: string;
  actor_user_id: string | null;
  target_user_id: string | null;
  target_resource: string | null;
  ip: string | null;
  country: string | null;
  user_agent: string | null;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  metadata: Record<string, unknown>;
  created_at: string;
};

type QueryResult = { data: SecurityAuditRow[] | null; error: { message: string } | null };
type AuditQuery = PromiseLike<QueryResult> & {
  eq: (column: string, value: string) => AuditQuery;
  gte: (column: string, value: string) => AuditQuery;
  lte: (column: string, value: string) => AuditQuery;
  ilike: (column: string, value: string) => AuditQuery;
  order: (column: string, options: { ascending: boolean }) => AuditQuery;
  limit: (count: number) => AuditQuery;
};

type AuditTable = {
  from: (table: string) => { select: (columns: string) => AuditQuery };
};

const auditDb = supabase as unknown as AuditTable;

const severityVariant = (severity: SecurityAuditRow['severity']) => {
  if (severity === 'critical' || severity === 'high') return 'destructive';
  if (severity === 'medium') return 'default';
  return 'secondary';
};

const toCsvCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const AdminAuditLogPage: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const initialParams = new URLSearchParams(window.location.search);
  const [eventType, setEventType] = useState(initialParams.get('event_type') || 'all');
  const [severity, setSeverity] = useState(initialParams.get('severity') || 'all');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  React.useEffect(() => {
    if (!loading && user && profile && profile.role !== 'superadmin' && profile.role !== 'admin') {
      toast({ title: 'Access denied', description: 'Admin access required.', variant: 'destructive' });
      navigate('/admin');
    } else if (!loading && !user) {
      navigate('/auth');
    }
  }, [loading, navigate, profile, toast, user]);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['security-audit-log', eventType, severity, search, fromDate, toDate],
    queryFn: async () => {
      let query = auditDb
        .from('security_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (eventType !== 'all') query = query.eq('event_type', eventType);
      if (severity !== 'all') query = query.eq('severity', severity);
      if (fromDate) query = query.gte('created_at', new Date(fromDate).toISOString());
      if (toDate) query = query.lte('created_at', new Date(`${toDate}T23:59:59`).toISOString());
      if (search.trim()) query = query.ilike('target_resource', `%${search.trim()}%`);

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    enabled: !!user && (profile?.role === 'superadmin' || profile?.role === 'admin'),
  });

  const KNOWN_EVENT_TYPES = [
    'login_success', 'login_failed', 'mfa_setup', 'mfa_disabled',
    'role_changed', 'user_created', 'user_suspended', 'user_deleted',
    'kb_source_added', 'kb_source_removed', 'kb_permission_changed',
    'chat_flagged', 'chat_flag_reviewed', 'security_setting_changed',
    'export_performed', 'password_reset',
    'domain_added', 'domain_removed',
    'access_rule_changed', 'access_blocked',
    'prompt_injection_attempt', 'dlp_detected',
    'file_upload_rejected', 'file_upload_blocked',
    'edge_function_error', 'notification_actioned',
  ];
  const eventTypes = useMemo(() => {
    const fromData = rows.map((row) => row.event_type);
    return Array.from(new Set([...KNOWN_EVENT_TYPES, ...fromData])).sort();
  }, [rows]);

  const exportCsv = () => {
    const headers = ['created_at', 'severity', 'event_type', 'actor_user_id', 'target_user_id', 'target_resource', 'ip', 'country', 'metadata'];
    const csv = [
      headers.join(','),
      ...rows.map((row) => headers.map((header) => {
        if (header === 'metadata') return toCsvCell(JSON.stringify(row.metadata ?? {}));
        return toCsvCell(row[header as keyof SecurityAuditRow]);
      }).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `security-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <AdminLayout><div className="p-8 text-muted-foreground">Loading...</div></AdminLayout>;
  }

  if (!user || !profile || (profile.role !== 'superadmin' && profile.role !== 'admin')) return null;

  return (
    <AdminLayout>
      <BackToAdminButton />
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/admin" className="hover:text-brand-blue">Admin Dashboard</Link>
          <span>/</span>
          <span className="text-brand-blue font-medium">Audit Log</span>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              Security Audit Log
            </h1>
            <p className="text-muted-foreground mt-2">Append-only security events across auth, admin, KB, exports, and policy changes.</p>
          </div>
          <Button onClick={exportCsv} disabled={rows.length === 0}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Search className="w-5 h-5" /> Filters</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Input placeholder="Search resource" value={search} onChange={(event) => setSearch(event.target.value)} />
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger><SelectValue placeholder="Event type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All events</SelectItem>
                {eventTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger><SelectValue placeholder="Severity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All severities</SelectItem>
                {['info', 'low', 'medium', 'high', 'critical'].map((level) => <SelectItem key={level} value={level}>{level}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Recent Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={8} className="text-muted-foreground">Loading audit events...</TableCell></TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-muted-foreground">No audit events match filters.</TableCell></TableRow>
                  ) : rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap">{formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}</TableCell>
                      <TableCell><Badge variant={severityVariant(row.severity)}>{row.severity}</Badge></TableCell>
                      <TableCell className="font-medium">{row.event_type}</TableCell>
                      <TableCell className="font-mono text-xs">{row.actor_user_id?.slice(0, 8) ?? 'system'}</TableCell>
                      <TableCell className="font-mono text-xs">{row.target_user_id?.slice(0, 8) ?? '-'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{(row.metadata as Record<string, unknown> | null)?.source_table as string ?? '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">{row.target_resource ?? '-'}</TableCell>
                      <TableCell>{row.ip ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminAuditLogPage;
