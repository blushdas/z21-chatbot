import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import BackToAdminButton from '@/components/admin/BackToAdminButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, Users, AlertTriangle, Loader2, CheckCircle2, Flag, Clock, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { toastError } from '@/utils/toastError';
import DataRetentionCard from '@/components/admin/DataRetentionCard';
import AccessControlsCard from '@/components/admin/AccessControlsCard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const AdminSecuritySettingsPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  // Fetch safety flagging setting
  const { data: safetyFlagSetting, isLoading: safetySettingLoading } = useQuery({
    queryKey: ['platform-setting', 'safety_flagging_enabled'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('key', 'safety_flagging_enabled')
        .single();
      if (error) throw error;
      return data;
    }
  });

  const safetySettingValue = safetyFlagSetting?.value as { enabled?: boolean } | null;
  const isSafetyFlaggingEnabled = safetySettingValue?.enabled !== false;

  const safetyToggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = await supabase
        .from('platform_settings')
        .update({ value: { enabled } })
        .eq('key', 'safety_flagging_enabled');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-setting', 'safety_flagging_enabled'] });
      toast({
        title: 'Setting updated',
        description: `Safety flagging has been ${isSafetyFlaggingEnabled ? 'disabled' : 'enabled'}.`
      });
    },
    onError: (error) => {
      toastError(error, 'Error', 'Failed to update setting. Please try again.');
    }
  });

  // Fetch 2FA requirement setting
  const { data: twoFactorSetting, isLoading: settingLoading } = useQuery({
    queryKey: ['platform-setting', 'two_factor_required'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('key', 'two_factor_required')
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch 2FA stats
  const { data: twoFactorStats, isLoading: statsLoading } = useQuery({
    queryKey: ['two-factor-stats'],
    queryFn: async () => {
      const [totalRes, enabledRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('two_factor_settings').select('*', { count: 'exact', head: true }).eq('enabled', true)
      ]);
      
      return {
        totalUsers: totalRes.count || 0,
        usersWithTwoFactor: enabledRes.count || 0
      };
    }
  });

  // Parse setting value safely
  const settingValue = twoFactorSetting?.value as { enabled?: boolean } | null;

  // Toggle 2FA requirement
  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = await supabase
        .from('platform_settings')
        .update({ value: { enabled } })
        .eq('key', 'two_factor_required');
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-setting', 'two_factor_required'] });
      toast({
        title: 'Setting updated',
        description: `2FA requirement has been ${settingValue?.enabled ? 'disabled' : 'enabled'}.`
      });
    },
    onError: (error) => {
      toastError(error, 'Error', 'Failed to update setting. Please try again.');
    }
  });

  // Logout all users
  const handleLogoutAllUsers = async () => {
    setLoggingOutAll(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      const response = await fetch(
        'https://rptccafbujxprahkstmp.supabase.co/functions/v1/admin-logout-all-users',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.session?.access_token}`
          },
          body: JSON.stringify({})
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to logout users');
      }

      toast({
        title: 'Success',
        description: `Logged out ${result.loggedOutCount} users. They will need to re-authenticate.`
      });
      
      setShowLogoutConfirm(false);
    } catch (error: any) {
      toastError(error, 'Error', 'Failed to logout users');
    } finally {
      setLoggingOutAll(false);
    }
  };

  const is2FAEnabled = settingValue?.enabled === true;
  const usersWithout2FA = (twoFactorStats?.totalUsers || 0) - (twoFactorStats?.usersWithTwoFactor || 0);

  // Fetch session timeout setting
  const { data: sessionTimeoutSetting } = useQuery({
    queryKey: ['platform-setting', 'session_timeout_minutes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('key', 'session_timeout_minutes')
        .single();
      if (error) throw error;
      return data;
    }
  });

  const sessionTimeoutValue = sessionTimeoutSetting?.value as { minutes?: number } | null;
  const sessionTimeoutMinutes = String(sessionTimeoutValue?.minutes ?? 15);

  const sessionTimeoutMutation = useMutation({
    mutationFn: async (minutes: number) => {
      const { error } = await supabase
        .from('platform_settings')
        .update({ value: { minutes } })
        .eq('key', 'session_timeout_minutes');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-setting', 'session_timeout_minutes'] });
      toast({ title: 'Setting updated', description: 'Session timeout policy saved.' });
    },
    onError: (error) => { toastError(error, 'Error', 'Failed to update session timeout.'); }
  });

  // Fetch export permission setting
  const { data: exportPermissionSetting } = useQuery({
    queryKey: ['platform-setting', 'export_permission'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('key', 'export_permission')
        .single();
      if (error) throw error;
      return data;
    }
  });

  const exportPermissionValue = exportPermissionSetting?.value as { level?: string } | null;
  const isExportAdminOnly = exportPermissionValue?.level === 'admin_only';

  const exportPermissionMutation = useMutation({
    mutationFn: async (adminOnly: boolean) => {
      const { error } = await supabase
        .from('platform_settings')
        .update({ value: { level: adminOnly ? 'admin_only' : 'all' } })
        .eq('key', 'export_permission');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-setting', 'export_permission'] });
      toast({ title: 'Setting updated', description: 'Export permission policy saved.' });
    },
    onError: (error) => { toastError(error, 'Error', 'Failed to update export permission.'); }
  });

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-6xl">
          <BackToAdminButton />
          <div className="mb-10">
            <h1 className="text-3xl font-heading text-brand-blue dark:text-foreground">Security Settings</h1>
            <p className="text-muted-foreground mt-2">
              Configure platform-wide security policies
            </p>
          </div>

          {/* ───────── Authentication & Sessions ───────── */}
          <section className="mb-10">
            <div className="mb-4 flex items-baseline justify-between border-b border-border pb-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Authentication & Sessions
              </h2>
              <span className="text-xs text-muted-foreground">2FA, timeouts, active sessions</span>
            </div>
            <div className="grid gap-6">
            {/* 2FA Stats Card — full width */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/40 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">2FA Adoption</CardTitle>
                    <CardDescription>Current two-factor authentication status</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading stats...
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-foreground">{twoFactorStats?.totalUsers}</div>
                      <div className="text-sm text-muted-foreground">Total Users</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">{twoFactorStats?.usersWithTwoFactor}</div>
                      <div className="text-sm text-muted-foreground">With 2FA</div>
                    </div>
                    <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                      <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{usersWithout2FA}</div>
                      <div className="text-sm text-muted-foreground">Without 2FA</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
            {/* 2FA Enforcement Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950/40 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Enforce Two-Factor Authentication</CardTitle>
                    <CardDescription>
                      Require all users to set up 2FA before accessing the platform
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="2fa-toggle" className="text-base font-medium">
                        Require 2FA for all users
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Users without 2FA will be redirected to setup before accessing the app
                      </p>
                    </div>
                    {settingLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    ) : (
                      <Switch
                        id="2fa-toggle"
                        checked={is2FAEnabled}
                        onCheckedChange={(checked) => toggleMutation.mutate(checked)}
                        disabled={toggleMutation.isPending}
                      />
                    )}
                  </div>

                  {is2FAEnabled && usersWithout2FA > 0 && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-800 dark:text-amber-300">
                          {usersWithout2FA} user{usersWithout2FA > 1 ? 's' : ''} will be required to set up 2FA
                        </p>
                        <p className="text-amber-700 dark:text-amber-400/80 mt-1">
                          These users will be redirected to the 2FA setup page on their next login.
                        </p>
                      </div>
                    </div>
                  )}

                  {is2FAEnabled && usersWithout2FA === 0 && (
                    <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-green-800 dark:text-green-300">
                          All users have 2FA enabled
                        </p>
                        <p className="text-green-700 dark:text-green-400/80 mt-1">
                          Your platform is fully secured with two-factor authentication.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Session Timeout Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sky-50 dark:bg-sky-950/40 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Session Timeout</CardTitle>
                    <CardDescription>
                      Automatically log out inactive users after a set period
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">Idle timeout duration</Label>
                    <p className="text-sm text-muted-foreground">
                      Users on "Remember Me" sessions are not affected
                    </p>
                  </div>
                  <Select
                    value={sessionTimeoutMinutes}
                    onValueChange={(val) => sessionTimeoutMutation.mutate(Number(val))}
                    disabled={sessionTimeoutMutation.isPending}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="10">10 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            </div>

            {/* Force Logout Card — full width, destructive */}
            <Card className="border-destructive/40">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 dark:bg-red-950/40 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Force Logout All Users</CardTitle>
                    <CardDescription>
                      Terminate all active sessions and force users to re-authenticate
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Use this action to log out all users from the platform. This is useful when 
                    enabling 2FA enforcement to ensure all users complete the 2FA setup on their next login.
                  </p>
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowLogoutConfirm(true)}
                    disabled={loggingOutAll}
                  >
                    {loggingOutAll ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Logging out users...
                      </>
                    ) : (
                      'Logout All Users'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
            </div>
          </section>

          {/* ───────── Content & Data ───────── */}
          <section className="mb-10">
            <div className="mb-4 flex items-baseline justify-between border-b border-border pb-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Content & Data
              </h2>
              <span className="text-xs text-muted-foreground">Safety, exports, retention</span>
            </div>
            <div className="grid gap-6">
            <div className="grid gap-6 md:grid-cols-2">
            {/* Content Safety Flagging Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-950/40 rounded-lg flex items-center justify-center">
                    <Flag className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Content Safety Flagging</CardTitle>
                    <CardDescription>
                      Automatically flag high-risk conversations using AI classification
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="safety-toggle" className="text-base font-medium">
                      Enable AI safety flagging
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Flags are non-blocking and checked after each response is delivered
                    </p>
                  </div>
                  {safetySettingLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  ) : (
                    <Switch
                      id="safety-toggle"
                      checked={isSafetyFlaggingEnabled}
                      onCheckedChange={(checked) => safetyToggleMutation.mutate(checked)}
                      disabled={safetyToggleMutation.isPending}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Export Controls Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-50 dark:bg-violet-950/40 rounded-lg flex items-center justify-center">
                    <Download className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Export Controls</CardTitle>
                    <CardDescription>
                      Control who can export chats as PDF, Word, or Markdown
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="export-toggle" className="text-base font-medium">
                      Restrict exports to admins only
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      When enabled, standard users cannot export chat history
                    </p>
                  </div>
                  <Switch
                    id="export-toggle"
                    checked={isExportAdminOnly}
                    onCheckedChange={(checked) => exportPermissionMutation.mutate(checked)}
                    disabled={exportPermissionMutation.isPending}
                  />
                </div>
              </CardContent>
            </Card>
            </div>

            {/* Data Retention Policy Card — full width */}
            <DataRetentionCard />
            </div>
          </section>

          {/* ───────── Network Access ───────── */}
          <section className="mb-10">
            <div className="mb-4 flex items-baseline justify-between border-b border-border pb-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Network Access
              </h2>
              <span className="text-xs text-muted-foreground">IP &amp; country rules</span>
            </div>
            <AccessControlsCard />
          </section>
        </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout All Users?</AlertDialogTitle>
            <AlertDialogDescription>
              This will terminate all active sessions across the platform. All users (including you) 
              will need to sign in again. If 2FA is enforced, users will be required to complete 
              2FA setup before regaining access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loggingOutAll}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogoutAllUsers}
              disabled={loggingOutAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loggingOutAll ? 'Processing...' : 'Confirm Logout All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminSecuritySettingsPage;
