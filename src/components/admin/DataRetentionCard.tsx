import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database, Loader2, Trash2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toastError } from '@/utils/toastError';
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

const RETENTION_OPTIONS = [
  { value: '30', label: '30 days' },
  { value: '60', label: '60 days' },
  { value: '90', label: '90 days' },
  { value: '180', label: '180 days' },
  { value: '365', label: '365 days' },
];

const DataRetentionCard: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);
  const [runningCleanup, setRunningCleanup] = useState(false);

  // Fetch retention setting
  const { data: retentionSetting, isLoading: settingLoading } = useQuery({
    queryKey: ['platform-setting', 'data_retention_days'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('key', 'data_retention_days')
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch last audit log
  const { data: lastAudit } = useQuery({
    queryKey: ['retention-audit-last'],
    queryFn: async () => {
      const { data } = await supabase
        .from('retention_audit_log')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(1)
        .single();
      return data;
    },
  });

  const config = retentionSetting?.value as { days?: number; enabled?: boolean } | null;
  const isEnabled = config?.enabled === true;
  const retentionDays = config?.days || 90;

  // Update setting mutation
  const updateMutation = useMutation({
    mutationFn: async (newValue: { days: number; enabled: boolean }) => {
      const { error } = await supabase
        .from('platform_settings')
        .update({ value: newValue })
        .eq('key', 'data_retention_days');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-setting', 'data_retention_days'] });
      toast({ title: 'Setting updated', description: 'Data retention policy updated.' });
    },
    onError: (error) => {
      toastError(error, 'Error', 'Failed to update setting.');
    },
  });

  const handleToggle = (enabled: boolean) => {
    updateMutation.mutate({ days: retentionDays, enabled });
  };

  const handleDaysChange = (value: string) => {
    updateMutation.mutate({ days: parseInt(value), enabled: isEnabled });
  };

  // Run cleanup
  const handleRunCleanup = async () => {
    setRunningCleanup(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const response = await fetch(
        `https://rptccafbujxprahkstmp.supabase.co/functions/v1/cleanup-expired-chats`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.session?.access_token}`,
          },
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Cleanup failed');

      toast({
        title: 'Cleanup complete',
        description: `Deleted ${result.deleted} expired chat(s) (retention: ${result.retention_days} days).`,
      });
      queryClient.invalidateQueries({ queryKey: ['retention-audit-last'] });
      setShowCleanupConfirm(false);
    } catch (error: any) {
      toastError(error);
    } finally {
      setRunningCleanup(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Data Retention Policy</CardTitle>
              <CardDescription>
                GDPR-compliant automatic deletion of old chat history
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {settingLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading settings...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="retention-toggle" className="text-base font-medium">
                    Enable automatic data retention
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Non-pinned chats older than the retention period will be permanently deleted
                  </p>
                </div>
                <Switch
                  id="retention-toggle"
                  checked={isEnabled}
                  onCheckedChange={handleToggle}
                  disabled={updateMutation.isPending}
                />
              </div>

              {/* Period selector */}
              {isEnabled && (
                <div className="flex items-center gap-4">
                  <Label className="text-sm font-medium whitespace-nowrap">Retention period:</Label>
                  <Select value={String(retentionDays)} onValueChange={handleDaysChange}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RETENTION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Last cleanup info */}
              {lastAudit && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
                  <Clock className="w-4 h-4" />
                  Last cleanup: {new Date(lastAudit.executed_at).toLocaleString()} — deleted{' '}
                  {lastAudit.deleted_count} chat(s)
                </div>
              )}

              {/* Manual cleanup */}
              {isEnabled && (
                <Button
                  variant="outline"
                  onClick={() => setShowCleanupConfirm(true)}
                  disabled={runningCleanup}
                  className="gap-2"
                >
                  {runningCleanup ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  {runningCleanup ? 'Running cleanup...' : 'Run Cleanup Now'}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showCleanupConfirm} onOpenChange={setShowCleanupConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Run Data Cleanup?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all non-pinned chats older than {retentionDays} days.
              This action cannot be undone. Pinned chats are always preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={runningCleanup}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRunCleanup}
              disabled={runningCleanup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {runningCleanup ? 'Processing...' : 'Confirm Cleanup'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DataRetentionCard;
