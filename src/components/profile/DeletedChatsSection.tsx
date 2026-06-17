import React, { useEffect, useState, useCallback } from 'react';
import { Trash2, RotateCcw, Loader2, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface DeletedChat {
  id: string;
  title: string;
  deleted_at: string;
  updated_at: string;
}

const DeletedChatsSection: React.FC = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<DeletedChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('chats')
      .select('id, title, deleted_at, updated_at')
      .eq('user_id', user.id)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });
    if (error) {
      toast.error('Failed to load deleted chats');
    } else {
      setChats((data || []) as DeletedChat[]);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const restore = async (id: string) => {
    setBusyId(id);
    const { error } = await supabase
      .from('chats')
      .update({ deleted_at: null })
      .eq('id', id)
      .eq('user_id', user!.id);
    setBusyId(null);
    if (error) return toast.error('Failed to restore chat');
    toast.success('Chat restored');
    setChats(prev => prev.filter(c => c.id !== id));
    window.dispatchEvent(new CustomEvent('chats:refresh'));
  };

  const purge = async (id: string) => {
    if (!confirm('Permanently delete this chat? This cannot be undone.')) return;
    setBusyId(id);
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', id)
      .eq('user_id', user!.id);
    setBusyId(null);
    if (error) return toast.error('Failed to delete chat');
    toast.success('Chat permanently deleted');
    setChats(prev => prev.filter(c => c.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-[var(--chat-muted)]">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--chat-text)]">Deleted chats</h2>
        <p className="text-sm text-[var(--chat-muted)] mt-1">
          Restore a recently deleted chat, or remove it permanently.
        </p>
      </div>

      {chats.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--chat-border)] py-12 text-center text-sm text-[var(--chat-muted)]">
          No deleted chats.
        </div>
      ) : (
        <ul className="divide-y divide-[var(--chat-border)] rounded-lg border border-[var(--chat-border)] bg-[var(--chat-card)]">
          {chats.map(chat => (
            <li key={chat.id} className="flex items-center gap-3 px-4 py-3">
              <MessageSquare className="h-4 w-4 shrink-0 text-[var(--chat-muted)]" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-[var(--chat-text)]">
                  {chat.title || 'Untitled chat'}
                </div>
                <div className="text-xs text-[var(--chat-muted)]">
                  Deleted {formatDistanceToNow(new Date(chat.deleted_at), { addSuffix: true })}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={busyId === chat.id}
                onClick={() => restore(chat.id)}
                className="gap-1"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restore
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={busyId === chat.id}
                onClick={() => purge(chat.id)}
                className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete forever
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DeletedChatsSection;