import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Filter, RefreshCw } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AdminLayout from '@/components/admin/AdminLayout';
import BackToAdminButton from '@/components/admin/BackToAdminButton';

interface FeedbackEntry {
  type: 'thumbs_up' | 'thumbs_down' | 'comment';
  messageId: string;
  feedbackText: string;
  timestamp: string;
  messageContent: string;
}

const AdminFeedbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [filteredFeedback, setFilteredFeedback] = useState<FeedbackEntry[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  const loadFeedback = () => {
    try {
      const stored = localStorage.getItem('feedbackLogs');
      const logs = stored ? JSON.parse(stored) : [];
      setFeedback(logs);
      setFilteredFeedback(logs);
    } catch (error) {
      console.error('Error loading feedback:', error);
      setFeedback([]);
      setFilteredFeedback([]);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  useEffect(() => {
    let filtered = [...feedback];

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      
      if (sortBy === 'newest') {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });

    setFilteredFeedback(filtered);
  }, [feedback, filterType, sortBy]);

  const exportToCSV = () => {
    const headers = ['Type', 'Message ID', 'Feedback Text', 'Message Content', 'Timestamp'];
    const csvContent = [
      headers.join(','),
      ...filteredFeedback.map(item => [
        item.type,
        item.messageId,
        `"${item.feedbackText.replace(/"/g, '""')}"`,
        `"${item.messageContent.replace(/"/g, '""')}"`,
        new Date(item.timestamp).toISOString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'thumbs_up':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'thumbs_down':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'comment':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-[var(--ui-bg-hover)] text-foreground';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'thumbs_up':
        return '👍 Positive';
      case 'thumbs_down':
        return '👎 Negative';
      case 'comment':
        return '💬 Comment';
      default:
        return type;
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <BackToAdminButton />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">Feedback Dashboard (Legacy)</h1>
            <p className="text-muted-foreground mt-1">
              Monitor and analyze user feedback across all chat interactions
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadFeedback} size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={exportToCSV} size="sm" disabled={filteredFeedback.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-brand-blue dark:text-foreground">{feedback.length}</div>
              <div className="text-sm text-muted-foreground">Total Feedback</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {feedback.filter(f => f.type === 'thumbs_up').length}
              </div>
              <div className="text-sm text-muted-foreground">Positive</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">
                {feedback.filter(f => f.type === 'thumbs_down').length}
              </div>
              <div className="text-sm text-muted-foreground">Negative</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {feedback.filter(f => f.type === 'comment').length}
              </div>
              <div className="text-sm text-muted-foreground">Comments</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters & Sorting
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Type:</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="thumbs_up">👍 Positive</SelectItem>
                  <SelectItem value="thumbs_down">👎 Negative</SelectItem>
                  <SelectItem value="comment">💬 Comments</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Sort:</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Feedback Entries ({filteredFeedback.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredFeedback.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {feedback.length === 0 
                  ? "No feedback submissions yet."
                  : "No feedback matches the current filters."
                }
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Message ID</TableHead>
                    <TableHead>Feedback Text</TableHead>
                    <TableHead>Message Context</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFeedback.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Badge className={getTypeColor(item.type)}>
                          {getTypeLabel(item.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {item.messageId.substring(0, 12)}...
                        </code>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {item.feedbackText ? (
                          <div className="truncate" title={item.feedbackText}>
                            {item.feedbackText}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-sm">
                        {item.messageContent ? (
                          <div className="truncate text-sm text-muted-foreground" title={item.messageContent}>
                            {item.messageContent}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(item.timestamp).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminFeedbackPage;
