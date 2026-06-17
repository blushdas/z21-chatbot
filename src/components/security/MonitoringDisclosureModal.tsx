import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * §26 — Privacy & User Transparency.
 * Shown once per user after first authenticated load. Records acknowledgement
 * in profiles.monitoring_disclosure_acknowledged_at.
 */
const MonitoringDisclosureModal: React.FC = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) return;
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('monitoring_disclosure_acknowledged_at')
        .eq('id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (!error && data && !data.monitoring_disclosure_acknowledged_at) {
        setOpen(true);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const acknowledge = async () => {
    if (!user?.id) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ monitoring_disclosure_acknowledged_at: new Date().toISOString() })
      .eq('id', user.id);
    setSaving(false);
    if (!error) setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !saving) return; setOpen(o); }}>
      <DialogContent className="max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <DialogTitle>Chat Monitoring & Safety Notice</DialogTitle>
          </div>
          <DialogDescription className="pt-2 space-y-3 text-sm">
            <p>
              To keep Daryle.AI safe for everyone, conversations are automatically scanned for high-risk content (self-harm, violence,
              illegal activity, sensitive data exposure). Admins are notified when a flag is raised and may review the relevant message
              and surrounding context.
            </p>
            <p>
              Your prompts, files, and chats are <strong>never used to train public AI models</strong>. We retain chat history per the
              published data retention policy. You can view our full <a href="/privacy" className="underline">privacy policy</a> any time.
            </p>
            <p className="text-xs text-muted-foreground">
              By clicking "I understand" you acknowledge this monitoring and accept the acceptable use policy.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={acknowledge} disabled={saving} className="w-full">
            {saving ? 'Saving…' : 'I understand'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MonitoringDisclosureModal;