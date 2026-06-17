import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ExternalLink, 
  FileText,
  Loader2,
  CheckCircle2,
  Tag,
  Pencil,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { PineconeDocument } from '@/pages/AdminKnowledgePage';

interface NamespaceLog {
  namespace: string;
  vectorsScanned: number;
  uniqueDocuments: number;
}

interface StreamProgress {
  status: string;
  namespaceLogs: NamespaceLog[];
}

interface KnowledgeTableProps {
  documents: PineconeDocument[];
  isLoading: boolean;
  onEditClick?: (doc: PineconeDocument) => void;
  streamProgress?: StreamProgress;
  totalCount?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

const getNamespaceBadgeColor = (label: string) => {
  switch (label) {
    case 'Project SMART Article':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
    case 'Learning Time Transcript':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    case "Daryle's Archives":
      return 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200';
    case 'Learning Time (Main)':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getDomainColor = (domain: string | null) => {
  if (!domain) return 'bg-muted text-muted-foreground';
  
  const colors: Record<string, string> = {
    'Leadership': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'Communication': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'Culture': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'Strategy': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    'Personal Growth': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    'Team Dynamics': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    'Chemistry': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    'Character': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    'Competence': 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
  };
  
  return colors[domain] || 'bg-muted text-muted-foreground';
};

const truncate = (text: string | null, maxLength: number) => {
  if (!text) return '—';
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
};

const KnowledgeTable: React.FC<KnowledgeTableProps> = ({
  documents,
  isLoading,
  onEditClick,
  streamProgress,
  totalCount,
  currentPage = 1,
  pageSize = 50,
  onPageChange,
  onPageSizeChange,
}) => {
  const enrichedCount = documents.filter(d => d.isEnriched).length;
  const total = totalCount ?? documents.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        {streamProgress ? (
          <div className="w-full max-w-lg space-y-3">
            <p className="text-foreground font-medium text-center">{streamProgress.status}</p>
            {streamProgress.namespaceLogs.length > 0 && (
              <div className="space-y-2">
                {streamProgress.namespaceLogs.map((log) => (
                  <div key={log.namespace} className="flex items-center justify-between text-sm px-3 py-2 rounded-md bg-muted/50">
                    <Badge variant="outline" className={`${getNamespaceBadgeColor(log.namespace)} text-xs`}>
                      {log.namespace}
                    </Badge>
                    <span className="text-muted-foreground font-mono text-xs">
                      {log.vectorsScanned.toLocaleString()} vectors → {log.uniqueDocuments.toLocaleString()} docs
                    </span>
                  </div>
                ))}
              </div>
            )}
            {documents.length > 0 && (
              <p className="text-xs text-muted-foreground text-center">
                {documents.length.toLocaleString()} unique documents loaded so far…
              </p>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">Loading documents from Pinecone...</span>
        )}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground">No documents found</h3>
        <p className="text-muted-foreground mt-1">
          Try adjusting your search or filters.
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">View</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Source Type</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="max-w-[300px]">Summary/Excerpt</TableHead>
              <TableHead className="w-[60px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id} className={doc.isEnriched ? 'bg-green-50/30 dark:bg-green-950/10' : ''}>
                <TableCell>
                  {doc.url ? (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="font-medium max-w-[250px]">
                  <div className="flex items-start gap-2">
                    <span title={doc.title}>
                      {truncate(doc.title, 50)}
                    </span>
                    {doc.isEnriched && (
                      <Tooltip>
                        <TooltipTrigger>
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Curated metadata from Box Indexing</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  {doc.subdomain && (
                    <span className="block text-xs text-muted-foreground mt-0.5">
                      {doc.subdomain}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge className={`${getNamespaceBadgeColor(doc.namespaceLabel)} justify-center text-center`} variant="outline">
                      {doc.namespaceLabel}
                    </Badge>
                    {doc.documentType && doc.documentType !== doc.namespaceLabel && (
                      <span className="text-xs text-muted-foreground">{doc.documentType}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {doc.domain ? (
                    <Badge className={getDomainColor(doc.domain)} variant="outline">
                      {doc.domain}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {doc.category ? (
                    <span className="text-sm">{doc.category}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {doc.tags && doc.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1 max-w-[150px]">
                      {doc.tags.slice(0, 3).map((tag, idx) => (
                        <Badge 
                          key={idx} 
                          variant="secondary" 
                          className="text-xs px-1.5 py-0"
                        >
                          <Tag className="h-2.5 w-2.5 mr-0.5" />
                          {tag}
                        </Badge>
                      ))}
                      {doc.tags.length > 3 && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="secondary" className="text-xs px-1.5 py-0">
                              +{doc.tags.length - 3}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{doc.tags.slice(3).join(', ')}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="max-w-[300px]">
                  <span className="text-sm text-muted-foreground" title={doc.summary || doc.excerpt}>
                    {truncate(doc.summary || doc.excerpt, 80)}
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEditClick?.(doc)}
                    title="Edit knowledge source"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* Pagination controls */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, total)} of {total} documents
            {enrichedCount > 0 && (
              <span className="ml-2">
                (<CheckCircle2 className="h-3.5 w-3.5 inline text-green-600" /> {enrichedCount} curated)
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {onPageSizeChange && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Per page:</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => onPageSizeChange(Number(v))}
                >
                  <SelectTrigger className="w-[70px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[25, 50, 100].map(size => (
                      <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {onPageChange && totalPages > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage <= 1}
                  onClick={() => onPageChange(currentPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage >= totalPages}
                  onClick={() => onPageChange(currentPage + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default KnowledgeTable;
