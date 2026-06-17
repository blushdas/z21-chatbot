import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, Link2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { safeRedirect } from '@/utils/safeRedirect';

interface InvitePreview {
  valid: boolean;
  role: 'viewer' | 'editor';
  folder_name?: string | null;
}

interface AcceptInviteResult {
  folder_id?: string;
}

interface FolderInviteRpcClient {
  rpc(
    fn: 'lookup_invite_preview',
    args: { _token: string },
  ): Promise<{ data: InvitePreview | null; error: { message: string } | null }>;
  rpc(
    fn: 'accept_folder_invite',
    args: { _token: string },
  ): Promise<{ data: AcceptInviteResult | null; error: { message: string } | null }>;
}

const folderInviteRpc = supabase as unknown as FolderInviteRpcClient;

const InviteAcceptPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!token) { setError('Missing invite token'); setLoading(false); return; }
      if (authLoading) return;
      if (!user) {
        const redirectPath = safeRedirect(`/invite/${token}`);
        navigate(`/auth?redirect=${encodeURIComponent(redirectPath)}`, { replace: true });
        return;
      }
      const { data: invitePreview, error: e } = await folderInviteRpc
        .rpc('lookup_invite_preview', { _token: token });
      if (e || !invitePreview?.valid) {
        setError('Invite not found or no longer valid');
        setLoading(false);
        return;
      }
      setPreview(invitePreview);
      setLoading(false);
    };
    run();
  }, [token, user, authLoading, navigate]);

  const accept = async () => {
    if (!token) return;
    setAccepting(true);
    const { data, error: e } = await folderInviteRpc.rpc('accept_folder_invite', { _token: token });
    setAccepting(false);
    if (e) {
      toast({ title: 'Could not join project', description: e.message, variant: 'destructive' });
      return;
    }
    const folderId = data?.folder_id;
    toast({ title: 'Joined project', description: preview?.folder_name || '' });
    if (folderId) navigate(`/folder/${folderId}`, { replace: true });
    else navigate('/chat', { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--chat-bg)] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--chat-input-border)] bg-[var(--chat-input-bg)] p-6 shadow-lg">
        <div className="mb-4 flex items-center gap-2">
          <Link2 className="h-5 w-5 text-[var(--chat-text)]" />
          <h1 className="text-lg font-semibold text-[var(--chat-text)]">Project invitation</h1>
        </div>

        {loading || authLoading ? (
          <div className="flex items-center gap-2 text-sm text-[var(--chat-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking invite…
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4" /> {error}
          </div>
        ) : preview ? (
          <>
            <p className="text-sm text-[var(--chat-text)]">
              You've been invited to join{' '}
              <span className="font-semibold">{preview.folder_name || 'a project'}</span>{' '}
              as a <span className="font-semibold">{preview.role}</span>.
            </p>
            <div className="mt-5 flex gap-2">
              <Button onClick={accept} disabled={accepting} className="flex-1">
                {accepting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Joining…</>
                ) : (
                  <><CheckCircle2 className="mr-2 h-4 w-4" /> Accept invite</>
                )}
              </Button>
              <Button variant="ghost" onClick={() => navigate('/chat')}>Decline</Button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default InviteAcceptPage;
