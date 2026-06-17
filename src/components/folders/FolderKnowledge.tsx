import React, { useState } from 'react';
import { Trash2, CheckCircle, Clock } from 'lucide-react';
import { marked } from 'marked';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type FolderKnowledgeItem } from '@/hooks/supabase/useFolderWorkspace';
import { sanitizeMarkdown } from '@/utils/sanitize';

const KNOWLEDGE_TYPES = ['note', 'decision', 'task', 'faq', 'memory', 'approved_knowledge', 'reusable_prompt'];

const TYPE_COLORS: Record<string, string> = {
  note: 'bg-gray-500/10 text-[var(--chat-muted)] border-gray-500/20',
  decision: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  task: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  faq: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  memory: 'bg-green-500/10 text-green-400 border-green-500/20',
  approved_knowledge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  reusable_prompt: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
};

interface Props {
  knowledge: FolderKnowledgeItem[];
  onDelete: (id: string) => Promise<void>;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
}

const FolderKnowledge: React.FC<Props> = ({ knowledge, onDelete, onUpdateStatus }) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filtered = knowledge.filter(k => {
    if (filterType !== 'all' && k.type !== filterType) return false;
    if (filterStatus !== 'all' && k.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="h-8 w-40 text-xs bg-[var(--chat-bg)] border-[var(--chat-border)]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent className="bg-[var(--chat-card)] border-[var(--chat-border)]">
            <SelectItem value="all" className="text-xs">All types</SelectItem>
            {KNOWLEDGE_TYPES.map(t => (
              <SelectItem key={t} value={t} className="text-xs">{t.replace('_', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 w-32 text-xs bg-[var(--chat-bg)] border-[var(--chat-border)]">
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent className="bg-[var(--chat-card)] border-[var(--chat-border)]">
            <SelectItem value="all" className="text-xs">All status</SelectItem>
            <SelectItem value="draft" className="text-xs">Draft</SelectItem>
            <SelectItem value="approved" className="text-xs">Approved</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-[var(--chat-muted)] ml-auto">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-[var(--chat-muted)] text-sm border border-dashed border-[var(--chat-border)] rounded-lg">
          No knowledge items yet. Use "Promote to Project Knowledge Base" from any chat to save useful outputs here.
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(item => (
          <div key={item.id} className="group p-3 rounded-lg bg-[var(--chat-bg)] border border-[var(--chat-border)] space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-xs ${TYPE_COLORS[item.type] ?? ''}`}>
                {item.type.replace('_', ' ')}
              </Badge>
              <button
                onClick={() => onUpdateStatus(item.id, item.status === 'approved' ? 'draft' : 'approved')}
                className="flex items-center gap-1 text-xs text-[var(--chat-muted)] hover:text-[var(--chat-text)]"
              >
                {item.status === 'approved'
                  ? <><CheckCircle className="h-3 w-3 text-emerald-400" /> Approved</>
                  : <><Clock className="h-3 w-3" /> Draft</>
                }
              </button>
              {item.tags?.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {item.tags.map(tag => (
                    <span key={tag} className="text-xs bg-[var(--chat-card)] px-1.5 py-0.5 rounded text-[var(--chat-muted)]">#{tag}</span>
                  ))}
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 ml-auto opacity-0 group-hover:opacity-100 text-red-400"
                onClick={() => onDelete(item.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <div
              className="prose prose-sm max-w-none text-[var(--chat-text)] [&_*]:text-[var(--chat-text)]"
              dangerouslySetInnerHTML={{
                __html: sanitizeMarkdown(marked.parse(item.content || '', { async: false }) as string),
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default FolderKnowledge;
