import React, { useState } from 'react';
import { Plus, Trash2, ExternalLink, FileText, Link as LinkIcon, Mail, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { type FolderSource } from '@/hooks/supabase/useFolderWorkspace';

const SOURCE_TYPES = [
  { value: 'link', label: 'Link / URL', icon: LinkIcon },
  { value: 'note', label: 'Note', icon: FileText },
  { value: 'file', label: 'File Upload', icon: File },
  { value: 'transcript', label: 'Transcript', icon: FileText },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'box', label: 'Box Link', icon: LinkIcon },
  { value: 'monday', label: 'Monday.com', icon: LinkIcon },
];

const STATUS_COLORS: Record<string, string> = {
  uploaded: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  ingested: 'bg-green-500/10 text-green-400 border-green-500/20',
  approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  needs_review: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  archived: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  do_not_use: 'bg-red-500/10 text-red-400 border-red-500/20',
};

function SourceIcon({ type }: { type: string }) {
  const found = SOURCE_TYPES.find(t => t.value === type);
  const Icon = found?.icon ?? FileText;
  return <Icon className="h-3.5 w-3.5" />;
}

interface Props {
  sources: FolderSource[];
  onAdd: (data: Pick<FolderSource, 'type' | 'title' | 'url' | 'content' | 'status' | 'visibility'>) => Promise<unknown>;
  onDelete: (id: string) => Promise<void>;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
}

const FolderSources: React.FC<Props> = ({ sources, onAdd, onDelete, onUpdateStatus }) => {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('link');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await onAdd({ type, title: title.trim(), url: url.trim() || null, content: content.trim() || null, status: 'uploaded', visibility: 'project' });
    setSaving(false);
    setOpen(false);
    setTitle(''); setUrl(''); setContent(''); setType('link');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--chat-muted)]">{sources.length} source{sources.length !== 1 ? 's' : ''}</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="h-3 w-3" />Add Source</Button>
          </DialogTrigger>
          <DialogContent className="bg-[var(--chat-card)] border-[var(--chat-border)] text-[var(--chat-text)]">
            <DialogHeader>
              <DialogTitle>Add Source</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-[var(--chat-bg)] border-[var(--chat-border)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[var(--chat-card)] border-[var(--chat-border)]">
                  {SOURCE_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="bg-[var(--chat-bg)] border-[var(--chat-border)] text-[var(--chat-text)]"
              />
              {type !== 'note' && (
                <Input
                  placeholder="URL (optional)"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  className="bg-[var(--chat-bg)] border-[var(--chat-border)] text-[var(--chat-text)]"
                />
              )}
              {(type === 'note' || type === 'transcript' || type === 'email') && (
                <Textarea
                  placeholder="Content"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="min-h-[120px] bg-[var(--chat-bg)] border-[var(--chat-border)] text-[var(--chat-text)]"
                />
              )}
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
                <Button size="sm" onClick={handleAdd} disabled={saving || !title.trim()}>
                  {saving ? 'Adding...' : 'Add Source'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {sources.length === 0 && (
        <div className="text-center py-8 text-[var(--chat-muted)] text-sm border border-dashed border-[var(--chat-border)] rounded-lg">
          No sources yet. Add files, links, notes, or transcripts.
        </div>
      )}

      <div className="space-y-2">
        {sources.map(source => (
          <div key={source.id} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--chat-bg)] border border-[var(--chat-border)] group">
            <div className="text-[var(--chat-muted)]"><SourceIcon type={source.type} /></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--chat-text)] truncate">{source.title}</p>
              {source.url && (
                <a href={source.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-0.5 truncate">
                  {source.url} <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
                </a>
              )}
            </div>
            <Select value={source.status} onValueChange={val => onUpdateStatus(source.id, val)}>
              <SelectTrigger className={`h-6 text-xs border rounded px-2 w-32 ${STATUS_COLORS[source.status] ?? ''}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[var(--chat-card)] border-[var(--chat-border)]">
                {Object.keys(STATUS_COLORS).map(s => (
                  <SelectItem key={s} value={s} className="text-xs">{s.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-red-400"
              onClick={() => onDelete(source.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FolderSources;
