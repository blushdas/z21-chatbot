import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const CHAT_CATEGORIES = [
  { value: 'strategy', label: 'Strategy' },
  { value: 'meeting_notes', label: 'Meeting Notes' },
  { value: 'drafts', label: 'Drafts' },
  { value: 'research', label: 'Research' },
  { value: 'decisions', label: 'Decisions' },
  { value: 'open_questions', label: 'Open Questions' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'emails', label: 'Emails' },
  { value: 'proposals', label: 'Proposals' },
  { value: 'product_ideas', label: 'Product Ideas' },
  { value: 'admin_governance', label: 'Admin / Governance' },
];

interface Props {
  chatId: string;
  value: string | null;
  onChange?: (category: string | null) => void;
  compact?: boolean;
}

const ChatCategorySelect: React.FC<Props> = ({ chatId, value, onChange, compact = false }) => {
  const handleChange = async (val: string) => {
    const newVal = val === 'none' ? null : val;
    const { error } = await supabase.from('chats').update({ chat_category: newVal }).eq('id', chatId);
    if (error) { toast.error('Failed to set category'); return; }
    onChange?.(newVal);
  };

  if (compact) {
    return (
      <Select value={value ?? 'none'} onValueChange={handleChange}>
        <SelectTrigger className="h-6 text-xs border-0 bg-transparent p-0 w-auto focus:ring-0 text-[var(--chat-muted)]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent className="bg-[var(--chat-card)] border-[var(--chat-border)]">
          <SelectItem value="none" className="text-xs">No category</SelectItem>
          {CHAT_CATEGORIES.map(c => (
            <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Select value={value ?? 'none'} onValueChange={handleChange}>
      <SelectTrigger className="bg-[var(--chat-bg)] border-[var(--chat-border)] text-sm text-[var(--chat-text)]">
        <SelectValue placeholder="Set category" />
      </SelectTrigger>
      <SelectContent className="bg-[var(--chat-card)] border-[var(--chat-border)]">
        <SelectItem value="none">No category</SelectItem>
        {CHAT_CATEGORIES.map(c => (
          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ChatCategorySelect;
