import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Ban } from 'lucide-react';
import { toast } from 'sonner';

type Mode = 'domain' | 'email';

interface BlockedRow {
  id: string;
  domain?: string;
  email?: string;
  reason: string | null;
  is_active: boolean;
  created_at: string;
}

const TABLE: Record<Mode, 'blocked_email_domains' | 'blocked_emails'> = {
  domain: 'blocked_email_domains',
  email: 'blocked_emails',
};

const BlockedListsSection: React.FC<{ mode: Mode }> = ({ mode }) => {
  const qc = useQueryClient();
  const key = mode === 'domain' ? 'blocked-domains' : 'blocked-emails';
  const valueField = mode === 'domain' ? 'domain' : 'email';
  const [showAdd, setShowAdd] = useState(false);
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<BlockedRow | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: [key],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from(TABLE[mode])
        .select('*')
        .order(valueField, { ascending: true });
      if (error) throw error;
      return data as BlockedRow[];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const payload: any = { [valueField]: value.trim().toLowerCase(), reason: reason.trim() || null, is_active: isActive };
      const { error } = await (supabase as any).from(TABLE[mode]).insert([payload]);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [key] });
      toast.success(`${mode === 'domain' ? 'Domain' : 'Email'} blocked`);
      setShowAdd(false); setValue(''); setReason(''); setIsActive(true);
    },
    onError: (e: any) => toast.error(e.code === '23505' ? 'Already in blocklist' : 'Failed to add'),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any).from(TABLE[mode]).update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [key] }),
    onError: () => toast.error('Failed to update'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from(TABLE[mode]).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [key] });
      toast.success('Removed from blocklist');
      setConfirmDelete(null);
    },
    onError: () => toast.error('Failed to remove'),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Ban className="w-5 h-5 text-destructive" />
            Blocked {mode === 'domain' ? 'Domains' : 'Emails'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {mode === 'domain'
              ? 'Email domains in this list are rejected at signup, even if otherwise authorized.'
              : 'Individual email addresses in this list are rejected at signup, even if their domain is authorized.'}
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-1" /> Add</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{mode === 'domain' ? 'Domain' : 'Email'}</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Loading…</TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No entries yet.</TableCell></TableRow>
              ) : rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono">{(r as any)[valueField]}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.reason || '—'}</TableCell>
                  <TableCell>
                    <Switch checked={r.is_active} onCheckedChange={(v) => toggle.mutate({ id: r.id, is_active: v })} />
                    {r.is_active ? <Badge variant="destructive" className="ml-2">Blocking</Badge> : <Badge variant="secondary" className="ml-2">Disabled</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(r)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block {mode === 'domain' ? 'Domain' : 'Email'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{mode === 'domain' ? 'Domain' : 'Email address'}</Label>
              <Input
                placeholder={mode === 'domain' ? 'example.com' : 'user@example.com'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div>
              <Label>Reason (optional)</Label>
              <Input placeholder="Former employee, abuse, etc." value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>Active immediately</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => add.mutate()} disabled={!value.trim() || add.isPending}>
              {add.isPending ? 'Saving…' : 'Block'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove from blocklist?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <span className="font-mono">{confirmDelete && (confirmDelete as any)[valueField]}</span> will be allowed to sign up again
            (provided their domain or email is authorized).
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => confirmDelete && remove.mutate(confirmDelete.id)}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlockedListsSection;