
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { feedbackService } from '@/services/feedbackService';
import { useChatManagement } from '@/hooks/useChatManagement';

interface ThumbsDownCommentFormProps {
  messageId: string;
  messageContent: string;
  onCancel: () => void;
  onSubmitSuccess: () => void;
}

const ThumbsDownCommentForm: React.FC<ThumbsDownCommentFormProps> = ({
  messageId,
  messageContent,
  onCancel,
  onSubmitSuccess
}) => {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const { currentChatId } = useChatManagement();

  const handleSubmit = async () => {
    if (!comment.trim()) {
      setError('Please tell us what wasn\'t helpful');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await feedbackService.submitFeedback({
        message_id: messageId,
        chat_id: currentChatId || undefined,
        role: 'bot',
        original_message: messageContent,
        rating: 'thumbs_down',
        comment: comment.trim(),
      });

      toast({
        title: "Thanks for your feedback!",
        description: "Your feedback helps us improve Daryle AI.",
        duration: 3000,
      });

      onSubmitSuccess();
    } catch (error) {
      console.error('Error submitting thumbs down feedback:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-3 p-4 border border-[var(--color-error-border)] bg-[var(--color-error-soft)] rounded-lg">
      <div className="space-y-3">
        <div>
          <label htmlFor="thumbs-down-comment" className="block text-sm font-medium text-foreground mb-2">
            Tell us what wasn't helpful *
          </label>
          <Textarea
            id="thumbs-down-comment"
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              if (error) setError('');
            }}
            placeholder="Help us understand what could be improved..."
            rows={3}
            className="resize-none"
            disabled={isSubmitting}
          />
          {error && (
            <p className="text-sm text-red-600 mt-1">{error}</p>
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ThumbsDownCommentForm;
