import React, { useState } from 'react';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { type FolderQuickLink } from '@/hooks/supabase/useFolderWorkspace';

interface Props {
  quickLinks: FolderQuickLink[];
  onAdd: (data: Pick<FolderQuickLink, 'title' | 'url' | 'icon'>) => Promise<unknown>;
  onDelete: (id: string) => Promise<void>;
}

const FolderQuickLinks: React.FC<Props> = ({ quickLinks, onAdd, onDelete }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!title.trim() || !url.trim()) return;
    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) finalUrl = `https://${finalUrl}`;
    setSaving(true);
    await onAdd({ title: title.trim(), url: finalUrl, icon: null });
    setSaving(false);
    setOpen(false);
    setTitle(''); setUrl('');
  };

  const getDomain = (rawUrl: string) => {
    try { return new URL(rawUrl).hostname.replace('www.', ''); } catch { return rawUrl; }
  };

  const getFaviconUrl = (rawUrl: string) => {
    try {
      const { hostname } = new URL(rawUrl);
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
    } catch { return null; }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--chat-muted)]">
          {quickLinks.length} link{quickLinks.length !== 1 ? 's' : ''} · Quick links do not auto-ingest as sources
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="h-3 w-3" />Add Link</Button>
          </DialogTrigger>
          <DialogContent className="bg-[var(--chat-card)] border-[var(--chat-border)] text-[var(--chat-text)]">
            <DialogHeader><DialogTitle>Add Quick Link</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <Input
                placeholder="Title (e.g. Monday Board, Box Folder)"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="bg-[var(--chat-bg)] border-[var(--chat-border)] text-[var(--chat-text)]"
              />
              <Input
                placeholder="URL"
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="bg-[var(--chat-bg)] border-[var(--chat-border)] text-[var(--chat-text)]"
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
                <Button size="sm" onClick={handleAdd} disabled={saving || !title.trim() || !url.trim()}>
                  {saving ? 'Adding...' : 'Add Link'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {quickLinks.length === 0 && (
        <div className="text-center py-8 text-[var(--chat-muted)] text-sm border border-dashed border-[var(--chat-border)] rounded-lg">
          No quick links yet. Add links to Monday.com, Box, Google Drive, CRM, or any tool.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {quickLinks.map(link => {
          const favicon = getFaviconUrl(link.url);
          return (
            <div key={link.id} className="group relative flex flex-col gap-2 p-3 rounded-lg bg-[var(--chat-bg)] border border-[var(--chat-border)] hover:border-[var(--chat-muted)] transition-colors">
              <a href={link.url} target="_blank" rel="noreferrer" className="flex items-start gap-2 flex-1">
                {favicon && <img src={favicon} alt="" className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--chat-text)] truncate">{link.title}</p>
                  <p className="text-xs text-[var(--chat-muted)] truncate">{getDomain(link.url)}</p>
                </div>
                <ExternalLink className="h-3 w-3 text-[var(--chat-muted)] flex-shrink-0 mt-0.5" />
              </a>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-1 right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-red-400"
                onClick={() => onDelete(link.id)}
              >
                <Trash2 className="h-2.5 w-2.5" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FolderQuickLinks;
