import React, { useEffect, useState } from 'react';
import { Link2, Copy, Trash2, Plus, ChevronDown, ChevronRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

type Role = 'viewer' | 'editor';

interface InviteRow {
  id: string;
  token: string;
  role: Role;
  expires_at: string | null;
  max_uses: number | null;
  uses: number;
  revoked: boolean;
  created_at: string;
}

interface Props {
  folderId: string;
  isOwner: boolean;
  onActivity?: (action: string, label: string) => void;
}

const EXPIRY_OPTIONS: { label: string; days: number | null }[] = [
  { label: '24 hours', days: 1 },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: 'Never', days: null },
];

const ProjectShareCard: React.FC<Props> = ({ folderId, isOwner, onActivity }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(true);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role>('viewer');
  const [expiryDays, setExpiryDays] = useState<string>('7');
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const inviteUrl = (token: string) =>
    `${window.location.origin}/invite/${encodeURIComponent(token)}`;

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('folder_invites')
      .select('id, token, role, expires_at, max_uses, uses, revoked, created_at')
      .eq('folder_id', folderId)
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Could not load invites', description: error.message, variant: 'destructive' });
    } else {
      setInvites((data || []) as InviteRow[]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [folderId]);

  const create = async () => {
    if (!user?.id) return;
    setCreating(true);
    const days = expiryDays === 'null' ? null : Number(expiryDays);
    const expires_at = days ? new Date(Date.now() + days * 86400000).toISOString() : null;
    const { data, error } = await (supabase as any)
      .from('folder_invites')
      .insert({ folder_id: folderId, role, created_by: user.id, expires_at })
      .select('id, token, role, expires_at, max_uses, uses, revoked, created_at')
      .single();
    setCreating(false);
    if (error) {
      toast({ title: 'Could not create invite', description: error.message, variant: 'destructive' });
      return;
    }
    setInvites((prev) => [data as InviteRow, ...prev]);
    try {
      await navigator.clipboard.writeText(inviteUrl((data as InviteRow).token));
      toast({ title: 'Invite link copied', description: `Role: ${role}` });
    } catch {
      toast({ title: 'Invite created' });
    }
    onActivity?.('invite_created', `${role} invite`);
  };

  const copy = async (token: string) => {
    try {
      await navigator.clipboard.writeText(inviteUrl(token));
      toast({ title: 'Link copied' });
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    }
  };

  const revoke = async (id: string) => {
    setBusyId(id);
    const { error } = await (supabase as any)
      .from('folder_invites')
      .update({ revoked: true })
      .eq('id', id);
    setBusyId(null);
    if (error) {
      toast({ title: 'Could not revoke', description: error.message, variant: 'destructive' });
      return;
    }
    setInvites((prev) => prev.map((i) => (i.id === id ? { ...i, revoked: true } : i)));
    onActivity?.('invite_revoked', 'Invite revoked');
  };

  const remove = async (id: string) => {
    setBusyId(id);
    const { error } = await (supabase as any)
      .from('folder_invites')
      .delete()
      .eq('id', id);
    setBusyId(null);
    if (error) {
      toast({ title: 'Could not delete', description: error.message, variant: 'destructive' });
      return;
    }
    setInvites((prev) => prev.filter((i) => i.id !== id));
    onActivity?.('invite_deleted', 'Invite deleted');
  };

  const statusLabel = (i: InviteRow) => {
    if (i.revoked) return 'Revoked';
    if (i.expires_at && new Date(i.expires_at) < new Date()) return 'Expired';
    if (i.max_uses != null && i.uses >= i.max_uses) return 'Used up';
    return 'Active';
  };

  return (
    <section className="rounded-2xl border border-[var(--chat-input-border)] bg-[var(--chat-input-bg)] p-4 sm:p-5">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-[var(--chat-text)]" />
          <h3 className="text-sm font-semibold text-[var(--chat-text)]">Share & invite links</h3>
          <span className="text-xs text-[var(--chat-muted)]">
            ({invites.filter((i) => statusLabel(i) === 'Active').length} active)
          </span>
        </div>
        {expanded ? <ChevronDown className="h-4 w-4 text-[var(--chat-muted)]" />
          : <ChevronRight className="h-4 w-4 text-[var(--chat-muted)]" />}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {isOwner && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger className="h-9 w-full sm:w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                </SelectContent>
              </Select>
              <Select value={expiryDays} onValueChange={setExpiryDays}>
                <SelectTrigger className="h-9 w-full sm:w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPIRY_OPTIONS.map((o) => (
                    <SelectItem key={o.label} value={o.days == null ? 'null' : String(o.days)}>
                      Expires in {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={create} disabled={creating} size="sm" className="gap-1">
                <Plus className="h-3.5 w-3.5" />
                {creating ? 'Creating…' : 'Create invite link'}
              </Button>
            </div>
          )}

          {loading ? (
            <p className="text-xs text-[var(--chat-muted)]">Loading invites…</p>
          ) : invites.length === 0 ? (
            <p className="text-xs text-[var(--chat-muted)]">
              No invite links yet. {isOwner ? 'Create one above to share this project.' : 'Only the owner can create invites.'}
            </p>
          ) : (
            <ul className="space-y-2">
              {invites.map((i) => {
                const status = statusLabel(i);
                const active = status === 'Active';
                return (
                  <li
                    key={i.id}
                    className="flex flex-col gap-2 rounded-lg border border-[var(--chat-input-border)] bg-[var(--chat-bg)] p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-md bg-[var(--chat-input-bg)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--chat-muted)]">
                          <Shield className="h-3 w-3" /> {i.role}
                        </span>
                        <span
                          className={`text-[10px] uppercase tracking-wide ${
                            active ? 'text-emerald-500' : 'text-[var(--chat-muted)]'
                          }`}
                        >
                          {status}
                        </span>
                        <span className="text-[10px] text-[var(--chat-muted)]">
                          {i.uses} use{i.uses === 1 ? '' : 's'}
                          {i.expires_at ? ` · expires ${new Date(i.expires_at).toLocaleDateString()}` : ''}
                        </span>
                      </div>
                      <p className="mt-1 truncate font-mono text-xs text-[var(--chat-text)]">
                        {inviteUrl(i.token)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copy(i.token)}
                        title="Copy link"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      {isOwner && active && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          disabled={busyId === i.id}
                          onClick={() => revoke(i.id)}
                        >
                          Revoke
                        </Button>
                      )}
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          disabled={busyId === i.id}
                          onClick={() => remove(i.id)}
                          title="Delete invite"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
};

export default ProjectShareCard;