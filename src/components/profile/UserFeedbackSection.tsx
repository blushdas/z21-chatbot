import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import FeedbackDetailModal from '@/components/admin/feedback/FeedbackDetailModal';
import UserFeedbackColumnVisibilityControls, { USER_FEEDBACK_COLUMNS } from '@/components/profile/UserFeedbackColumnVisibilityControls';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageCircle, ExternalLink, Calendar, ThumbsUp, ThumbsDown, Edit3, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { parseMarkdownBold } from '@/utils/markdownParser';

interface FeedbackEntry {
  id: string;
  user_id: string | null;
  chat_id: string | null;
  message_id: string;
  role: string | null;
  original_message: string | null;
  edited_message: string | null;
  length_preference: string | null;
  rating: string | null;
  comment: string | null;
  created_at: string;
  profiles?: {
    name: string | null;
    id: string;
  } | null;
}

const UserFeedbackSection: React.FC = () => {
  const { user } = useAuth();
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackEntry | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const { toast } = useToast();

  // Initialize column visibility from localStorage or defaults
  useEffect(() => {
    const savedColumnVisibility = localStorage.getItem('userFeedbackColumnVisibility');
    if (savedColumnVisibility) {
      try {
        setVisibleColumns(JSON.parse(savedColumnVisibility));
      } catch (error) {
        console.error('Error parsing saved column visibility:', error);
        // Set defaults if parsing fails
        const defaultVisibility = USER_FEEDBACK_COLUMNS.reduce((acc, column) => {
          acc[column.key] = column.defaultVisible;
          return acc;
        }, {} as Record<string, boolean>);
        setVisibleColumns(defaultVisibility);
      }
    } else {
      // Set defaults if no saved preferences
      const defaultVisibility = USER_FEEDBACK_COLUMNS.reduce((acc, column) => {
        acc[column.key] = column.defaultVisible;
        return acc;
      }, {} as Record<string, boolean>);
      setVisibleColumns(defaultVisibility);
    }
  }, []);

  // Save column visibility to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(visibleColumns).length > 0) {
      localStorage.setItem('userFeedbackColumnVisibility', JSON.stringify(visibleColumns));
    }
  }, [visibleColumns]);

  const handleToggleColumn = (columnKey: string) => {
    if (columnKey === 'category') return; // Category always visible
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };

  const handleShowAllColumns = () => {
    const allVisible = USER_FEEDBACK_COLUMNS.reduce((acc, column) => {
      acc[column.key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setVisibleColumns(allVisible);
  };

  const handleHideAllColumns = () => {
    const onlyCategoryVisible = USER_FEEDBACK_COLUMNS.reduce((acc, column) => {
      acc[column.key] = column.key === 'category'; // Only keep category visible
      return acc;
    }, {} as Record<string, boolean>);
    setVisibleColumns(onlyCategoryVisible);
  };

  // Fetch user's feedback
  const { data: userFeedback = [], isLoading: feedbackLoading } = useQuery({
    queryKey: ['user-own-feedback', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data: feedback, error: feedbackError } = await supabase
        .from('feedback_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (feedbackError) throw feedbackError;

      const feedbackWithProfiles: FeedbackEntry[] = (feedback || []).map(f => ({
        ...f,
        profiles: {
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'You'
        }
      }));
      
      return feedbackWithProfiles;
    },
    enabled: !!user?.id
  });

  // Get feedback stats
  const feedbackStats = {
    total: userFeedback.length,
    thumbsUp: userFeedback.filter(f => f.rating === 'thumbs_up').length,
    thumbsDown: userFeedback.filter(f => f.rating === 'thumbs_down').length,
    edits: userFeedback.filter(f => f.edited_message).length,
    comments: userFeedback.filter(f => f.comment && !f.edited_message).length,
  };

  // Filter and sort feedback
  const filteredFeedback = userFeedback
    .filter(item => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        (item.original_message && item.original_message.toLowerCase().includes(searchLower)) ||
        (item.edited_message && item.edited_message.toLowerCase().includes(searchLower)) ||
        (item.comment && item.comment.toLowerCase().includes(searchLower)) ||
        (item.role && item.role.toLowerCase().includes(searchLower)) ||
        (item.message_id && item.message_id.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        default:
          return 0;
      }
    });

  const onSelectFeedback = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('feedback_logs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching feedback details:', error);
        toast({
          title: "Error",
          description: "Failed to load feedback details",
          variant: "destructive"
        });
        return;
      }

      const feedbackData: FeedbackEntry = {
        ...data,
        profiles: {
          id: user?.id || '',
          name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'You'
        }
      };
      setSelectedFeedback(feedbackData);
      setDetailModalOpen(true);
    } catch (error) {
      console.error('Error fetching feedback details:', error);
      toast({
        title: "Error",
        description: "Failed to load feedback details",
        variant: "destructive"
      });
    }
  };

  const handleViewInChat = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .single();

      if (error) {
        console.error('Error fetching chat:', error);
        toast({
          title: "Error",
          description: "Failed to load chat conversation",
          variant: "destructive"
        });
        return;
      }

      setSelectedChat(data);
      setShowChatModal(true);
    } catch (error) {
      console.error('Error fetching chat:', error);
      toast({
        title: "Error",
        description: "Failed to load chat conversation",
        variant: "destructive"
      });
    }
  };

  const formatMessageContent = (content: string) => {
    return parseMarkdownBold(content);
  };

  const getFeedbackCategoryBadge = (entry: FeedbackEntry) => {
    if (entry.edited_message) {
      return <Badge className="bg-brand-yellow/15 text-brand-blue dark:text-brand-yellow border-brand-yellow/25"><Edit3 className="w-3 h-3 mr-1" />Rewrite</Badge>;
    }
    if (entry.rating === 'thumbs_up') {
      return <Badge className="bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/25"><ThumbsUp className="w-3 h-3 mr-1" />Positive</Badge>;
    }
    if (entry.rating === 'thumbs_down') {
      return <Badge className="bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/25"><ThumbsDown className="w-3 h-3 mr-1" />Negative</Badge>;
    }
    if (entry.comment && !entry.edited_message) {
      return <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25"><MessageCircle className="w-3 h-3 mr-1" />Comment</Badge>;
    }
    return <Badge variant="outline">Other</Badge>;
  };

  const truncateText = (text: string | null, maxLength: number = 50) => {
    if (!text) return '—';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const getDisplayMessage = (entry: FeedbackEntry) => {
    // If we have the original message, use it
    if (entry.original_message) {
      return truncateText(entry.original_message, 60);
    }
    
    // If we have an edited message but no original, show the edited one with context
    if (entry.edited_message) {
      return `[Edited] ${truncateText(entry.edited_message, 50)}`;
    }
    
    // If we have neither, show role and message ID context
    if (entry.role && entry.message_id) {
      return `${entry.role === 'bot' ? 'AI' : 'User'} message (${entry.message_id.slice(-8)})`;
    }
    
    // Final fallback
    return 'Message content unavailable';
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Feedback', value: feedbackStats.total, color: 'text-[var(--chat-text)]' },
          { label: 'Positive', value: feedbackStats.thumbsUp, color: 'text-green-700 dark:text-green-300' },
          { label: 'Negative', value: feedbackStats.thumbsDown, color: 'text-red-700 dark:text-red-300' },
          { label: 'Edits', value: feedbackStats.edits, color: 'text-brand-yellow' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl bg-[var(--chat-card)] border border-[var(--chat-border)] p-4 text-center">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-[var(--chat-muted)] mt-1 uppercase tracking-wider">{label}</div>
          </div>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="rounded-xl bg-[var(--chat-card)] border border-[var(--chat-border)] p-4">
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex-1 relative min-w-[160px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--chat-muted)]" />
            <Input
              placeholder="Search your feedback..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-[var(--chat-bg)] border-[var(--chat-border)] text-[var(--chat-text)] placeholder:text-[var(--chat-muted)]"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40 bg-[var(--chat-bg)] border-[var(--chat-border)] text-[var(--chat-text)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[var(--chat-card)] border-[var(--chat-border)] text-[var(--chat-text)]">
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
          <UserFeedbackColumnVisibilityControls
            visibleColumns={visibleColumns}
            onToggleColumn={handleToggleColumn}
            onShowAll={handleShowAllColumns}
            onHideAll={handleHideAllColumns}
          />
        </div>
      </div>

      {/* Feedback Table */}
      <div className="rounded-xl bg-[var(--chat-card)] border border-[var(--chat-border)] p-5">
        <h3 className="text-sm font-semibold text-[var(--chat-text)] mb-4">
          Your Feedback History ({filteredFeedback.length})
        </h3>
        <div>
          {feedbackLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-yellow mx-auto mb-3" />
              <p className="text-[var(--chat-muted)] text-sm">Loading your feedback...</p>
            </div>
          ) : filteredFeedback.length === 0 ? (
            <div className="text-center py-10 text-[var(--chat-muted)]">
              <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-[var(--chat-text)]">No feedback found</p>
              <p className="text-sm mt-1 text-[var(--chat-muted)]">Your feedback will appear here as you interact with the system and provide insights on AI responses.</p>
            </div>
          ) : (
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="min-w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {visibleColumns.category && <TableHead>Category</TableHead>}
                      {visibleColumns.message && <TableHead>Message</TableHead>}
                      {visibleColumns.rating && <TableHead>Rating</TableHead>}
                      {visibleColumns.comment && <TableHead>Comment</TableHead>}
                      {visibleColumns.chat && <TableHead>Chat</TableHead>}
                      {visibleColumns.date && <TableHead>Date</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFeedback.map((item) => (
                      <TableRow 
                        key={item.id}
                        className="hover:bg-[var(--ui-bg-hover)] cursor-pointer transition-colors border-[var(--chat-border)]"
                        onClick={() => onSelectFeedback(item.id)}
                      >
                        {visibleColumns.category && (
                          <TableCell>
                            {getFeedbackCategoryBadge(item)}
                          </TableCell>
                        )}
                        {visibleColumns.message && (
                          <TableCell className="max-w-xs">
                            <div 
                              className="truncate" 
                              title={item.original_message || `${item.role || 'Unknown'} message from ${new Date(item.created_at).toLocaleDateString()}`}
                            >
                              {getDisplayMessage(item)}
                            </div>
                          </TableCell>
                        )}
                        {visibleColumns.rating && (
                          <TableCell>
                            {item.rating === 'thumbs_up' ? (
                              <ThumbsUp className="w-4 h-4 text-green-600" />
                            ) : item.rating === 'thumbs_down' ? (
                              <ThumbsDown className="w-4 h-4 text-red-600" />
                            ) : (
                              <span className="text-[var(--chat-muted)]">—</span>
                            )}
                          </TableCell>
                        )}
                        {visibleColumns.comment && (
                          <TableCell className="max-w-sm">
                            <div className="truncate" title={item.comment || ''}>
                              {truncateText(item.comment, 40)}
                            </div>
                          </TableCell>
                        )}
                        {visibleColumns.chat && (
                          <TableCell>
                            {item.chat_id ? (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewInChat(item.chat_id);
                                }}
                                className="text-xs p-1 h-auto"
                              >
                                <MessageCircle className="w-3 h-3 mr-1" />
                                View Chat
                              </Button>
                            ) : (
                              <span className="text-[var(--chat-muted)]">—</span>
                            )}
                          </TableCell>
                        )}
                        {visibleColumns.date && (
                          <TableCell className="text-sm text-[var(--chat-muted)]">
                            {new Date(item.created_at).toLocaleString()}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </div>
      </div>

      <FeedbackDetailModal
        feedback={selectedFeedback}
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedFeedback(null);
        }}
      />

      {/* Chat Modal */}
      <Dialog open={showChatModal} onOpenChange={setShowChatModal}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Chat Conversation
              {selectedChat && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  {selectedChat.title || 'Untitled Chat'} • {selectedChat.mode}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            {selectedChat && selectedChat.messages ? (
              <div className="space-y-4">
                {selectedChat.messages.map((message: any, index: number) => (
                  <div
                    key={index}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="text-sm font-medium mb-1 capitalize">
                        {message.sender === 'user' ? 'You' : 'AI'}
                      </div>
                      <div className="prose prose-sm max-w-none">
                        {formatMessageContent(message.content)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No messages found in this chat.
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserFeedbackSection;