
import { useState, useCallback } from 'react';
import { MessageType, ChatMode } from '@/components/ChatInterface';

interface EditModalData {
  messageId: string;
  currentContent: string;
  mode?: string;
  chatId?: string;
}

export const useEditAnswer = () => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<MessageType | null>(null);

  const startEdit = useCallback((message: MessageType) => {
    setEditingMessage(message);
    setEditModalOpen(true);
  }, []);

  const openEditModal = useCallback((data: EditModalData) => {
    // Create a mock message from the edit data
    const mockMessage: MessageType = {
      id: data.messageId,
      content: data.currentContent,
      sender: 'daryle',
      timestamp: new Date(),
      mode: (data.mode as ChatMode) || 'coach',
      chatId: data.chatId // Include chatId in the mock message
    };
    setEditingMessage(mockMessage);
    setEditModalOpen(true);
  }, []);

  const closeEdit = useCallback(() => {
    setEditModalOpen(false);
    setEditingMessage(null);
  }, []);

  const submitEdit = useCallback((editedMessage: string, feedback: string) => {
    console.log('Edit submitted:', {
      messageId: editingMessage?.id,
      originalMessage: editingMessage?.content,
      editedMessage,
      feedback,
      chatId: editingMessage?.chatId,
      timestamp: new Date().toISOString()
    });
    
    // The actual storage is now handled in the modal component via Supabase
    // This hook just manages the state
  }, [editingMessage]);

  return {
    editModalOpen,
    editingMessage,
    startEdit,
    openEditModal,
    closeEdit,
    submitEdit
  };
};
