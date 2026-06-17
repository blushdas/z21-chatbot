import React, { useState } from 'react';
import { Plus, Pencil, Trash2, RotateCcw, Check, X, Tag } from 'lucide-react';
import { useUserChatCategories, ChatCategory } from '@/hooks/useUserChatCategories';
import { toast } from 'sonner';

const ChatCategoriesManager: React.FC = () => {
  const {
    categories, loading, hasCustom,
    addCategory, renameCategory, deleteCategory, resetToDefaults,
  } = useUserChatCategories();

  const [newLabel, setNewLabel] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    setBusy(true);
    try {
      await addCategory(newLabel);
      setNewLabel('');
      toast.success('Category added');
    } catch { toast.error('Could not add category'); }
    finally { setBusy(false); }
  };

  const handleSaveRename = async (cat: ChatCategory) => {
    if (!editDraft.trim()) return;
    setBusy(true);
    try {
      await renameCategory(cat, editDraft);
      setEditing(null);
      setEditDraft('');
      toast.success('Category renamed');
    } catch { toast.error('Could not rename'); }
    finally { setBusy(false); }
  };

  const handleDelete = async (cat: ChatCategory) => {
    if (!confirm(`Delete category "${cat.label}"? Chats already tagged with it will keep the tag but it will no longer appear in pickers.`)) return;
    setBusy(true);
    try {
      await deleteCategory(cat);
      toast.success('Category deleted');
    } catch { toast.error('Could not delete'); }
    finally { setBusy(false); }
  };

  const handleReset = async () => {
    if (!confirm('Reset to the default categories? Your custom categories will be removed.')) return;
    setBusy(true);
    try {
      await resetToDefaults();
      toast.success('Reset to defaults');
    } catch { toast.error('Could not reset'); }
    finally { setBusy(false); }
  };

  return (
    <div className="rounded-2xl bg-[var(--chat-card)] border border-[var(--chat-border)] p-5">
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--chat-text)]">
          <Tag size={14} className="text-brand-yellow" />
          Chat Categories
        </div>
        {hasCustom && (
          <button
            onClick={handleReset}
            disabled={busy}
            className="flex items-center gap-1 text-xs text-[var(--chat-muted)] hover:text-[var(--chat-text)] transition-colors disabled:opacity-50"
          >
            <RotateCcw size={11} /> Reset to defaults
          </button>
        )}
      </div>
      <p className="text-xs text-[var(--chat-muted)] mb-4">
        Customize the categories that appear when tagging your chats. Changes apply only to your account.
      </p>

      {/* Add new */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          placeholder="New category name…"
          maxLength={40}
          className="flex-1 px-3 py-2 rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg)] text-sm text-[var(--chat-text)] placeholder:text-[var(--chat-muted)] focus:outline-none focus:border-brand-yellow"
        />
        <button
          onClick={handleAdd}
          disabled={busy || !newLabel.trim()}
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-brand-yellow text-brand-blue text-sm font-medium hover:bg-brand-yellow/90 transition-colors disabled:opacity-50"
        >
          <Plus size={14} /> Add
        </button>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-sm text-[var(--chat-muted)]">Loading…</p>
      ) : categories.length === 0 ? (
        <p className="text-sm text-[var(--chat-muted)]">No categories yet. Add one above.</p>
      ) : (
        <ul className="space-y-1.5">
          {categories.map((cat) => (
            <li
              key={cat.value}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg)]"
            >
              {editing === cat.value ? (
                <>
                  <input
                    autoFocus
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveRename(cat);
                      if (e.key === 'Escape') { setEditing(null); setEditDraft(''); }
                    }}
                    maxLength={40}
                    className="flex-1 px-2 py-1 rounded-md border border-[var(--chat-border)] bg-[var(--chat-card)] text-sm text-[var(--chat-text)] focus:outline-none focus:border-brand-yellow"
                  />
                  <button
                    onClick={() => handleSaveRename(cat)}
                    disabled={busy}
                    className="p-1.5 rounded-md text-emerald-500 hover:bg-[var(--ui-bg-hover)] disabled:opacity-50"
                    title="Save"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => { setEditing(null); setEditDraft(''); }}
                    className="p-1.5 rounded-md text-[var(--chat-muted)] hover:bg-[var(--ui-bg-hover)]"
                    title="Cancel"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-[var(--chat-text)] truncate">{cat.label}</span>
                  <span className="text-[10px] uppercase tracking-widest text-[var(--chat-muted)] font-mono">{cat.value}</span>
                  <button
                    onClick={() => { setEditing(cat.value); setEditDraft(cat.label); }}
                    className="p-1.5 rounded-md text-[var(--chat-muted)] hover:text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)]"
                    title="Rename"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    disabled={busy}
                    className="p-1.5 rounded-md text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ChatCategoriesManager;