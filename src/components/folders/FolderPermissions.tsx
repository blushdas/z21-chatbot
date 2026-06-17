import React, { useState } from 'react';
import { UserPlus, Trash2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { type FolderMember, type FolderDetail } from '@/hooks/supabase/useFolderWorkspace';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ROLES = ['viewer', 'editor', 'approver', 'admin', 'owner'];
const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private', desc: 'Only you' },
  { value: 'shared', label: 'Shared', desc: 'Members only' },
  { value: 'admin_only', label: 'Admin Only', desc: 'Admins only' },
  { value: 'demo_only', label: 'Demo', desc: 'Read-only viewers' },
  { value: 'archived', label: 'Archived', desc: 'No new activity' },
];

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  admin: 'bg-red-500/10 text-red-400 border-red-500/20',
  editor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  approver: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  viewer: 'bg-gray-500/10 text-[var(--chat-muted)] border-gray-500/20',
};

interface Props {
  folder: FolderDetail;
  members: FolderMember[];
  onAdd: (userId: string, role: string) => Promise<unknown>;
  onUpdateRole: (id: string, role: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onUpdateFolder: (updates: Partial<FolderDetail>) => Promise<boolean>;
}

const FolderPermissions: React.FC<Props> = ({ folder, members, onAdd, onUpdateRole, onRemove, onUpdateFolder }) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [saving, setSaving] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();
    if (error || !data) {
      toast.error('User not found. They must have a Daryle.AI account.');
      setSaving(false);
      return;
    }
    await onAdd(data.id, role);
    setSaving(false);
    setOpen(false);
    setEmail('');
    setRole('viewer');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium text-[var(--chat-text)]">Visibility</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {VISIBILITY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onUpdateFolder({ visibility: opt.value })}
              className={`p-2 rounded-lg border text-left transition-colors ${
                folder.visibility === opt.value
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-[var(--chat-border)] bg-[var(--chat-bg)] hover:border-[var(--chat-muted)]'
              }`}
            >
              <p className="text-xs font-medium text-[var(--chat-text)]">{opt.label}</p>
              <p className="text-xs text-[var(--chat-muted)]">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-[var(--chat-muted)]" />
            <p className="text-sm font-medium text-[var(--chat-text)]">Members</p>
            <span className="text-xs text-[var(--chat-muted)]">{members.length}</span>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1"><UserPlus className="h-3 w-3" />Invite</Button>
            </DialogTrigger>
            <DialogContent className="bg-[var(--chat-card)] border-[var(--chat-border)] text-[var(--chat-text)]">
              <DialogHeader><DialogTitle>Invite Member</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <Input
                  placeholder="Email address"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="bg-[var(--chat-bg)] border-[var(--chat-border)] text-[var(--chat-text)]"
                />
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="bg-[var(--chat-bg)] border-[var(--chat-border)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--chat-card)] border-[var(--chat-border)]">
                    {ROLES.filter(r => r !== 'owner').map(r => (
                      <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-[var(--chat-muted)]">User must have a Daryle.AI account to be invited.</p>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleInvite} disabled={saving || !email.trim()}>
                    {saving ? 'Looking up...' : 'Invite'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {members.length === 0 && (
          <div className="text-center py-6 text-[var(--chat-muted)] text-sm border border-dashed border-[var(--chat-border)] rounded-lg">
            No members yet. Invite collaborators to share this project.
          </div>
        )}

        {members.map(member => (
          <div key={member.id} className="group flex items-center gap-3 p-2.5 rounded-lg bg-[var(--chat-bg)] border border-[var(--chat-border)]">
            <div className="h-7 w-7 rounded-full bg-[var(--chat-card)] flex items-center justify-center text-xs text-[var(--chat-muted)] border border-[var(--chat-border)]">
              {member.user_id.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono text-[var(--chat-muted)] truncate">{member.user_id}</p>
            </div>
            <Select value={member.role} onValueChange={val => onUpdateRole(member.id, val)}>
              <SelectTrigger className={`h-6 w-24 text-xs border ${ROLE_COLORS[member.role] ?? ''}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[var(--chat-card)] border-[var(--chat-border)]">
                {ROLES.filter(r => r !== 'owner').map(r => (
                  <SelectItem key={r} value={r} className="text-xs capitalize">{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-red-400"
              onClick={() => onRemove(member.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FolderPermissions;
