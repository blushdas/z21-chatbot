
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ExternalLink, ThumbsUp, ThumbsDown, Edit3, MessageSquare, ChevronUp, ChevronDown } from 'lucide-react';

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

export interface ColumnVisibility {
  category: boolean;
  user: boolean;
  rating: boolean;
  originalMessage: boolean;
  editedMessage: boolean;
  lengthPreference: boolean;
  comment: boolean;
  chat: boolean;
  date: boolean;
}

interface FeedbackTableProps {
  feedback: FeedbackEntry[];
  onSelectFeedback: (id: string) => void;
  onViewChat: (chatId: string) => void;
  visibleColumns: ColumnVisibility;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  onSort: (column: string) => void;
}

export const FeedbackTable: React.FC<FeedbackTableProps> = ({ 
  feedback, 
  onSelectFeedback,
  onViewChat,
  visibleColumns,
  sortBy,
  sortDirection,
  onSort
}) => {
  const getFeedbackCategoryBadge = (entry: FeedbackEntry) => {
    if (entry.edited_message) {
      return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200"><Edit3 className="w-3 h-3 mr-1" />Rewrite</Badge>;
    }
    if (entry.rating === 'thumbs_up') {
      return <Badge className="bg-green-100 text-green-700 border-green-200"><ThumbsUp className="w-3 h-3 mr-1" />Positive</Badge>;
    }
    if (entry.rating === 'thumbs_down') {
      return <Badge className="bg-red-100 text-red-700 border-red-200"><ThumbsDown className="w-3 h-3 mr-1" />Negative</Badge>;
    }
    if (entry.comment && !entry.edited_message) {
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200"><MessageSquare className="w-3 h-3 mr-1" />Comment</Badge>;
    }
    return <Badge variant="outline">Other</Badge>;
  };

  const getRatingIcon = (rating: string | null) => {
    if (rating === 'thumbs_up') {
      return <ThumbsUp className="w-4 h-4 text-green-600" />;
    } else if (rating === 'thumbs_down') {
      return <ThumbsDown className="w-4 h-4 text-red-600" />;
    }
    return <span className="text-muted-foreground">—</span>;
  };

  const getLengthBadgeColor = (length: string | null) => {
    switch (length) {
      case 'short':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200';
      case 'medium':
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200';
      case 'long':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200';
      case 'daryle_long':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200';
      default:
        return 'bg-[var(--ui-bg-hover)] text-foreground';
    }
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
    
    // If we have a chat_id but couldn't recover content, chat may be deleted
    if (entry.chat_id && !entry.original_message) {
      return 'Chat deleted - content unavailable';
    }
    
    // If we have neither chat nor message, show role context if available
    if (entry.role && entry.message_id) {
      return `${entry.role === 'bot' ? 'AI' : 'User'} message (${entry.message_id.slice(-8)})`;
    }
    
    // Final fallback
    return 'Message not found in chat';
  };

  const SortableHeader = ({ column, children, className = "" }: { 
    column: string; 
    children: React.ReactNode; 
    className?: string;
  }) => (
    <TableHead 
      className={`cursor-pointer hover:bg-muted/50 select-none ${className}`}
      onClick={() => onSort(column)}
    >
      <div className="flex items-center justify-between">
        <span>{children}</span>
        <div className="ml-2 flex flex-col">
          <ChevronUp 
            className={`w-3 h-3 ${
              sortBy === column && sortDirection === 'asc' 
                ? 'text-primary' 
                : 'text-muted-foreground'
            }`} 
          />
          <ChevronDown 
            className={`w-3 h-3 -mt-1 ${
              sortBy === column && sortDirection === 'desc' 
                ? 'text-primary' 
                : 'text-muted-foreground'
            }`} 
          />
        </div>
      </div>
    </TableHead>
  );

  if (feedback.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No feedback submissions yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {visibleColumns.category && <SortableHeader column="category">Category</SortableHeader>}
            {visibleColumns.user && <SortableHeader column="user">User</SortableHeader>}
            {visibleColumns.rating && <SortableHeader column="rating">Rating</SortableHeader>}
            {visibleColumns.originalMessage && <SortableHeader column="originalMessage">Original Message</SortableHeader>}
            {visibleColumns.editedMessage && <TableHead>Edited Message</TableHead>}
            {visibleColumns.lengthPreference && <TableHead>Length Pref</TableHead>}
            {visibleColumns.comment && <TableHead>Comment</TableHead>}
            {visibleColumns.chat && <SortableHeader column="chat">Chat</SortableHeader>}
            {visibleColumns.date && <SortableHeader column="date">Date</SortableHeader>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {feedback.map((item) => (
            <TableRow 
              key={item.id}
              className="hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => onSelectFeedback(item.id)}
            >
              {visibleColumns.category && (
                <TableCell>
                  {getFeedbackCategoryBadge(item)}
                </TableCell>
              )}
              {visibleColumns.user && (
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {(item.profiles?.name) || 'Anonymous'}
                    </span>
                    {item.user_id && (
                      <span className="text-xs text-muted-foreground">
                        {item.user_id.substring(0, 8)}...
                      </span>
                    )}
                  </div>
                </TableCell>
              )}
              {visibleColumns.rating && (
                <TableCell>
                  <div className="flex items-center">
                    {getRatingIcon(item.rating)}
                  </div>
                </TableCell>
              )}
              {visibleColumns.originalMessage && (
                <TableCell className="max-w-xs">
                  <div 
                    className="truncate" 
                    title={item.original_message || `${item.role || 'Unknown'} message from ${new Date(item.created_at).toLocaleDateString()}`}
                  >
                    {getDisplayMessage(item)}
                  </div>
                </TableCell>
              )}
              {visibleColumns.editedMessage && (
                <TableCell className="max-w-xs">
                  <div className="truncate" title={item.edited_message || ''}>
                    {truncateText(item.edited_message, 60)}
                  </div>
                </TableCell>
              )}
              {visibleColumns.lengthPreference && (
                <TableCell>
                  {item.length_preference ? (
                    <Badge className={getLengthBadgeColor(item.length_preference)}>
                      {item.length_preference.replace('_', ' ')}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
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
                        e.stopPropagation(); // Prevent row click
                        onViewChat(item.chat_id!);
                      }}
                      className="text-xs p-1 h-auto"
                    >
                      <MessageSquare className="w-3 h-3 mr-1" />
                      View Chat
                    </Button>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              )}
              {visibleColumns.date && (
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(item.created_at).toLocaleString()}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
