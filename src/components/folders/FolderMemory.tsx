import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type FolderMemoryItem } from '@/hooks/supabase/useFolderWorkspace';

const CATEGORIES = [
  { value: 'decision', label: 'Decision', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { value: 'person', label: 'Person', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { value: 'preference', label: 'Preference', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  { value: 'context', label: 'Context', color: 'bg-gray-500/10 text-[var(--chat-muted)] border-gray-500/20' },
  { value: 'constraint', label: 'Constraint', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  { value: 'open_question', label: 'Open Question', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  { value: 'priority', label: 'Priority', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'suggested', label: 'Suggested' },
  { value: 'archived', label: 'Archived' },
];

const STATUS_COLORS: Record<string, string> = {
  suggested: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  archived: 'bg-gray-500/10 text-[var(--chat-muted)] border-gray-500/20',
};

function categoryLabel(cat: string) {
  return CATEGORIES.find(c => c.value === cat)?.label ?? cat;
}

interface Props {
  memory: FolderMemoryItem[];
  onAdd: (data: Pick<FolderMemoryItem, 'category' | 'content' | 'status'>) => Promise<unknown>;
  onUpdate: (id: string, content: string) => Promise<void>;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const FolderMemory: React.FC<Props> = ({ memory, onAdd, onUpdate, onUpdateStatus, onDelete }) => {
  const [newCategory, setNewCategory] = useState('context');
  const [newStatus, setNewStatus] = useState('active');
  const [newContent, setNewContent] = useState('');
  const [filter, setFilter] = useState('active_suggested');
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const filteredMemory = useMemo(() => {
    return memory.filter(item => {
      const status = item.status ?? 'active';
      if (filter === 'all') return true;
      if (filter === 'active_suggested') return status === 'active' || status === 'suggested';
      return status === filter;
    });
  }, [memory, filter]);

  const grouped = CATEGORIES.reduce<Record<string, FolderMemoryItem[]>>((acc, cat) => {
    acc[cat.value] = filteredMemory.filter(m => m.category === cat.value);
    return acc;
  }, {});

  const handleAdd = async () => {
    if (!newContent.trim()) return;
    setSaving(true);
    await onAdd({ category: newCategory, content: newContent.trim(), status: newStatus });
    setSaving(false);
    setNewContent('');
    setNewStatus('active');
    setAdding(false);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editContent.trim()) return;
    await onUpdate(id, editContent.trim());
    setEditingId(null);
  };

  const handleStatusChange = async (id: string, status: string) => {
    await onUpdateStatus(id, status);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-[var(--chat-muted)]">{memory.length} item{memory.length !== 1 ? 's' : ''} stored</p>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="h-8 w-44 text-xs bg-[var(--chat-bg)] border-[var(--chat-border)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[var(--chat-card)] border-[var(--chat-border)]">
              <SelectItem value="active_suggested" className="text-xs">Active + Suggested</SelectItem>
              <SelectItem value="active" className="text-xs">Active</SelectItem>
              <SelectItem value="suggested" className="text-xs">Suggested</SelectItem>
              <SelectItem value="archived" className="text-xs">Archived</SelectItem>
              <SelectItem value="all" className="text-xs">All</SelectItem>
            </SelectContent>
          </Select>
          {!adding && (
            <Button size="sm" className="gap-1" onClick={() => setAdding(true)}>
              <Plus className="h-3 w-3" />Add Memory
            </Button>
          )}
        </div>
      </div>

      {adding && (
        <div className="space-y-2 p-3 rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Select value={newCategory} onValueChange={setNewCategory}>
              <SelectTrigger className="h-8 text-xs bg-[var(--chat-card)] border-[var(--chat-border)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[var(--chat-card)] border-[var(--chat-border)]">
                {CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger className="h-8 text-xs bg-[var(--chat-card)] border-[var(--chat-border)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[var(--chat-card)] border-[var(--chat-border)]">
                {STATUS_OPTIONS.map(status => (
                  <SelectItem key={status.value} value={status.value} className="text-xs">{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Textarea
            placeholder="What should Daryle remember about this project?"
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            autoFocus
            className="min-h-[80px] text-sm bg-[var(--chat-card)] border-[var(--chat-border)] text-[var(--chat-text)]"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => { setAdding(false); setNewContent(''); setNewStatus('active'); }}>Cancel</Button>
            <Button size="sm" onClick={handleAdd} disabled={saving || !newContent.trim()}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      )}

      {memory.length === 0 && !adding && (
        <div className="text-center py-8 text-[var(--chat-muted)] text-sm border border-dashed border-[var(--chat-border)] rounded-lg">
          No memory items yet. Store key decisions, people, preferences, and context.
        </div>
      )}

      {memory.length > 0 && filteredMemory.length === 0 && (
        <div className="text-center py-8 text-[var(--chat-muted)] text-sm border border-dashed border-[var(--chat-border)] rounded-lg">
          No memory items match this filter.
        </div>
      )}

      {CATEGORIES.map(cat => {
        const items = grouped[cat.value];
        if (!items?.length) return null;
        return (
          <div key={cat.value} className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-xs ${cat.color}`}>{cat.label}</Badge>
              <span className="text-xs text-[var(--chat-muted)]">{items.length}</span>
            </div>
            {items.map(item => {
              const status = item.status ?? 'active';
              return (
                <div key={item.id} className="group relative p-3 rounded-lg bg-[var(--chat-bg)] border border-[var(--chat-border)]">
                  {editingId === item.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        autoFocus
                        className="min-h-[60px] text-sm bg-[var(--chat-card)] border-[var(--chat-border)] text-[var(--chat-text)]"
                      />
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditingId(null)}><X className="h-3 w-3" /></Button>
                        <Button size="sm" className="h-6 w-6 p-0" onClick={() => handleSaveEdit(item.id)}><Check className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase tracking-wide text-[var(--chat-muted)]">{categoryLabel(item.category)}</span>
                        {status !== 'active' && (
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 capitalize ${STATUS_COLORS[status] ?? STATUS_COLORS.archived}`}>
                            {status}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-[var(--chat-text)] pr-24">{item.content}</p>
                      {status === 'suggested' && (
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" className="h-7 text-xs" onClick={() => handleStatusChange(item.id, 'active')}>Approve</Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleStatusChange(item.id, 'archived')}>Reject</Button>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-[var(--chat-muted)]"
                          onClick={() => { setEditingId(item.id); setEditContent(item.content); }}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400" onClick={() => onDelete(item.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default FolderMemory;
