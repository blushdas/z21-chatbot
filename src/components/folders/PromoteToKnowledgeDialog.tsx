import React, { useState } from 'react';
import { BookMarked } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import KnowledgeRichEditor from './KnowledgeRichEditor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/SupabaseAuthContext';
import { toast } from 'sonner';

const KNOWLEDGE_TYPES = [
  { value: 'note', label: 'Note' },
  { value: 'decision', label: 'Decision' },
  { value: 'task', label: 'Task' },
  { value: 'faq', label: 'FAQ' },
  { value: 'memory', label: 'Memory' },
  { value: 'working_knowledge', label: 'Working Knowledge' },
  { value: 'open_question', label: 'Open Question' },
  { value: 'source_summary', label: 'Source Summary' },
  { value: 'draft', label: 'Draft' },
  { value: 'approved_knowledge', label: 'Approved Knowledge' },
  { value: 'reusable_prompt', label: 'Reusable Prompt' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  folderId: string;
  chatId?: string;
  initialContent?: string;
}

const PromoteToKnowledgeDialog: React.FC<Props> = ({ open, onClose, folderId, chatId, initialContent = '' }) => {
  const { user } = useAuth();
  const [content, setContent] = useState(initialContent);
  const [type, setType] = useState('note');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState('draft');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (open) setContent(initialContent);
  }, [open, initialContent]);

  const handleSave = async () => {
    if (!content.trim() || !user?.id) return;
    setSaving(true);
    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
    const { error } = await supabase.from('folder_knowledge').insert({
      folder_id: folderId,
      chat_id: chatId ?? null,
      user_id: user.id,
      type,
      content: content.trim(),
      tags: tagList,
      status,
    });
    setSaving(false);
    if (error) { toast.error('Failed to save knowledge item'); return; }
    toast.success('Saved to project knowledge');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="bg-[var(--chat-card)] border-[var(--chat-border)] text-[var(--chat-text)] max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookMarked className="h-4 w-4" />
            Promote to Project Knowledge Base
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <KnowledgeRichEditor value={content} onChange={(md) => setContent(md)} />
          <div className="flex gap-2">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="flex-1 bg-[var(--chat-bg)] border-[var(--chat-border)] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[var(--chat-card)] border-[var(--chat-border)]">
                {KNOWLEDGE_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-32 bg-[var(--chat-bg)] border-[var(--chat-border)] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[var(--chat-card)] border-[var(--chat-border)]">
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input
            placeholder="Tags (comma separated)"
            value={tags}
            onChange={e => setTags(e.target.value)}
            className="bg-[var(--chat-bg)] border-[var(--chat-border)] text-[var(--chat-text)] text-sm"
          />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !content.trim()}>
              {saving ? 'Saving...' : 'Save to Knowledge'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PromoteToKnowledgeDialog;
