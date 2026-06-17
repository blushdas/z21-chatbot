import React from 'react';
import FeedbackEditModal from './FeedbackEditModal';

interface EditAnswerModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalMessage: string;
  messageId: string;
  onSubmit: (editedMessage: string, feedback: string) => void;
  chatId?: string;
}

// Backwards-compatible wrapper — the edit flow now lives in the combined
// FeedbackEditModal. Opens with the "improve / rate details" section
// expanded by default.
const EditAnswerModal: React.FC<EditAnswerModalProps> = ({
  isOpen,
  onClose,
  originalMessage,
  messageId,
  onSubmit,
  chatId,
}) => (
  <FeedbackEditModal
    isOpen={isOpen}
    onClose={onClose}
    originalMessage={originalMessage}
    messageId={messageId}
    chatId={chatId ?? null}
    initialView="edit"
    onSubmitEdit={onSubmit}
  />
);

export default EditAnswerModal;
