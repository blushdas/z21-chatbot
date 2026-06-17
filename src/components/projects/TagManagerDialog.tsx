import React, { useState } from 'react';
import { Plus, Trash2, Check, X, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { ProjectTag } from '@/hooks/supabase/useFolderTags';

const PRESET_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#64748b'];

interface Props {
  trigger: React.ReactNode;
  tags: ProjectTag[];
  onCreate: (name: string, color?: string | null) => Promise<ProjectTag | null>;
  onRename: (id: string, name: string) => Promise<boolean>;
  onColor: (id: string, color: string | null) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

const TagManagerDialog: React.FC<Props> = ({ trigger, tags, onCreate, onRename, onColor, onDelete }) => {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState<string>(PRESET_COLORS[4]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const startEdit = (t: ProjectTag) => { setEditingId(t.id); setEditingName(t.name); };
  const saveEdit = async () => {
    if (editingId && editingName.trim()) {
      await onRename(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const created = await onCreate(newName.trim(), newColor);
    if (created) { setNewName(''); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md border-[var(--chat-border)] bg-[var(--chat-card)] text-[var(--chat-text)]">
        <DialogHeader><DialogTitle>Manage tags</DialogTitle></DialogHeader>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ background: newColor }} />
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="New tag name"
              className="h-9 flex-1 bg-[var(--chat-input-bg)]"
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void handleCreate(); } }}
            />
            <Button onClick={handleCreate} size="sm" className="bg-brand-yellow text-brand-blue hover:bg-brand-yellow/90">
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                className={`h-5 w-5 rounded-full border ${newColor === c ? 'border-white ring-2 ring-white/70' : 'border-transparent'}`}
                style={{ background: c }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </div>

        <div className="mt-4 max-h-80 space-y-1 overflow-y-auto border-t border-[var(--chat-border)] pt-3">
          {tags.length === 0 ? (
            <p className="px-1 py-4 text-center text-sm text-[var(--chat-muted)]">No tags yet. Create one above.</p>
          ) : tags.map(t => (
            <div key={t.id} className="group flex items-center gap-2 rounded-md px-1.5 py-1.5 hover:bg-[var(--ui-bg-hover)]">
              <div className="relative">
                <button
                  type="button"
                  className="h-4 w-4 rounded-full border border-[var(--chat-border)]"
                  style={{ background: t.color || 'hsl(var(--muted-foreground))' }}
                  aria-label="Change color"
                  onClick={(e) => {
                    const idx = PRESET_COLORS.indexOf(t.color || '');
                    const next = PRESET_COLORS[(idx + 1) % PRESET_COLORS.length];
                    void onColor(t.id, next);
                  }}
                  title="Click to cycle color"
                />
              </div>
              {editingId === t.id ? (
                <>
                  <Input
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') { setEditingId(null); setEditingName(''); } }}
                    onBlur={saveEdit}
                    className="h-7 flex-1 bg-[var(--chat-input-bg)] text-sm"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" onClick={saveEdit}><Check className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { setEditingId(null); setEditingName(''); }}><X className="h-3.5 w-3.5" /></Button>
                </>
              ) : (
                <>
                  <span className="flex-1 truncate text-sm">{t.name}</span>
                  <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100" onClick={() => startEdit(t)} aria-label="Rename"><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="text-red-500 opacity-0 group-hover:opacity-100 hover:text-red-500" onClick={() => onDelete(t.id)} aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                </>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TagManagerDialog;