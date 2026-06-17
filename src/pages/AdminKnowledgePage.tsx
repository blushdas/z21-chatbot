import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import BackToAdminButton from '@/components/admin/BackToAdminButton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  Search,
  Upload,
  Eraser,
  Sparkles,
  Loader2,
  PlusCircle,
  RefreshCw
} from 'lucide-react';
import KnowledgeTable from '@/components/admin/knowledge/KnowledgeTable';
import KnowledgeFilters from '@/components/admin/knowledge/KnowledgeFilters';
import PineconeStatsCards from '@/components/admin/knowledge/PineconeStatsCards';
import ImportCSVModal from '@/components/admin/knowledge/ImportCSVModal';
import AddKnowledgeModal from '@/components/admin/knowledge/AddKnowledgeModal';
import EditKnowledgeModal, { KnowledgeSource } from '@/components/admin/knowledge/EditKnowledgeModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { toastError } from '@/utils/toastError';

export interface PineconeDocument {
  id: string;
  title: string;
  namespace: string;
  namespaceLabel: string;
  url: string | null;
  domain: string | null;
  subdomain: string | null;
  category: string | null;
  documentType: string | null;
  summary: string | null;
  tags: string[];
  excerpt: string;
  isEnriched: boolean;
}

interface StreamProgress {
  status: string;
  statusLog: string[];
  namespaceLogs: { namespace: string; vectorsScanned: number; uniqueDocuments: number }[];
}

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const AdminKnowledgePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState<KnowledgeSource | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichProgress, setEnrichProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [filters, setFilters] = useState({
    namespace: '',
    domain: '',
  });
  const queryClient = useQueryClient();

  // Document type → namespace label mapping
  const DOC_TYPE_TO_LABEL: Record<string, string> = {
    'project_smart_article': 'Project SMART Article',
    'Article': 'Project SMART Article',
    'learning_time_transcript': 'Learning Time Transcript',
    'Transcript': 'Learning Time Transcript',
    'learning_time_transcript_main': 'Learning Time (Main)',
    'daryle_archives': "Daryle's Archives",
  };

  // Primary state
  const [documents, setDocuments] = useState<PineconeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [streamProgress, setStreamProgress] = useState<StreamProgress>({ status: '', statusLog: [], namespaceLogs: [] });
  const [isPineconeScanning, setIsPineconeScanning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // DB-first: load all knowledge_sources as the primary document list
  const loadFromDatabase = useCallback(async () => {
    setIsLoading(true);
    setStreamProgress({ status: 'Loading from database…', statusLog: [], namespaceLogs: [] });

    try {
      const { data, error } = await supabase
        .from('knowledge_sources')
        .select('*')
        .eq('status', 'processed')
        .order('original_title', { ascending: true });

      if (error) throw error;

      const dbDocs: PineconeDocument[] = (data || []).map((row) => {
        const label = DOC_TYPE_TO_LABEL[row.document_type] || row.document_type;
        return {
          id: row.id,
          title: row.original_title,
          namespace: row.document_type,
          namespaceLabel: label,
          url: row.source_url,
          domain: row.domain,
          subdomain: row.subdomain,
          category: row.category,
          documentType: row.document_type,
          summary: row.summary,
          tags: row.tags ?? [],
          excerpt: row.summary || '',
          isEnriched: !!(row.domain || row.category || row.subdomain),
        };
      });

      setDocuments(dbDocs);
      const enriched = dbDocs.filter(d => d.isEnriched).length;
      setStreamProgress({
        status: `${dbDocs.length} source documents (${enriched} enriched)`,
        statusLog: [],
        namespaceLogs: [],
      });
    } catch (err) {
      toastError(err, 'Error loading documents');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Pinecone supplement: discover docs NOT already in the DB
  const scanPineconeForNew = useCallback(async () => {
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setIsPineconeScanning(true);
    setStreamProgress({ status: 'Scanning Pinecone for new documents…', statusLog: ['Starting Pinecone discovery scan…'], namespaceLogs: [] });

    const discoveredDocs: PineconeDocument[] = [];

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Session expired');

      const response = await fetch(
        `https://rptccafbujxprahkstmp.supabase.co/functions/v1/list-pinecone-documents`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          signal: abort.signal,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to scan Pinecone');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      // Build a set of existing DB titles for dedup
      const existingTitles = new Set(documents.map(d => d.title.toLowerCase().trim()));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith('data: ') && currentEvent) {
            try {
              const data = JSON.parse(line.slice(6));

              if (currentEvent === 'status') {
                setStreamProgress(prev => ({ ...prev, status: data.message, statusLog: [...prev.statusLog, data.message] }));
              } else if (currentEvent === 'progress') {
                setStreamProgress(prev => {
                  const logs = [...prev.namespaceLogs];
                  const idx = logs.findIndex(l => l.namespace === data.namespace);
                  const entry = { namespace: data.namespace, vectorsScanned: data.vectorsScanned, uniqueDocuments: data.uniqueDocuments };
                  if (idx >= 0) logs[idx] = entry; else logs.push(entry);
                  return { ...prev, namespaceLogs: logs };
                });
              } else if (currentEvent === 'namespace_complete') {
                const msg = `✅ ${data.namespace}: ${data.vectorsScanned} vectors → ${data.uniqueDocuments} unique docs`;
                setStreamProgress(prev => {
                  const logs = [...prev.namespaceLogs];
                  const idx = logs.findIndex(l => l.namespace === data.namespace);
                  const entry = { namespace: data.namespace, vectorsScanned: data.vectorsScanned, uniqueDocuments: data.uniqueDocuments };
                  if (idx >= 0) logs[idx] = entry; else logs.push(entry);
                  return { ...prev, status: msg, statusLog: [...prev.statusLog, msg], namespaceLogs: logs };
                });
              } else if (currentEvent === 'documents') {
                const newDocs = (data.documents as PineconeDocument[]).filter(
                  d => !existingTitles.has(d.title.toLowerCase().trim())
                );
                if (newDocs.length > 0) {
                  const msg = `Found ${newDocs.length} new docs in ${data.namespace}`;
                  setStreamProgress(prev => ({ ...prev, statusLog: [...prev.statusLog, msg] }));
                }
                discoveredDocs.push(...newDocs);
              } else if (currentEvent === 'complete') {
                if (discoveredDocs.length > 0) {
                  setDocuments(prev => [...prev, ...discoveredDocs].sort((a, b) => a.title.localeCompare(b.title)));
                }
                const finalMsg = discoveredDocs.length > 0
                  ? `Scan complete — found ${discoveredDocs.length} new documents not in the database`
                  : 'Scan complete — no new documents found outside the database';
                setStreamProgress(prev => ({
                  ...prev,
                  status: finalMsg,
                  statusLog: [...prev.statusLog, finalMsg],
                }));
              } else if (currentEvent === 'error') {
                throw new Error(data.error);
              }
            } catch {
              // Skip malformed JSON
            }
            currentEvent = '';
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return;
      toastError(err, 'Pinecone scan failed');
    } finally {
      setIsPineconeScanning(false);
    }
  }, [documents]);

  // Load from DB on mount
  useEffect(() => {
    loadFromDatabase();
    return () => { abortRef.current?.abort(); };
  }, [loadFromDatabase]);

  // Reset page when filters/search change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filters.namespace, filters.domain]);

  const handleClearMetadata = async () => {
    setIsClearing(true);
    try {
      const { data, error } = await supabase
        .from('knowledge_sources')
        .update({
          domain: null,
          category: null,
          subdomain: null,
          tags: null,
          bullet_points: null,
          pinecone_title: null
        })
        .neq('id', '') // Match all records
        .select('id');

      if (error) throw error;

      toast({
        title: 'Metadata cleared',
        description: `Cleared metadata for ${data?.length || 0} records (all document types).`,
      });

      loadFromDatabase();
    } catch (error) {
      toastError('Failed to clear metadata.', 'Error');
    } finally {
      setIsClearing(false);
    }
  };

  const handleEnrichWithAI = async () => {
    // Get unmatched documents (those without domain/category)
    const unmatchedDocs = documents.filter(doc => !doc.domain && !doc.category);
    
    if (unmatchedDocs.length === 0) {
      toast({
        title: 'All documents matched',
        description: 'No unmatched documents to process.',
      });
      return;
    }

    setIsEnriching(true);
    setEnrichProgress(0);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Not authenticated');
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Session expired');
      }

      // Group unmatched documents by namespace for targeted matching
      const unmatchedByNamespace = new Map<string, PineconeDocument[]>();
      for (const doc of unmatchedDocs) {
        const ns = doc.namespace || 'unknown';
        if (!unmatchedByNamespace.has(ns)) {
          unmatchedByNamespace.set(ns, []);
        }
        unmatchedByNamespace.get(ns)!.push(doc);
      }

      console.log(`Enriching ${unmatchedDocs.length} docs across ${unmatchedByNamespace.size} namespaces`);

      let totalMatched = 0;
      let totalProcessed = 0;
      const batchSize = 50;

      // Process each namespace separately for accurate document_type filtering
      for (const [namespace, nsDocs] of unmatchedByNamespace) {
        console.log(`Processing namespace: ${namespace} (${nsDocs.length} docs)`);
        
        // Split namespace docs into batches
        for (let i = 0; i < nsDocs.length; i += batchSize) {
          const batch = nsDocs.slice(i, i + batchSize);
          const titles = batch.map(doc => doc.title);

          const response = await fetch(
            `https://rptccafbujxprahkstmp.supabase.co/functions/v1/llm-match-knowledge`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                pinecone_titles: titles,
                namespace // Pass namespace for document_type filtering
              }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 429) {
              toastError('Please wait a moment and try again.', 'Rate limit exceeded');
              break;
            }
            throw new Error(errorData.error || 'Failed to match documents');
          }

          const data = await response.json();
          
          // Update knowledge_sources with matched data
          for (const match of data.matches || []) {
            if (match.knowledge_source_id && match.confidence >= 0.7) {
              // Find the Pinecone doc that matches this title
              const pineconeDoc = batch.find(d => d.title === match.pinecone_title);
              if (pineconeDoc) {
                // Update the knowledge_source record with the pinecone_title
                const { error: updateError } = await supabase
                  .from('knowledge_sources')
                  .update({ pinecone_title: match.pinecone_title })
                  .eq('id', match.knowledge_source_id);
                
                if (!updateError) {
                  totalMatched++;
                }
              }
            }
          }

          totalProcessed += batch.length;
          setEnrichProgress(Math.round((totalProcessed / unmatchedDocs.length) * 100));
        }
      }

      toast({
        title: 'AI Enrichment Complete',
        description: `Matched ${totalMatched} of ${unmatchedDocs.length} documents across ${unmatchedByNamespace.size} namespaces.`,
      });

      loadFromDatabase();
    } catch (error) {
      toastError(error, 'Error', 'Failed to enrich documents.');
    } finally {
      setIsEnriching(false);
      setEnrichProgress(0);
    }
  };

  // Type-bridge: fetch all knowledge_sources keyed by normalized original_title
  const { data: knowledgeSourcesMap } = useQuery({
    queryKey: ['knowledge-sources-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_sources')
        .select('id, original_title, document_type, source_url, domain, subdomain, category, tags, summary, bullet_points, file_date, box_file_id, status, pinecone_ids, created_at, created_by, updated_at, pinecone_title');
      if (error) throw error;
      const map = new Map<string, KnowledgeSource>();
      for (const row of data || []) {
        const source: KnowledgeSource = {
          ...row,
          tags: row.tags ?? [],
          bullet_points: row.bullet_points ?? [],
          pinecone_ids: row.pinecone_ids ?? [],
        } as KnowledgeSource;
        // Primary key: normalized original_title
        const key = (row.original_title || '').toLowerCase().trim();
        map.set(key, source);
        // Fallback key: extract the clean title from pinecone_title filename prefix
        // e.g. "2024-03-08_Leadership_My Title.docx" → "my title"
        if (row.pinecone_title) {
          const raw = row.pinecone_title.replace(/\.[^/.]+$/, ''); // strip extension
          const parts = raw.split('_');
          // filename pattern: YYYY-MM-DD_Keyword_Actual Title — strip first two segments
          const cleanTitle = parts.length >= 3
            ? parts.slice(2).join('_').toLowerCase().trim()
            : raw.toLowerCase().trim();
          if (cleanTitle && !map.has(cleanTitle)) {
            map.set(cleanTitle, source);
          }
        }
      }
      return map;
    },
    staleTime: 2 * 60 * 1000,
  });

  const handleEditClick = (doc: PineconeDocument) => {
    const key = doc.title.toLowerCase().trim();
    const source = knowledgeSourcesMap?.get(key) ?? null;
    if (!source) {
      toast({
        title: 'No DB record found',
        description: 'This Pinecone document has no knowledge_sources entry. Use "Add Knowledge" to create one.',
        variant: 'destructive',
      });
      return;
    }
    setEditTarget(source);
  };

  // Documents loaded from DB (see loadFromDatabase)

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.domain?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesNamespace = !filters.namespace || doc.namespaceLabel === filters.namespace;
    const matchesDomain = !filters.domain || doc.domain === filters.domain;

    return matchesSearch && matchesNamespace && matchesDomain;
  });

  // Pagination
  const filteredTotal = filteredDocuments.length;
  const totalPages = Math.max(1, Math.ceil(filteredTotal / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedDocuments = filteredDocuments.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Get unique values for filter dropdowns
  const namespaceLabels = [...new Set(documents.map(d => d.namespaceLabel).filter(Boolean))];
  const domains = [...new Set(documents.map(d => d.domain).filter(Boolean))] as string[];

  return (
    <AdminLayout>
      <BackToAdminButton />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <Database className="h-7 w-7 text-accent" />
              Knowledge Base
            </h1>
            <p className="text-muted-foreground mt-1">
              Browse and manage curated knowledge sources
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => loadFromDatabase()}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Loading…' : 'Refresh'}
            </Button>
            <Button
              onClick={scanPineconeForNew}
              disabled={isPineconeScanning || isLoading}
              variant="outline"
              size="sm"
            >
              <Search className={`h-4 w-4 mr-2 ${isPineconeScanning ? 'animate-pulse' : ''}`} />
              {isPineconeScanning ? 'Scanning…' : 'Discover New (Pinecone)'}
            </Button>
            <Button 
              onClick={handleEnrichWithAI} 
              disabled={isEnriching}
              variant="outline"
              className="border-accent text-accent hover:bg-accent/10"
            >
              {isEnriching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enriching... {enrichProgress}%
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Enrich with AI
                </>
              )}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="border-warning text-warning hover:bg-warning/10">
                  <Eraser className="h-4 w-4 mr-2" />
                  Clear Metadata (Debug)
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear Metadata?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset domain, category, subdomain, tags, bullet_points, and pinecone_title for all Learning Time transcripts. The records themselves will remain.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearMetadata} disabled={isClearing}>
                    {isClearing ? 'Clearing...' : 'Clear Metadata'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button onClick={() => setShowAddModal(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Knowledge
            </Button>
            <Button onClick={() => setShowImportModal(true)} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
          </div>
        </div>

        {/* Modals */}
        <ImportCSVModal
          open={showImportModal}
          onOpenChange={setShowImportModal}
          onImportComplete={() => loadFromDatabase()}
        />
        <AddKnowledgeModal
          open={showAddModal}
          onOpenChange={(open) => {
            setShowAddModal(open);
            if (!open) loadFromDatabase();
          }}
        />
        {editTarget && (
          <EditKnowledgeModal
            open={!!editTarget}
            onOpenChange={(open) => {
              if (!open) {
                setEditTarget(null);
                loadFromDatabase();
              }
            }}
            source={editTarget}
          />
        )}

        {/* Pinecone Discover Scan Log Panel */}
        {isPineconeScanning && (
          <Card className="mb-6 border-accent/30 bg-accent/5">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
                <span className="text-sm font-medium text-foreground">Pinecone Discovery Scan</span>
                <span className="text-xs text-muted-foreground ml-auto">{streamProgress.statusLog.length} events</span>
              </div>
              <div
                className="bg-background/80 rounded-md border p-3 max-h-52 overflow-y-auto font-mono text-xs space-y-0.5"
                ref={(el) => { if (el) el.scrollTop = el.scrollHeight; }}
              >
                {streamProgress.statusLog.map((msg, i) => (
                  <div key={i} className={msg.startsWith('✅') ? 'text-green-500' : msg.startsWith('Found') ? 'text-yellow-500' : 'text-muted-foreground'}>
                    <span className="text-muted-foreground/50 mr-2 select-none">{String(i + 1).padStart(2, '0')}</span>
                    {msg}
                  </div>
                ))}
                {streamProgress.statusLog.length === 0 && (
                  <div className="text-muted-foreground/60 italic">Connecting to Pinecone…</div>
                )}
              </div>
              {/* Namespace progress badges */}
              {streamProgress.namespaceLogs.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {streamProgress.namespaceLogs.map((log, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-xs bg-background border rounded-full px-2.5 py-0.5">
                      <span className="text-accent font-medium">{log.namespace}</span>
                      <span className="text-muted-foreground">{log.vectorsScanned}v → {log.uniqueDocuments}d</span>
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pinecone Vector Index Stats */}
        <div className="mb-8">
          <PineconeStatsCards />
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, excerpt, or domain..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <KnowledgeFilters
                filters={filters}
                onFiltersChange={setFilters}
                namespaceLabels={namespaceLabels}
                domains={domains}
              />
            </div>
            {(searchTerm || Object.values(filters).some(Boolean)) && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Showing {filteredDocuments.length} of {documents.length} documents
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setFilters({ namespace: '', domain: '' });
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="pt-6">
            <KnowledgeTable
              documents={paginatedDocuments}
              isLoading={isLoading}
              onEditClick={handleEditClick}
              streamProgress={streamProgress}
              totalCount={filteredTotal}
              currentPage={safePage}
              pageSize={pageSize}
              onPageChange={(page) => setCurrentPage(page)}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminKnowledgePage;
