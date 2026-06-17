import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Shield, KeyRound, Globe, History, Loader2, LogOut, AlertTriangle, Clock,
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  userId: string;
  userName?: string;
  onForceLogout?: () => void;
  isForcingLogout?: boolean;
}

type SecurityData = {
  lastSignInAt: string | null;
  createdAt: string | null;
  emailConfirmedAt: string | null;
  signInCount30d: number;
  lastIp: string | null;
  lastUserAgent: string | null;
  mfa: {
    enabled: boolean;
    factors: Array<{ id: string; type: string; status: string; created_at: string; friendly_name?: string }>;
  };
  loginLog: Array<{ id: string; created_at: string; action: string; ip_address: string | null; user_agent: string | null }>;
};

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const UserSecurityTab: React.FC<Props> = ({ userId, userName, onForceLogout, isForcingLogout }) => {
  const qc = useQueryClient();
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const { data, isLoading, error } = useQuery<SecurityData>({
    queryKey: ['admin-user-security', userId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-user-security', {
        body: { userId, action: 'fetch' },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as SecurityData;
    },
  });

  const { data: auditRows } = useQuery({
    queryKey: ['admin-user-audit', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('construct_audit_logs')
        .select('id, created_at, action, meta')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) return [];
      return data ?? [];
    },
  });

  const resetMfa = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-user-security', {
        body: { userId, action: 'reset_mfa' },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as { removed: number };
    },
    onSuccess: (res) => {
      toast.success(`Removed ${res.removed} 2FA factor${res.removed === 1 ? '' : 's'}`);
      qc.invalidateQueries({ queryKey: ['admin-user-security', userId] });
    },
    onError: (e: any) => toast.error(e?.message ?? 'Failed to reset 2FA'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading security data…
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-destructive flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Could not load security data: {(error as Error).message}
        </CardContent>
      </Card>
    );
  }

  const d = data!;

  return (
    <div className="space-y-6">
      {/* Account Security */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" /> Account Security
          </CardTitle>
          {onForceLogout && (
            <Button
              variant="outline"
              size="sm"
              onClick={onForceLogout}
              disabled={isForcingLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              {isForcingLogout ? 'Logging out…' : 'Force Logout'}
            </Button>
          )}
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Last sign-in</div>
            <div className="font-medium">{fmt(d.lastSignInAt)}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Sign-ins (30d)</div>
            <div className="font-medium">{d.signInCount30d}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
              <Globe className="w-3 h-3" /> Last IP
            </div>
            <div className="font-mono text-xs">{d.lastIp ?? '—'}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Email verified</div>
            <div className="font-medium">
              {d.emailConfirmedAt ? (
                <Badge variant="secondary" className="bg-green-500/15 text-green-700 dark:text-green-300">Verified</Badge>
              ) : (
                <Badge variant="secondary" className="bg-amber-500/15 text-amber-700 dark:text-amber-300">Unverified</Badge>
              )}
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Last user agent</div>
            <div className="text-xs text-muted-foreground truncate">{d.lastUserAgent ?? '—'}</div>
          </div>
        </CardContent>
      </Card>

      {/* 2FA */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5" /> Two-Factor Authentication
          </CardTitle>
          {d.mfa.enabled && (
            <AlertDialog open={confirmResetOpen} onOpenChange={setConfirmResetOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={resetMfa.isPending}>
                  {resetMfa.isPending ? 'Resetting…' : 'Reset 2FA'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset 2FA for {userName || 'this user'}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    All enrolled second-factor devices will be removed. The user will be able to sign in
                    with just their password until they re-enroll.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => { setConfirmResetOpen(false); resetMfa.mutate(); }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Reset 2FA
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardHeader>
        <CardContent>
          {d.mfa.factors.length === 0 ? (
            <div className="text-sm text-muted-foreground">No 2FA factors enrolled.</div>
          ) : (
            <ul className="space-y-2">
              {d.mfa.factors.map((f) => (
                <li key={f.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="uppercase">{f.type}</Badge>
                    <span className="font-medium">{f.friendly_name || 'Authenticator'}</span>
                    <Badge
                      variant="secondary"
                      className={f.status === 'verified'
                        ? 'bg-green-500/15 text-green-700 dark:text-green-300'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'}
                    >
                      {f.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {fmt(f.created_at)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Login Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" /> Login Log (last 20)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {d.loginLog.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No login events available. The auth audit log may not be exposed for this project.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-muted-foreground">
                  <tr className="text-left">
                    <th className="py-2 pr-3 font-medium">When</th>
                    <th className="py-2 pr-3 font-medium">Event</th>
                    <th className="py-2 pr-3 font-medium">IP</th>
                    <th className="py-2 pr-3 font-medium">User Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {d.loginLog.map((l) => (
                    <tr key={l.id} className="border-t border-border">
                      <td className="py-2 pr-3 whitespace-nowrap">{fmt(l.created_at)}</td>
                      <td className="py-2 pr-3"><Badge variant="secondary">{l.action}</Badge></td>
                      <td className="py-2 pr-3 font-mono">{l.ip_address ?? '—'}</td>
                      <td className="py-2 pr-3 max-w-[260px] truncate text-muted-foreground">{l.user_agent ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Audit Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" /> Audit Log (admin actions)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!auditRows || auditRows.length === 0 ? (
            <div className="text-sm text-muted-foreground">No admin actions recorded for this user.</div>
          ) : (
            <ul className="space-y-2">
              {auditRows.map((row: any) => (
                <li key={row.id} className="rounded-md border border-border px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{row.action}</span>
                    <span className="text-xs text-muted-foreground">{fmt(row.created_at)}</span>
                  </div>
                  {row.meta && (
                    <pre className="mt-1 text-[11px] text-muted-foreground whitespace-pre-wrap break-all">
                      {JSON.stringify(row.meta, null, 0)}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserSecurityTab;