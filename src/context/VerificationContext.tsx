import React, { createContext, useContext, useState, useCallback } from 'react';
import type { MessageType } from '@/components/ChatInterface';

interface VerificationContextType {
  /** The latest assistant message from the main chat */
  lastAssistantMessage: MessageType | null;
  /** Push a new assistant message for verification */
  pushAssistantMessage: (msg: MessageType) => void;
  /** Whether verification mode is active (context is being consumed) */
  active: boolean;
}

const VerificationContext = createContext<VerificationContextType | null>(null);

export const VerificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lastAssistantMessage, setLastAssistantMessage] = useState<MessageType | null>(null);

  const pushAssistantMessage = useCallback((msg: MessageType) => {
    console.log('[VerificationContext] 📨 pushAssistantMessage called, msg id:', msg.id, 'sender:', msg.sender);
    setLastAssistantMessage(msg);
  }, []);

  return (
    <VerificationContext.Provider value={{ lastAssistantMessage, pushAssistantMessage, active: true }}>
      {children}
    </VerificationContext.Provider>
  );
};

export const useVerificationContext = () => useContext(VerificationContext);
