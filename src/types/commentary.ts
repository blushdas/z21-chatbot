// Commentary Layer — Voice-agnostic type definitions

export type CommentaryDisplayMode = 'inline' | 'sidebar' | 'off';

export type CommentaryAction =
  | 'offered'
  | 'accepted'
  | 'declined'
  | 'auto_generated'
  | 'dismissed';

export type CommentaryOfferState =
  | 'idle'
  | 'offered'
  | 'accepted'
  | 'generating'
  | 'complete'
  | 'declined';

export type CommentaryVoice = {
  id: string;
  name: string;
  icon: string; // Lucide icon name
  colorScheme: {
    bg: string;
    border: string;
    text: string;
    accent: string;
    avatarFrom: string;
    avatarTo: string;
  };
  systemPrompt: string;
};

export type CommentaryEntry = {
  messageId: string;
  voiceId: string;
  voiceName: string;
  content: string;
  generatedAt: Date;
  isStreaming: boolean;
  displayMode: CommentaryDisplayMode;
};

export type CommentaryOffer = {
  messageId: string;
  userQuestion: string;
  mainAnswer: string;
  state: CommentaryOfferState;
};

export type CommentaryState = {
  isEnabled: boolean;
  displayMode: CommentaryDisplayMode;
  activeVoice: CommentaryVoice;
  currentOffer: CommentaryOffer | null;
  commentaryMap: Record<string, CommentaryEntry>;
  isGenerating: boolean;
  streamingContent: string;
};
