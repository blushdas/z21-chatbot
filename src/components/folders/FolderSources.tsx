import React, { useMemo, useRef, useState } from 'react';
import { Upload, Trash2, ExternalLink, FileText, Link as LinkIcon, Mail, File, Loader2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type FolderSource } from '@/hooks/supabase/useFolderWorkspace';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/SupabaseAuthContext';
import { sanitizeFilename } from '@/hooks/useChatFileUpload';
import { toast } from 'sonner';

const SOURCE_TYPES = [
  { value: 'link', label: 'Link / URL', icon: LinkIcon },
  { value: 'note', label: 'Note', icon: FileText },
  { value: 'file', label: 'File Upload', icon: File },
  { value: 'transcript', label: 'Transcript', icon: FileText },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'box', label: 'Box Link', icon: LinkIcon },
  { value: 'monday', label: 'Monday.com', icon: LinkIcon },
];

const STATUS_OPTIONS = [
  { value: 'uploaded', label: 'Uploaded' },
  { value: 'processing', label: 'Processing' },
  { value: 'ingested', label: 'Ingested' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'approved', label: 'Approved' },
  { value: 'needs_review', label: 'Needs Review' },
  { value: 'error', label: 'Error' },
  { value: 'archived', label: 'Archived' },
  { value: 'do_not_use', label: 'Do Not Use' },
];

const STATUS_COLORS: Record<string, string> = {
  uploaded: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  processing: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  ingested: 'bg-green-500/10 text-green-400 border-green-500/20',
  reviewed: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  needs_review: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
  archived: 'bg-gray-500/10 text-[var(--chat-muted)] border-gray-500/20',
  do_not_use: 'bg-red-500/10 text-red-400 border-red-500/20',
};

function SourceIcon({ type }: { type: string }) {
  const found = SOURCE_TYPES.find(t => t.value === type);
  const Icon = found?.icon ?? FileText;
  return <Icon className="h-3.5 w-3.5" />;
}

function sourceTypeLabel(type: string) {
  return SOURCE_TYPES.find(option => option.value === type)?.label ?? type.replace('_', ' ');
}

interface Props {
  folderId: string;
  sources: FolderSource[];
  onAdd: (data: Partial<FolderSource> & Pick<FolderSource, 'type' | 'title'>) => Promise<unknown>;
  onDelete: (id: string) => Promise<void>;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
}

