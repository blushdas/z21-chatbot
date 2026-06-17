import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generalFeedbackService, GeneralFeedback } from '@/services/generalFeedbackService';
import { format } from 'date-fns';
import { Loader2, MessageSquarePlus, RefreshCw, Trash2, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { toastError } from '@/utils/toastError';

const categoryLabels: Record<string, string> = {
  feature_request: 'Feature Request',
  bug_report: 'Bug Report',
  general_suggestion: 'General Suggestion',
  compliment: 'Compliment',
  other: 'Other',
};

const categoryColors: Record<string, string> = {
  feature_request: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  bug_report: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  general_suggestion: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
  compliment: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  other: 'bg-[var(--ui-bg-hover)] text-foreground',
};

const GeneralFeedbackSection: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedFeedback, setSelectedFeedback] = useState<GeneralFeedback | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const { data: feedback = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-general-feedback'],
    queryFn: () => generalFeedbackService.getAllFeedback(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => generalFeedbackService.deleteFeedback(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-general-feedback'] });
      toast({
        title: 'Feedback Deleted',
        description: 'The feedback entry has been removed.',
      });
    },
    onError: (error: any) => {
      toastError(error, 'Error', 'Failed to delete feedback.');
    },
  });

  const handleViewDetails = (item: GeneralFeedback) => {
    setSelectedFeedback(item);
    setDetailModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this feedback?')) {
      deleteMutation.mutate(id);
    }
  };

  // Calculate category stats
  const categoryStats = feedback.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquarePlus className="h-5 w-5" />
                General Feedback
              </CardTitle>
              <CardDescription>
                User-submitted general feedback (not tied to specific chat messages)
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Category Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-brand-blue dark:text-foreground">{feedback.length}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <div key={key} className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold">{categoryStats[key] || 0}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>

          {/* Feedback Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : feedback.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No general feedback submissions yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedback.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(item.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{item.profiles?.name || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">{item.profiles?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={categoryColors[item.category] || 'bg-[var(--ui-bg-hover)] text-foreground'}>
                        {categoryLabels[item.category] || item.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {item.subject || '—'}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {item.message}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(item)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
            <DialogDescription>
              Submitted on {selectedFeedback && format(new Date(selectedFeedback.created_at), 'MMMM d, yyyy h:mm a')}
            </DialogDescription>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">User</label>
                <p className="mt-1">
                  {selectedFeedback.profiles?.name || 'Unknown'}
                  {selectedFeedback.profiles?.email && (
                    <span className="text-muted-foreground ml-2">({selectedFeedback.profiles.email})</span>
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Category</label>
                <p className="mt-1">
                  <Badge className={categoryColors[selectedFeedback.category] || 'bg-[var(--ui-bg-hover)] text-foreground'}>
                    {categoryLabels[selectedFeedback.category] || selectedFeedback.category}
                  </Badge>
                </p>
              </div>
              {selectedFeedback.subject && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Subject</label>
                  <p className="mt-1">{selectedFeedback.subject}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Message</label>
                <p className="mt-1 whitespace-pre-wrap bg-muted/30 p-3 rounded-lg text-sm">
                  {selectedFeedback.message}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GeneralFeedbackSection;
