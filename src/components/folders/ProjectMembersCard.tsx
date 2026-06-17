import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, UserPlus, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

type Role = 'viewer' | 'editor';

interface MemberRow {
  id: string;
  user_id: string;
  role: Role;
  created_at: string;
  profile?: { name: string | null; email: string | null; avatar_url: string | null } | null;
}

interface Props {
  folderId: string;
  isOwner: boolean;
  onActivity?: (action: string, label: string) => void;
}

const ProjectMembersCard: React.FC<Props> = ({ folderId, isOwner, onActivity }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('viewer');
  const [inviting, setInviting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const loadMembers = async () => {
    setLoading(true);
    const { data: rows } = await supabase
      .from('folder_members')
      .select('id, user_id, role, created_at')
      .eq('folder_id', folderId)
      .order('created_at', { ascending: true });
    const list = (rows ?? []) as MemberRow[];
    if (list.length) {
      const ids = list.map(m => m.user_id);
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url')
        .in('id', ids);
      const profMap = new Map((profs ?? []).map((p: any) => [p.id, p]));
      list.forEach(m => { m.profile = profMap.get(m.user_id) ?? null; });
    }
    setMembers(list);
    setLoading(false);
  };

  useEffect(() => { loadMembers(); /* eslint-disable-next-line */ }, [folderId]);

  const handleInvite = async () => {
    if (!user?.id) return;
    const lookup = email.trim().toLowerCase();
    if (!lookup) return;
    setInviting(true);
    setInviteError(null);
    try {
      const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('id, name, email')
        .ilike('email', lookup)
        .maybeSingle();
      if (pErr || !profile) {
        const msg = 'This email does not match a current Daryle AI user.';
        setInviteError(msg);
        toast({
          title: 'User not found',
          description: msg,
          variant: 'destructive',
        });
        return;
      }
      if (profile.id === user.id) {
        toast({ title: 'You are the owner', description: 'You already have full access.' });
        return;
      }
      if (members.some(m => m.user_id === profile.id)) {
        const msg = `${profile.email} is already on this project.`;
        setInviteError(msg);
        toast({ title: 'Already a member', description: msg });
        return;
      }
      const { error } = await supabase
        .from('folder_members')
        .insert({ folder_id: folderId, user_id: profile.id, role, invited_by: user.id });
      if (error) {
        toast({ title: 'Could not invite', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Member added', description: `${profile.email} added as ${role}.` });
      setEmail('');
      onActivity?.('member_added', `${profile.name || profile.email} (${role})`);
      loadMembers();
    } finally {
      setInviting(false);
    }
  };

  const updateRole = async (m: MemberRow, next: Role) => {
    if (m.role === next) return;
    setBusyId(m.id);
    const { error } = await supabase
      .from('folder_members')
      .update({ role: next })
      .eq('id', m.id);
    setBusyId(null);
    if (error) {
      toast({ title: 'Could not update role', description: error.message, variant: 'destructive' });
      return;
    }
    setMembers(prev => prev.map(x => x.id === m.id ? { ...x, role: next } : x));
    onActivity?.('member_role_changed', `${m.profile?.name || m.profile?.email || 'member'} → ${next}`);
  };

  const removeMember = async (m: MemberRow) => {
    setBusyId(m.id);
    const { error } = await supabase
      .from('folder_members')
      .delete()
      .eq('id', m.id);
    setBusyId(null);
    if (error) {
      toast({ title: 'Could not remove', description: error.message, variant: 'destructive' });
      return;
    }
    setMembers(prev => prev.filter(x => x.id !== m.id));
    onActivity?.('member_removed', m.profile?.name || m.profile?.email || 'member');
  };

  const initial = (m: MemberRow) =>
    (m.profile?.name || m.profile?.email || '?').trim().charAt(0).toUpperCase();

  return (
    <section className="rounded-2xl border border-[var(--chat-border)] bg-[var(--chat-card)] p-4 shadow-sm shadow-black/5">
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="flex w-full items-center gap-2 text-left"
      >
        {expanded ? <ChevronDown className="h-4 w-4 text-[var(--ui-icon)]" /> : <ChevronRight className="h-4 w-4 text-[var(--ui-icon)]" />}
        <Users className="h-4 w-4 text-[var(--ui-icon)]" />
        <h2 className="font-heading text-lg font-semibold text-[var(--chat-text)]">Members</h2>
        <span className="ml-auto text-xs text-[var(--chat-muted)]">
          {loading ? '…' : `${members.length + 1} ${members.length + 1 === 1 ? 'person' : 'people'}`}
        </span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 border-t border-[var(--chat-border)] pt-3">
          {isOwner && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                type="email"
                placeholder="Invite by email…"
                value={email}
                onChange={e => { setEmail(e.target.value); if (inviteError) setInviteError(null); }}
                onKeyDown={e => { if (e.key === 'Enter') handleInvite(); }}
                disabled={inviting}
                className="h-9 flex-1"
              />
              <Select value={role} onValueChange={(v: Role) => setRole(v)}>
                <SelectTrigger className="h-9 w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleInvite} disabled={inviting || !email.trim()} className="h-9">
                <UserPlus className="mr-1 h-3.5 w-3.5" />
                {inviting ? 'Inviting…' : 'Invite'}
              </Button>
            </div>
          )}
          {isOwner && inviteError && (
            <p className="text-xs text-destructive" role="alert">{inviteError}</p>
          )}

          <ul className="space-y-1.5">
            {/* Owner row (current user, when viewing) */}
            <li className="flex items-center gap-3 rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg)] px-3 py-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs">You</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--chat-text)]">
                  {isOwner ? 'You' : 'Project owner'}
                </p>
              </div>
              <span className="rounded-full bg-brand-blue/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-blue dark:bg-brand-yellow/10 dark:text-brand-yellow">
                Owner
              </span>
            </li>

            {loading && (
              <li className="px-3 py-3 text-center text-xs text-[var(--chat-muted)]">Loading…</li>
            )}
            {!loading && members.length === 0 && (
              <li className="rounded-lg border border-dashed border-[var(--chat-border)] px-3 py-4 text-center text-xs text-[var(--chat-muted)]">
                No other members yet.
              </li>
            )}
            {members.map(m => (
              <li
                key={m.id}
                className="flex items-center gap-3 rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg)] px-3 py-2"
              >
                <Avatar className="h-7 w-7">
                  {m.profile?.avatar_url && <AvatarImage src={m.profile.avatar_url} />}
                  <AvatarFallback className="text-xs">{initial(m)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--chat-text)]">
                    {m.profile?.name || m.profile?.email || 'Unknown user'}
                  </p>
                  {m.profile?.email && m.profile?.name && (
                    <p className="truncate text-[11px] text-[var(--chat-muted)]">{m.profile.email}</p>
                  )}
                </div>
                {isOwner ? (
                  <>
                    <Select value={m.role} onValueChange={(v: Role) => updateRole(m, v)} disabled={busyId === m.id}>
                      <SelectTrigger className="h-7 w-24 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-[var(--chat-muted)] hover:text-destructive"
                      onClick={() => removeMember(m)}
                      disabled={busyId === m.id}
                      title="Remove member"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : (
                  <span className="rounded-full bg-[var(--ui-bg-hover)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--chat-muted)]">
                    {m.role}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default ProjectMembersCard;
