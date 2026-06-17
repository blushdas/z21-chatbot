import { Sparkles, Zap, Quote, BookOpen, Compass, Wand2, Mic } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Shared icon map for response/wisdom modes. Keep in sync between the
// ChatHeader mode pill and the in-chat ModeChangeDivider so the icon the
// user picks in the header matches what they see in the transcript.
export const modeIconMap: Record<string, LucideIcon> = {
  quickAnswer: Zap,
  quickanswer: Zap,
  standard: Sparkles,
  coach: Sparkles, // legacy alias for Wisdom Mode
  directQuotes: Quote,
  directquotes: Quote,
  storytelling: BookOpen,
  noBlueprints: Wand2,
  noblueprints: Wand2,
  no_blueprints: Wand2,
  founderVoiceAlanPlatt: Mic,
};

export const getModeIcon = (mode?: string): LucideIcon => {
  if (!mode) return Compass;
  const key = mode.trim();
  return modeIconMap[key] || modeIconMap[key.toLowerCase()] || Compass;
};