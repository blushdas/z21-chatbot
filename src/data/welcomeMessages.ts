
import { ChatMode } from '@/components/ChatInterface';

export interface WelcomeMessageConfig {
  title: string;
  description: string;
  icon: string; // Emoji
  citation?: string;
  className?: string;
}

export type WelcomeMessagesType = {
  [key in ChatMode]: WelcomeMessageConfig;
};

export const welcomeMessages: WelcomeMessagesType = {
  "coach": {
    title: "Welcome to the Daryle AI Beta!",
    description: "You're among the first to experience Daryle AI. As a beta release, you may encounter occasional bugs or unexpected behavior as we continue to refine the platform. Your feedback is invaluable—please don't hesitate to share your thoughts and report any issues you encounter.",
    icon: "🌿",
    citation: "In Search of Wisdom",
    className: "border-l-brand-green"
  },
  "advisor": {
    title: "Advisor Mode",
    description: "Bring a problem. Get practical guidance. I'll diagnose before recommending, surface tradeoffs honestly, and help you think through next steps.",
    icon: "🧭",
    citation: "Advisor Mode",
    className: "border-l-brand-green"
  }
};
