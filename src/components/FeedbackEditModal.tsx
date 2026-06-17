import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Check, Loader2, ChevronDown } from 'lucide-react';
import { parseMarkdownBold } from '@/utils/markdownParser';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { feedbackService } from '@/services/feedbackService';
import { useChatManagement } from '@/hooks/useChatManagement';

export interface FeedbackEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string;
  originalMessage: string;
  messageRole?: 'bot' | 'user';
  chatId?: string | null;
  /** Open with the optional "edit / rate" section expanded. */
  initialView?: 'feedback' | 'edit';
  onSubmitted?: (rating: 'thumbs_up' | 'thumbs_down' | null) => void;
  /** Legacy callback for the old Edit modal — fired with edited text + comment. */
  onSubmitEdit?: (editedMessage: string, feedback: string) => void;
}

function lengthLabel(v: number) {
  return ({1:'Too short',2:'Somewhat short',3:'Just right',4:'Somewhat long',5:'Too long'} as const)[v as 1|2|3|4|5];
}
function accuracyLabel(v: number) {
  return ({1:'Very inaccurate',2:'Mostly inaccurate',3:'Somewhat accurate',4:'Mostly accurate',5:'Very accurate'} as const)[v as 1|2|3|4|5];
}

const FeedbackEditModal: React.FC<FeedbackEditModalProps> = ({
  isOpen,
  onClose,
  messageId,
  originalMessage,
  messageRole = 'bot',
  chatId,
  initialView = 'feedback',
  onSubmitted,
  onSubmitEdit,
}) => {
  const { user } = useAuth();
  const { currentChatId } = useChatManagement();
  const { toast } = useToast();

  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
  const [editedMessage, setEditedMessage] = useState('');
  const [lengthRating, setLengthRating] = useState<number[]>([3]);
  const [accuracyRating, setAccuracyRating] = useState<number[]>([3]);
  const [showImprove, setShowImprove] = useState(initialView === 'edit');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (isOpen) setShowImprove(initialView === 'edit');
  }, [isOpen, initialView]);

  const reset = () => {
    setHelpful(null);
    setComment('');
    setEditedMessage('');
    setLengthRating([3]);
    setAccuracyRating([3]);
    setShowImprove(initialView === 'edit');
    setValidationError('');
    setSubmitting(false);
    setSuccess(false);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (helpful === null) {
      setValidationError('Please select whether this response was helpful');
      return;
    }
    setValidationError('');
    setSubmitting(true);
    const rating: 'thumbs_up' | 'thumbs_down' = helpful ? 'thumbs_up' : 'thumbs_down';
    const ratingsTouched = lengthRating[0] !== 3 || accuracyRating[0] !== 3;
    const combinedComment = [
      comment.trim() || null,
      ratingsTouched ? `Length: ${lengthLabel(lengthRating[0])} (${lengthRating[0]}/5)` : null,
      ratingsTouched ? `Accuracy: ${accuracyLabel(accuracyRating[0])} (${accuracyRating[0]}/5)` : null,
    ].filter(Boolean).join(' | ') || null;

    try {
      // Use feedbackService for the primary helpful/not-helpful submission so
      // existing analytics + dedupe rules continue to apply.
      await feedbackService.submitFeedback({
        message_id: messageId,
        role: messageRole,
        original_message: originalMessage,
        rating,
        comment: combinedComment,
        chat_id: chatId ?? currentChatId ?? null,
      });

      // If the user also supplied an improved response, record it as an
      // additional row so the edit lives alongside the rating.
      if (editedMessage.trim().length > 0) {
        await supabase.from('feedback_logs').insert([{
          user_id: user?.id ?? null,
          chat_id: chatId ?? currentChatId ?? null,
          message_id: messageId,
          role: messageRole,
          original_message: originalMessage,
          edited_message: editedMessage.trim(),
          comment: combinedComment,
          rating,
        }]);
        onSubmitEdit?.(editedMessage.trim(), comment.trim());
      }

      setSuccess(true);
      onSubmitted?.(rating);
      toast({
        title: 'Feedback submitted',
        description: editedMessage.trim()
          ? 'Your rating and improved response were recorded.'
          : 'Thanks for helping improve Daryle AI.',
        duration: 3000,
      });
      setTimeout(() => handleClose(), 1100);
    } catch (e) {
      console.error('FeedbackEditModal submit error', e);
      toast({
        variant: 'destructive',
        title: 'Submission failed',
        description: 'Could not save your feedback. Please try again.',
        duration: 4000,
      });
      setSubmitting(false);
    }
  };

  const submitDisabled = submitting || helpful === null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        {success && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
            <div className="text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 animate-scale-in">
                <Check className="w-7 h-7 text-green-600" />
              </div>
              <p className="text-base font-semibold text-green-800">Feedback received</p>
            </div>
          </div>
        )}

        <DialogHeader>
          <DialogTitle className="font-heading text-brand-blue">Rate &amp; Improve Response</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Share whether this AI response helped, and optionally suggest a better version.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* AI response preview — collapsible to keep the form compact. */}
          <details className="rounded-md border bg-muted/40 group" open>
            <summary className="cursor-pointer list-none flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground">
              <span>AI response being rated</span>
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-3 pb-3 pt-1 text-sm leading-relaxed text-foreground whitespace-pre-wrap max-h-40 overflow-y-auto">
              {parseMarkdownBold(originalMessage)}
            </div>
          </details>

          {/* Required helpfulness */}
          <div>
            <Label className="block text-sm font-medium mb-2">Was this helpful? *</Label>
            <RadioGroup
              value={helpful === null ? '' : helpful ? 'helpful' : 'not_helpful'}
              onValueChange={(v) => { setHelpful(v === 'helpful'); setValidationError(''); }}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="helpful" id="rate-helpful" />
                <Label htmlFor="rate-helpful" className="cursor-pointer">Helpful</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="not_helpful" id="rate-not-helpful" />
                <Label htmlFor="rate-not-helpful" className="cursor-pointer">Not helpful</Label>
              </div>
            </RadioGroup>
            {validationError && <p className="text-sm text-destructive mt-2">{validationError}</p>}
          </div>

          {/* Comments */}
          <div>
            <Label htmlFor="feedback-comment" className="block text-sm font-medium mb-2">Your comments (optional)</Label>
            <Textarea
              id="feedback-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share any additional thoughts or suggestions…"
              rows={3}
              className="resize-none"
              disabled={submitting}
            />
          </div>

          {/* Toggle the editor / detailed ratings */}
          <button
            type="button"
            onClick={() => setShowImprove((s) => !s)}
            className="text-sm font-medium text-brand-yellow hover:underline"
          >
            {showImprove ? 'Hide improved response & ratings' : 'Suggest an improved response or rate details'}
          </button>

          {showImprove && (
            <div className="space-y-5 border-t pt-5">
              <div>
                <Label htmlFor="improved-response" className="block text-sm font-medium mb-2">Improved response (optional)</Label>
                <Textarea
                  id="improved-response"
                  value={editedMessage}
                  onChange={(e) => setEditedMessage(e.target.value)}
                  placeholder="Suggest a better version of the response…"
                  className="min-h-[110px]"
                  maxLength={2000}
                  disabled={submitting}
                />
                <div className="text-xs text-muted-foreground mt-1">{editedMessage.length}/2000 characters</div>
              </div>

              <div className="space-y-4 p-3 bg-muted/40 rounded-md">
                <Label className="block text-xs text-muted-foreground">Rate the original response (optional)</Label>
                <div>
                  <Label className="text-sm font-medium">Length: {lengthLabel(lengthRating[0])} ({lengthRating[0]}/5)</Label>
                  <div className="mt-2 px-2">
                    <Slider value={lengthRating} onValueChange={setLengthRating} min={1} max={5} step={1} disabled={submitting} />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Too short</span><span>Just right</span><span>Too long</span>
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Accuracy: {accuracyLabel(accuracyRating[0])} ({accuracyRating[0]}/5)</Label>
                  <div className="mt-2 px-2">
                    <Slider value={accuracyRating} onValueChange={setAccuracyRating} min={1} max={5} step={1} disabled={submitting} />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Very inaccurate</span><span>Somewhat accurate</span><span>Very accurate</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-4">
          <Button variant="outline" onClick={handleClose} disabled={submitting}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={submitDisabled}
            aria-disabled={submitDisabled}
            title={helpful === null ? 'Select Helpful or Not helpful first' : undefined}
            className="bg-brand-yellow hover:bg-brand-yellow/90 text-brand-blue disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
          >
            {submitting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting…</>) : 'Submit Feedback'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackEditModal;
