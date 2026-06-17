import React from 'react';
import FeedbackEditModal from './FeedbackEditModal';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string;
  originalMessage: string;
  messageRole?: 'bot' | 'user';
  onSubmitted?: (rating: 'thumbs_up' | 'thumbs_down') => void;
}

// Backwards-compatible wrapper — the rating + edit flows now share a single
// combined dialog (FeedbackEditModal). This shim keeps existing call sites
// working without changes.
const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  messageId,
  originalMessage,
  messageRole,
  onSubmitted,
}) => (
  <FeedbackEditModal
    isOpen={isOpen}
    onClose={onClose}
    messageId={messageId}
    originalMessage={originalMessage}
    messageRole={messageRole}
    initialView="feedback"
    onSubmitted={(r) => { if (r) onSubmitted?.(r); }}
  />
);

export default FeedbackModal;
