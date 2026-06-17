import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import BackToAdminButton from '@/components/admin/BackToAdminButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Shield, AlertTriangle, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { toastError } from '@/utils/toastError';
import { useAuth } from '@/context/SupabaseAuthContext';

type FlagStatus = 'pending' | 'reviewed' | 'resolved' | 'false_positive';
type FlagSeverity = 'low' | 'medium' | 'high' | 'critical';

type SafetyFlag = {
  id: string;
  chat_id: string;
  user_id: string;
  user_message: string;
  response_content: string;
  category: string;
  severity: FlagSeverity;
  status: FlagStatus;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

const SEVERITY_COLORS: Record<FlagSeverity, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400',
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400',
};

const SEVERITY_ORDER: Record<FlagSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const CATEGORY_LABELS: Record<string, string> = {
  suicide_self_harm: 'Suicide / Self-Harm',
  violence_threats: 'Violence / Threats',
  weapons_explosives: 'Weapons / Explosives',
  illegal_activity: 'Illegal Activity',
  cybersecurity_abuse: 'Cybersecurity Abuse',
  csam: 'CSAM',
  hate_harassment: 'Hate / Harassment',
  sensitive_data_exposure: 'Sensitive Data Exposure',
  internal_policy_violation: 'Policy Violation',
};

const AdminFlagsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [reviewFlag, setReviewFlag] = useState<SafetyFlag | null>(null);
  const [newStatus, setNewStatus] = useState<FlagStatus>('reviewed');
  const [adminNotes, setAdminNotes] = useState('');

  const { data: flags = [], isLoading } = useQuery<SafetyFlag[]>({
    queryKey: ['safety-flags', activeTab],
    queryFn: async () => {
      let query = supabase
        .from('chat_safety_flags')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeTab === 'pending') {
        query = query.eq('status', 'pending');
      }

      const { data, error } = await query;
      if (error) throw error;
      return ((data ?? []) as SafetyFlag[]).sort((a, b) => {
        const sevDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
        if (sevDiff !== 0) return sevDiff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    },
  });

  const { data: profiles = {} } = useQuery<Record<string, string>>({
    queryKey: ['safety-flags-profiles', flags.map(f => f.user_id)],
    enabled: flags.length > 0,
    queryFn: async () => {
      const uniqueIds = [...new Set(flags.map(f => f.user_id))];
      const { data } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', uniqueIds);
      const map: Record<string, string> = {};
      (data ?? []).forEach((p: { id: string; email?: string | null }) => {
        map[p.id] = p.email ?? p.id;
      });
      return map;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: FlagStatus; notes: string }) => {
      const reviewedAt = new Date().toISOString();
      const { error } = await supabase
        .from('chat_safety_flags')
        .update({
          status,
          admin_notes: notes || null,
          reviewed_by: user?.id ?? null,
          reviewed_at: reviewedAt,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-flags'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notification-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-sidebar-counts'] });
      toast({ title: 'Flag updated', description: 'Status saved successfully.' });
      setReviewFlag(null);
    },
    onError: (err) => toastError(err, 'Error', 'Failed to update flag.'),
  });

  const openReview = (flag: SafetyFlag) => {
    setReviewFlag(flag);
    setNewStatus('reviewed');
    setAdminNotes(flag.admin_notes ?? '');
  };

  const pendingCount = flags.filter(f => f.status === 'pending').length;

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        <BackToAdminButton />
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 dark:bg-red-950/40 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-3xl font-heading text-brand-blue dark:text-foreground">Safety Flags</h1>
              <p className="text-muted-foreground mt-1">AI-flagged conversations requiring review</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pending' | 'all')}>
          <TabsList className="mb-4">
            <TabsTrigger value="pending">
              Pending {pendingCount > 0 && <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-red-100 text-red-800">{pendingCount}</span>}
            </TabsTrigger>
            <TabsTrigger value="all">All Flags</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{activeTab === 'pending' ? 'Pending Review' : 'All Safety Flags'}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center gap-2 py-8 text-muted-foreground justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                  </div>
                ) : flags.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                    <Shield className="w-10 h-10 opacity-30" />
                    <p className="text-sm">No flags to review</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Severity</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {flags.map((flag) => (
                        <TableRow key={flag.id}>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_COLORS[flag.severity]}`}>
                              {flag.severity}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">{CATEGORY_LABELS[flag.category] ?? flag.category}</TableCell>
                          <TableCell className="text-sm text-muted-foreground truncate max-w-[160px]">{profiles[flag.user_id] ?? flag.user_id}</TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(flag.created_at), { addSuffix: true })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs capitalize">{flag.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" onClick={() => openReview(flag)}>Review</Button>
                          </TableCell>
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

      <Dialog open={!!reviewFlag} onOpenChange={(open) => !open && setReviewFlag(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Review Safety Flag
            </DialogTitle>
          </DialogHeader>

          {reviewFlag && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_COLORS[reviewFlag.severity]}`}>
                  {reviewFlag.severity}
                </span>
                <span className="text-sm text-muted-foreground">{CATEGORY_LABELS[reviewFlag.category] ?? reviewFlag.category}</span>
              </div>

              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase">User Message</Label>
                <div className="mt-1 p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">{reviewFlag.user_message}</div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase">AI Response</Label>
                <div className="mt-1 p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">{reviewFlag.response_content}</div>
              </div>

              <div>
                <Label htmlFor="status-select">Update Status</Label>
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as FlagStatus)}>
                  <SelectTrigger id="status-select" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="false_positive">False Positive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="admin-notes">Admin Notes (optional)</Label>
                <Textarea
                  id="admin-notes"
                  className="mt-1"
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this flag..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewFlag(null)}>Cancel</Button>
            <Button
              onClick={() => reviewFlag && updateMutation.mutate({ id: reviewFlag.id, status: newStatus, notes: adminNotes })}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminFlagsPage;
