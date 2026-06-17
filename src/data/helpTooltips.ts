export const helpTooltips = {
  // Chat Interface
  messageInput: 'Type your question or message here. Press Enter to send or Shift+Enter for a new line.',
  modeSelector: 'Choose a conversation mode that matches your goal: Coach for leadership, Family for personal wisdom, Investor for strategic insights, etc.',
  toneSelector: 'Adjust how responses sound - from direct and concise to warm and reflective.',
  lengthSelector: 'Control response detail level - from brief summaries to in-depth, story-driven insights.',
  
  // Saved Chats
  savedChats: 'All your conversations are automatically saved here. Click any chat to continue where you left off.',
  folders: 'Organize your conversations into folders for better management. Click to create or manage folders.',
  searchChats: 'Search through all your saved conversations by keywords, dates, or modes.',
  pinChat: 'Pin important conversations to keep them at the top of your list.',
  
  // Messages
  favoriteMessage: 'Save this response to your favorites for quick access later. View all favorites in your profile.',
  copyMessage: 'Copy this message to your clipboard.',
  editAnswer: 'Provide feedback on this response to help improve future interactions.',
  
  // Features
  newChat: 'Start a fresh conversation. Your previous chat will be automatically saved.',
  exportChat: 'Download this conversation as a PDF to save offline or share.',
  citationVisibility: 'Toggle the visibility of source citations in responses.',
  
  // Profile
  preferences: 'Set your default mode, tone, and length preferences for new conversations.',
  favorites: 'Access all your saved favorite responses in one place.',
  documents: 'Upload documents to enhance responses with your own content and context.',
  
  // Onboarding
  welcomeOnboarding: 'Let\'s get you started with a quick tour of Daryle AI\'s features.',
  skipOnboarding: 'Skip this tutorial and explore on your own. You can revisit it anytime from Help.',
} as const;

export type HelpTooltipKey = keyof typeof helpTooltips;
