
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, ThumbsUp, ThumbsDown, Edit3, MessageSquare, Calendar, User } from 'lucide-react';

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

interface FeedbackDetailModalProps {
  feedback: FeedbackEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

const FeedbackDetailModal: React.FC<FeedbackDetailModalProps> = ({
  feedback,
  isOpen,
  onClose
}) => {
  if (!feedback) return null;

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
      return <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25"><MessageSquare className="w-3 h-3 mr-1" />Comment</Badge>;
    }
    return <Badge variant="outline">Other</Badge>;
  };

  const getLengthBadgeColor = (length: string | null) => {
    switch (length) {
      case 'short':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25';
      case 'medium':
        return 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/25';
      case 'long':
        return 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/25';
      case 'daryle_long':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/25';
      default:
        return 'bg-[var(--chat-card-2)] text-[var(--chat-text)] border-[var(--chat-border)]';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[var(--chat-bg)] text-[var(--chat-text)] border-[var(--chat-border)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Feedback Details</span>
            {getFeedbackCategoryBadge(feedback)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Metadata Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-[var(--chat-text)]">User</div>
                <div className="text-sm">
                  {feedback.profiles?.name || 'Anonymous'}
                  {feedback.user_id && (
                    <div className="text-xs text-[var(--chat-muted)] mt-1">
                      ID: {feedback.user_id.substring(0, 8)}...
                    </div>
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-[var(--chat-text)]">Date</div>
                <div className="text-sm flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(feedback.created_at).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-[var(--chat-text)]">Message ID</div>
                <code className="text-xs bg-[var(--chat-card-2)] text-[var(--chat-text)] px-2 py-1 rounded border border-[var(--chat-border)]">
                  {feedback.message_id}
                </code>
              </div>
              <div>
                <div className="text-sm font-medium text-[var(--chat-text)]">Role</div>
                <div className="text-sm">{feedback.role || '—'}</div>
              </div>
            </CardContent>
          </Card>

          {/* Rating Section */}
          {feedback.rating && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {feedback.rating === 'thumbs_up' ? (
                    <ThumbsUp className="w-6 h-6 text-green-600" />
                  ) : feedback.rating === 'thumbs_down' ? (
                    <ThumbsDown className="w-6 h-6 text-red-600" />
                  ) : null}
                  <span className="text-lg font-medium capitalize">
                    {feedback.rating?.replace('_', ' ')}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Length Preference Section */}
          {feedback.length_preference && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Length Preference</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={getLengthBadgeColor(feedback.length_preference)}>
                  {feedback.length_preference.replace('_', ' ')}
                </Badge>
              </CardContent>
            </Card>
          )}

          {/* Original Message Section */}
          {feedback.original_message && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Original Message</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-[var(--chat-card-2)] border border-[var(--chat-border)] rounded-lg p-4 text-sm whitespace-pre-wrap text-[var(--chat-text)]">
                  {feedback.original_message}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Edited Message Section */}
          {feedback.edited_message && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Edited Message</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-brand-yellow/10 border border-brand-yellow/20 rounded-lg p-4 text-sm whitespace-pre-wrap text-[var(--chat-text)]">
                  {feedback.edited_message}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comment Section */}
          {feedback.comment && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm whitespace-pre-wrap text-[var(--chat-text)]">
                  {feedback.comment}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              {feedback.chat_id && (
                <Button
                  variant="outline"
                  onClick={() => window.open(`/?chat=${feedback.chat_id}`, '_blank')}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Chat
                </Button>
              )}
            </div>
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackDetailModal;