const FolderSources: React.FC<Props> = ({ folderId, sources, onAdd, onDelete, onUpdateStatus }) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  type UploadStage = 'uploading' | 'processing' | 'ingested' | 'error';
  interface UploadProgressItem {
    key: string;
    name: string;
    stage: UploadStage;
    pct: number;
    sourceId?: string;
    message?: string;
  }
  const [progressItems, setProgressItems] = useState<UploadProgressItem[]>([]);
  const updateProgress = (key: string, patch: Partial<UploadProgressItem>) =>
    setProgressItems(prev => prev.map(p => (p.key === key ? { ...p, ...patch } : p)));
  const dismissProgress = (key: string) =>
    setProgressItems(prev => prev.filter(p => p.key !== key));

  const filteredSources = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sources.filter(source => {
      const matchesType = typeFilter === 'all' || source.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || source.status === statusFilter;
      const matchesSearch = !query || source.title.toLowerCase().includes(query);
      return matchesType && matchesStatus && matchesSearch;
    });
  }, [sources, typeFilter, statusFilter, search]);

  const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

  // Accepted extensions match the parser support in supabase/functions/_shared/fileParsers.ts.
  const ACCEPTED_EXTS = new Set(['pdf', 'docx', 'txt', 'md', 'markdown', 'rtf', 'csv', 'json', 'log']);
  // Known-but-unsupported formats — explicitly tell the user instead of failing silently.
  const REJECT_HINTS: Record<string, string> = {
    doc: 'Word .doc isn\'t supported — save as .docx and re-upload.',
    ppt: 'PowerPoint .ppt isn\'t supported — save as .pdf and re-upload.',
    pptx: 'PowerPoint .pptx isn\'t supported yet — export to PDF and re-upload.',
    xls: 'Excel .xls isn\'t supported — save as .csv or .xlsx (then export to .csv).',
    xlsx: 'Excel .xlsx isn\'t supported yet — export the sheet to .csv and re-upload.',
    pages: 'Apple Pages isn\'t supported — export to .pdf or .docx.',
    numbers: 'Apple Numbers isn\'t supported — export to .csv.',
    key: 'Apple Keynote isn\'t supported — export to .pdf.',
  };
  const getExt = (name: string) => (name.toLowerCase().split('.').pop() ?? '');

  // Read text content for plain-text files so the AI has the actual body,
  // not just the filename. Binary files (PDF/DOCX) keep content=null and
  // get referenced by title + signed URL in the project context.
  const TEXT_EXTS = /\.(txt|md|markdown|rtf|csv|json|log)$/i;
  const isTextLike = (file: File) =>
    file.type.startsWith('text/') || TEXT_EXTS.test(file.name);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!user?.id) { toast.error('Sign in to upload files'); return; }
    setUploading(true);
    let added = 0;
    for (const file of Array.from(files)) {
      const key = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setProgressItems(prev => [
        ...prev,
        { key, name: file.name, stage: 'uploading', pct: 5 },
      ]);
      try {
        if (file.size === 0) {
          updateProgress(key, { stage: 'error', pct: 100, message: 'File is empty' });
          toast.error(`${file.name} is empty`); continue;
        }
        if (file.size > MAX_SIZE) {
          updateProgress(key, { stage: 'error', pct: 100, message: 'Larger than 50 MB' });
          toast.error(`${file.name} is ${(file.size / 1024 / 1024).toFixed(1)} MB — max is 50 MB.`);
          continue;
        }
        const ext = getExt(file.name);
        if (REJECT_HINTS[ext]) {
          updateProgress(key, { stage: 'error', pct: 100, message: REJECT_HINTS[ext] });
          toast.error(`${file.name}: ${REJECT_HINTS[ext]}`); continue;
        }
        if (!ACCEPTED_EXTS.has(ext)) {
          updateProgress(key, { stage: 'error', pct: 100, message: `.${ext} not supported` });
          toast.error(`${file.name}: .${ext} isn't supported. Use PDF, DOCX, TXT, MD, RTF, CSV, or JSON.`);
          continue;
        }
        const cleanName = sanitizeFilename(file.name);
        const path = `${user.id}/folders/${folderId}/${Date.now()}-${cleanName}`;
        updateProgress(key, { stage: 'uploading', pct: 25 });
        const { error: upErr } = await supabase.storage
          .from('chat-uploads')
          .upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });
        if (upErr) {
          updateProgress(key, { stage: 'error', pct: 100, message: upErr.message });
          toast.error(`Upload failed for ${file.name}: ${upErr.message}`);
          // eslint-disable-next-line no-console
          console.error('[FolderSources] storage upload error', { file: file.name, error: upErr });
          continue;
        }
        updateProgress(key, { stage: 'uploading', pct: 55 });

        let extractedContent: string | null = null;
        if (isTextLike(file) && file.size < 2 * 1024 * 1024) {
          try {
            extractedContent = (await file.text()).slice(0, 200_000);
          } catch {
            extractedContent = null;
          }
        }

        const inserted = await onAdd({
          type: 'file',
          title: cleanName,
          url: path,
          bucket_path: path,
          mime_type: file.type || 'application/octet-stream',
          file_size: file.size,
          content: extractedContent,
          summary: null,
          tags: [],
          status: 'uploaded',
          visibility: 'project',
        }) as { id?: string } | null | undefined;
        if (inserted) {
          added += 1;
          const sourceId = inserted?.id;
          updateProgress(key, { stage: 'processing', pct: 70, sourceId });
          if (sourceId) void pollIngestion(key, sourceId);
          else updateProgress(key, { stage: 'ingested', pct: 100 });
        } else {
          updateProgress(key, { stage: 'error', pct: 100, message: 'Could not save source' });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        updateProgress(key, { stage: 'error', pct: 100, message: msg });
        toast.error(`Could not upload ${file.name}: ${msg}`);
        // eslint-disable-next-line no-console
        console.error('[FolderSources] upload exception', { file: file.name, err });
      }
    }
    setUploading(false);
    if (added > 0) toast.success(`Added ${added} file${added === 1 ? '' : 's'} to the knowledge base`);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Poll folder_sources.status until ingestion completes (or 2 min cap).
  const pollIngestion = async (key: string, sourceId: string) => {
    const start = Date.now();
    const TIMEOUT_MS = 120_000;
    let pct = 70;
    while (Date.now() - start < TIMEOUT_MS) {
      await new Promise(r => setTimeout(r, 2500));
      const { data, error } = await supabase
        .from('folder_sources')
        .select('status, processing_error')
        .eq('id', sourceId)
        .maybeSingle();
      if (error) break;
      const status = data?.status;
      if (status === 'ingested' || status === 'approved' || status === 'reviewed') {
        updateProgress(key, { stage: 'ingested', pct: 100 });
        return;
      }
      if (status === 'error') {
        updateProgress(key, { stage: 'error', pct: 100, message: data?.processing_error ?? 'Ingestion failed' });
        return;
      }
      pct = Math.min(95, pct + 3);
      updateProgress(key, { stage: 'processing', pct });
    }
    updateProgress(key, { stage: 'processing', pct: 95, message: 'Still processing — refresh in a moment.' });
  };

  const [reingestingId, setReingestingId] = useState<string | null>(null);
  const handleReingest = async (source: FolderSource) => {
    if (!user?.id) return;
    setReingestingId(source.id);
    try {
      const { error } = await supabase.functions.invoke('process-folder-source', {
        body: {
          source_id: source.id,
          folder_id: source.folder_id,
          user_id: source.user_id,
          type: source.type,
          bucket_path: source.bucket_path ?? null,
          url: source.url ?? null,
        },
      });
      if (error) {
        toast.error(`Re-ingest failed: ${error.message}`);
      } else {
        toast.success('Re-ingest started');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Re-ingest failed: ${msg}`);
    } finally {
      setReingestingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--chat-muted)]">{sources.length} source{sources.length !== 1 ? 's' : ''}</p>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.md,.markdown,.rtf,.csv,.json,.log,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,application/rtf,text/csv,application/json"
            className="hidden"
            onChange={(e) => void handleFiles(e.target.files)}
          />
          <Button
            size="sm"
            className="gap-1"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            {uploading ? 'Uploading…' : 'Upload Files'}
          </Button>
        </div>
      </div>

      {progressItems.length > 0 && (
        <div className="space-y-2 rounded-lg border border-[var(--chat-border)] bg-[var(--chat-card)] p-3">
          {progressItems.map(item => {
            const stageLabel =
              item.stage === 'uploading' ? 'Uploading…' :
              item.stage === 'processing' ? 'Processing & indexing…' :
              item.stage === 'ingested' ? 'Ingested' :
              'Error';
            const stageColor =
              item.stage === 'ingested' ? 'text-green-400' :
              item.stage === 'error' ? 'text-red-400' :
              'text-[var(--chat-muted)]';
            return (
              <div key={item.key} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    {item.stage === 'ingested' ? <CheckCircle2 className="h-3.5 w-3.5 text-green-400 flex-shrink-0" /> :
                     item.stage === 'error' ? <AlertCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" /> :
                     <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--chat-muted)] flex-shrink-0" />}
                    <span className="truncate text-[var(--chat-text)]">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={stageColor}>{stageLabel}</span>
                    {(item.stage === 'ingested' || item.stage === 'error') && (
                      <button
                        type="button"
                        onClick={() => dismissProgress(item.key)}
                        className="text-[var(--chat-muted)] hover:text-[var(--chat-text)]"
                        aria-label="Dismiss"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
                <Progress value={item.pct} className="h-1.5" />
                {item.message && (
                  <p className={`text-[11px] ${stageColor}`}>{item.message}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[160px_160px_1fr] gap-2">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-9 bg-[var(--chat-card)] border-[var(--chat-border)] text-sm">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent className="bg-[var(--chat-card)] border-[var(--chat-border)]">
            <SelectItem value="all">All types</SelectItem>
            {SOURCE_TYPES.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 bg-[var(--chat-card)] border-[var(--chat-border)] text-sm">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent className="bg-[var(--chat-card)] border-[var(--chat-border)]">
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map(status => (
              <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Search sources..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-9 bg-[var(--chat-card)] border-[var(--chat-border)] text-[var(--chat-text)]"
        />
      </div>

      {sources.length === 0 && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full text-center py-10 text-[var(--chat-muted)] text-sm border border-dashed border-[var(--chat-border)] rounded-lg hover:bg-[var(--ui-bg-hover)] transition-colors"
        >
          <Upload className="mx-auto mb-2 h-5 w-5" />
          No files yet. Click to upload PDFs, Word docs, text, or Markdown.
        </button>
      )}

      {sources.length > 0 && filteredSources.length === 0 && (
        <div className="text-center py-8 text-[var(--chat-muted)] text-sm border border-dashed border-[var(--chat-border)] rounded-lg">
          No sources match these filters.
        </div>
      )}

      <div className="space-y-2">
        {filteredSources.map(source => (
          <div key={source.id} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--chat-bg)] border border-[var(--chat-border)] group">
            <div className="text-[var(--chat-muted)]"><SourceIcon type={source.type} /></div>
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-sm font-medium text-[var(--chat-text)] truncate">{source.title}</p>
              {source.summary && <p className="text-xs text-[var(--chat-muted)] line-clamp-2">{source.summary}</p>}
              {source.url && (
                <a href={source.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-0.5 truncate">
                  {source.url} <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
                </a>
              )}
              {(source.tags ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {source.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-[10px] px-1 py-0 text-[var(--chat-muted)] border-[var(--chat-border)]">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
            <Select value={source.status} onValueChange={val => onUpdateStatus(source.id, val)}>
              <SelectTrigger className={`h-6 text-xs border rounded px-2 w-32 ${STATUS_COLORS[source.status] ?? ''}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[var(--chat-card)] border-[var(--chat-border)]">
                {STATUS_OPTIONS.map(status => (
                  <SelectItem key={status.value} value={status.value} className="text-xs">{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline" className="text-xs text-[var(--chat-muted)] border-[var(--chat-border)] capitalize">
              {sourceTypeLabel(source.type)}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-[var(--chat-muted)] hover:text-[var(--chat-text)]"
              title={source.processing_error ? `Re-ingest (last error: ${source.processing_error})` : 'Re-ingest'}
              disabled={reingestingId === source.id}
              onClick={() => void handleReingest(source)}
            >
              {reingestingId === source.id
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : <RefreshCw className="h-3 w-3" />}
            </Button>
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
