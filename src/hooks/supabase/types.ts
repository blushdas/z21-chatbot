
import { MessageType, ChatMode } from '@/components/ChatInterface';

export interface ModeChangeEvent {
  id: string;
  type: 'mode' | 'model' | 'power' | 'blueprint';
  value: string;
  timestamp: string;
}

export interface SupabaseChat {
  id: string;
  title: string;
  messages: MessageType[];
  created_at: string;
  updated_at: string;
  mode: ChatMode;
  user_id: string;
  pinned: boolean;
  isTypingTitle: boolean;
  shouldAnimateTitle?: boolean;
  folder_id?: string | null;
  mode_change_events?: ModeChangeEvent[];
}
