export type TourStepPlacement = 'top' | 'bottom' | 'left' | 'right' | 'auto' | 'inside-top-left';

export interface TourStep {
  id: string;
  order: number;
  /** CSS selector resolved at runtime. First match wins. */
  targetSelector: string | null;
  title: string;
  body: string;
  placement: TourStepPlacement;
  /** Optional setup hook id, handled by TourRunner. */
  beforeShow?: 'open-sidebar';
  /** Show an "Alpha" badge next to the title in the tooltip. */
  alpha?: boolean;
}

export const TOUR_ID = 'main';

export const tourSteps: TourStep[] = [
  {
    id: 'chat-area',
    order: 1,
    targetSelector: '[data-tour="chat-area"]',
    title: 'Chat Area',
    body: 'Talk with Daryle AI here. Ask questions, draft content, summarize files, or continue previous work.',
    placement: 'inside-top-left',
  },
  {
    id: 'modes',
    order: 2,
    targetSelector: '[data-tour="modes"]',
    title: 'Modes',
    body: 'Change how Daryle responds for writing, research, strategy, verification, coaching, or other workflows.',
    placement: 'top',
  },
  {
    id: 'prompt-input',
    order: 3,
    targetSelector: '[data-tour="prompt-input"]',
    title: 'Your Prompt',
    body: 'This is where you chat with Daryle. Type your question, request, or prompt here — then press Enter or the send arrow to start the conversation.',
    placement: 'top',
  },
  {
    id: 'processing-power',
    order: 4,
    targetSelector: '[data-tour="processing-power"]',
    title: 'Processing Power',
    body: 'Choose lighter processing for quick answers or stronger processing for complex strategy, analysis, and writing.',
    placement: 'top',
  },
  {
    id: 'ai-model',
    order: 5,
    targetSelector: '[data-tour="ai-model"]',
    title: 'AI Model',
    body: 'Pick a model, or let Daryle choose the best fit for speed, reasoning, writing, coding, or research.',
    placement: 'top',
  },
  {
    id: 'knowledge-base',
    order: 6,
    targetSelector: '[data-tour="knowledge-base"]',
    title: 'Knowledge Base',
    body: 'Bring approved company, project, or internal knowledge into the chat so answers use the right context.',
    placement: 'top',
  },
  {
    id: 'prompt-sharpener',
    order: 7,
    targetSelector: '[data-tour="prompt-sharpener"]',
    title: 'Prompt Sharpener',
    body: 'Improve your request before sending it so Daryle gets clearer, more specific instructions.',
    placement: 'top',
  },
  {
    id: 'file-uploads',
    order: 8,
    targetSelector: '[data-tour="file-upload"]',
    title: 'File Uploads',
    body: 'Upload PDFs, Word docs, text files, or Markdown so Daryle can summarize, compare, extract, or rewrite.',
    placement: 'top',
    alpha: true,
  },
  {
    id: 'canvases',
    order: 9,
    targetSelector: '[data-tour="canvas-button"]',
    title: 'Canvases',
    body: 'Open editable work areas for drafting, revising, and organizing content alongside the chat.',
    placement: 'left',
    alpha: true,
  },
  {
    id: 'saved-chats',
    order: 10,
    targetSelector: '[data-tour="saved-chats"]',
    title: 'Saved Chats',
    body: 'Return to past conversations, continue earlier work, or reference previous outputs.',
    placement: 'right',
    beforeShow: 'open-sidebar',
  },
  {
    id: 'projects',
    order: 11,
    targetSelector: '[data-tour="projects"]',
    title: 'Projects',
    body: 'Group related chats, instructions, sources, and context around a topic, team, client, or initiative.',
    placement: 'right',
    beforeShow: 'open-sidebar',
  },
  {
    id: 'favorites',
    order: 13,
    targetSelector: '[data-tour="favorites"]',
    title: 'Favorites',
    body: 'Quickly reach important chats, projects, canvases, and saved items without searching.',
    placement: 'bottom',
  },
  {
    id: 'profile-settings',
    order: 14,
    targetSelector: '[data-tour="profile-settings"]',
    title: 'Profile and Settings',
    body: 'Manage account preferences, appearance, access, and other personal settings here.',
    placement: 'top',
    beforeShow: 'open-sidebar',
  },
  {
    id: 'finish',
    order: 15,
    targetSelector: '[data-tour="guided-tour-button"]',
    title: "You're Ready",
    body: 'Restart this tour anytime from the top right header, or exit whenever you want.',
    placement: 'bottom',
  },
];