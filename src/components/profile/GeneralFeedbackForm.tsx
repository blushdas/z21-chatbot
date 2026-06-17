import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { toastError } from '@/utils/toastError';
import { Loader2, Send, MessageSquarePlus, Clock, CheckCircle2 } from 'lucide-react';
import { generalFeedbackService, GeneralFeedback } from '@/services/generalFeedbackService';
import { format } from 'date-fns';

const feedbackCategories = [
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'bug_report', label: 'Bug Report' },
  { value: 'general_suggestion', label: 'General Suggestion' },
  { value: 'compliment', label: 'Compliment' },
  { value: 'other', label: 'Other' },
];

const GeneralFeedbackForm: React.FC = () => {
  const [formData, setFormData] = useState({
    category: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [previousFeedback, setPreviousFeedback] = useState<GeneralFeedback[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    loadPreviousFeedback();
  }, []);

  const loadPreviousFeedback = async () => {
    try {
      const feedback = await generalFeedbackService.getUserFeedback();
      setPreviousFeedback(feedback);
    } catch (error) {
      console.error('Error loading feedback history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category) {
      toast({
        title: 'Category Required',
        description: 'Please select a feedback category.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.message.trim()) {
      toast({
        title: 'Message Required',
        description: 'Please enter your feedback message.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await generalFeedbackService.submitFeedback({
        category: formData.category,
        subject: formData.subject.trim() || undefined,
        message: formData.message.trim(),
      });

      setFormData({ category: '', subject: '', message: '' });
      setShowSuccess(true);
      loadPreviousFeedback();
    } catch (error: any) {
      toastError(error, 'Submission Failed', 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryLabel = (value: string) => {
    return feedbackCategories.find((cat) => cat.value === value)?.label || value;
  };

  const handleNewFeedback = () => {
    setShowSuccess(false);
  };

  return (
    <div className="space-y-4">
      {/* Feedback Form */}
      <div className="rounded-2xl bg-[var(--chat-card)] border border-[var(--chat-border)] p-6">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquarePlus size={16} className="text-brand-yellow" />
          <h3 className="text-base font-semibold text-[var(--chat-text)]">Provide General Feedback</h3>
        </div>
        <p className="text-sm text-[var(--chat-muted)] mb-5">Share your thoughts, suggestions, or report issues to help us improve Daryle AI.</p>
        <div>
          {showSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Thank You!</h3>
                <p className="text-muted-foreground max-w-sm">
                  Your feedback has been submitted successfully. We appreciate you taking the time to help us improve Daryle AI.
                </p>
              </div>
              <Button onClick={handleNewFeedback} variant="outline" className="mt-4">
                Submit More Feedback
              </Button>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="bg-[var(--chat-bg)] border-[var(--chat-border)] text-[var(--chat-text)]">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--chat-card)] border-[var(--chat-border)] text-[var(--chat-text)]">
                  {feedbackCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject (Optional)</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Brief summary of your feedback"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Your Feedback *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Please share your feedback in detail..."
                rows={5}
                maxLength={2000}
                required
              />
              <p className="text-xs text-muted-foreground text-right">
                {formData.message.length}/2000 characters
              </p>
            </div>

            <Button type="submit" disabled={isSubmitting} className="bg-brand-yellow hover:bg-brand-yellow/90 text-brand-blue font-semibold gap-2">
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Submitting...</>
              ) : (
                <><Send className="h-4 w-4" />Submit Feedback</>
              )}
            </Button>
          </form>
          )}
        </div>
      </div>

      {/* Previous Feedback History */}
      <div className="rounded-2xl bg-[var(--chat-card)] border border-[var(--chat-border)] p-6">
        <div className="flex items-center gap-2 mb-1">
          <Clock size={16} className="text-brand-yellow" />
          <h3 className="text-base font-semibold text-[var(--chat-text)]">Your Feedback History</h3>
        </div>
        <p className="text-sm text-[var(--chat-muted)] mb-4">Previous feedback you've submitted</p>
        {isLoadingHistory ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--chat-muted)]" />
          </div>
        ) : previousFeedback.length === 0 ? (
          <p className="text-[var(--chat-muted)] text-center py-8 text-sm">
            You haven't submitted any feedback yet.
          </p>
        ) : (
          <div className="space-y-3">
            {previousFeedback.map((feedback) => (
              <div key={feedback.id} className="rounded-lg border border-[var(--chat-border)] bg-[var(--chat-card-2)] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-brand-yellow/15 text-brand-yellow">
                    {getCategoryLabel(feedback.category)}
                  </span>
                  <span className="text-xs text-[var(--chat-muted)]">
                    {format(new Date(feedback.created_at), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
                {feedback.subject && (
                  <p className="font-medium text-sm text-[var(--chat-text)] mb-1">{feedback.subject}</p>
                )}
                <p className="text-sm text-[var(--chat-muted)] line-clamp-3">{feedback.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneralFeedbackForm;
