
import { ChatMode } from '@/components/ChatInterface';

export interface CuratedPromptSuggestion {
  id: string;
  text: string;
  description?: string;
  theme: 'character' | 'chemistry' | 'competency';
}

export type CuratedPromptSuggestionsType = {
  [key in ChatMode]: CuratedPromptSuggestion[];
};

// Hardcoded 3 C's prompt suggestions - Character, Chemistry, Competency
export const curatedPromptSuggestions: CuratedPromptSuggestionsType = {
  "coach": [
    // Character Questions (17)
    {
      id: "character-1",
      text: "What shapes the way I think and make decisions?",
      theme: "character"
    },
    {
      id: "character-2",
      text: "How do I grow in self-awareness and empathy toward others?",
      theme: "character"
    },
    {
      id: "character-3",
      text: "How do I understand what's really motivating me?",
      theme: "character"
    },
    {
      id: "character-4",
      text: "What are my primary motivators?",
      theme: "character"
    },
    {
      id: "character-5",
      text: "How does my mindset shape the person I'm becoming?",
      theme: "character"
    },
    {
      id: "character-6",
      text: "What is my mindset?",
      theme: "character"
    },
    {
      id: "character-7",
      text: "How can I let purpose guide me more than pressure?",
      theme: "character"
    },
    {
      id: "character-8",
      text: "Am I more responsibility-driven or reward-driven?",
      theme: "character"
    },
    {
      id: "character-9",
      text: "How do I respond with wisdom when emotions run high?",
      theme: "character"
    },
    {
      id: "character-10",
      text: "What helps me hold conviction and compassion at the same time?",
      theme: "character"
    },
    {
      id: "character-11",
      text: "How can I live for something that truly lasts?",
      theme: "character"
    },
    {
      id: "character-12",
      text: "What are my deepest convictions?",
      theme: "character"
    },
    {
      id: "character-13",
      text: "How do I handle my emotions with wisdom and grace?",
      theme: "character"
    },
    {
      id: "character-14",
      text: "What could help me be more self-regulated?",
      theme: "character"
    },
    {
      id: "character-15",
      text: "What does it mean to lead my emotions, not be led by them?",
      theme: "character"
    },
    {
      id: "character-16",
      text: "What helps me choose well when everything feels important?",
      theme: "character"
    },
    {
      id: "character-17",
      text: "What are the attributes of a winning attitude? How can I cultivate those?",
      theme: "character"
    },

    // Chemistry Questions (17)
    {
      id: "chemistry-1",
      text: "How can I listen in a way that helps others feel understood?",
      theme: "chemistry"
    },
    {
      id: "chemistry-2",
      text: "How might I demonstrate curiosity in another person?",
      theme: "chemistry"
    },
    {
      id: "chemistry-3",
      text: "What helps me understand people beyond first impressions?",
      theme: "chemistry"
    },
    {
      id: "chemistry-4",
      text: "How do I call out the best in someone with grace and truth?",
      theme: "chemistry"
    },
    {
      id: "chemistry-5",
      text: "How do I truly get to know someone's heart?",
      theme: "chemistry"
    },
    {
      id: "chemistry-6",
      text: "Why does collaboration work?",
      theme: "chemistry"
    },
    {
      id: "chemistry-7",
      text: "What are the biggest barriers to collaboration?",
      theme: "chemistry"
    },
    {
      id: "chemistry-8",
      text: "What kind of culture helps great teams thrive?",
      theme: "chemistry"
    },
    {
      id: "chemistry-9",
      text: "How do I help strong individuals make the team stronger?",
      theme: "chemistry"
    },
    {
      id: "chemistry-10",
      text: "What builds a team that's both connected and effective?",
      theme: "chemistry"
    },
    {
      id: "chemistry-11",
      text: "How do I handle conflict with both truth and grace?",
      theme: "chemistry"
    },
    {
      id: "chemistry-12",
      text: "How do I handle conflict effectively?",
      theme: "chemistry"
    },
    {
      id: "chemistry-13",
      text: "How might I diffuse a tense situation?",
      theme: "chemistry"
    },
    {
      id: "chemistry-14",
      text: "What truly builds trust between people?",
      theme: "chemistry"
    },
    {
      id: "chemistry-15",
      text: "What helps us think better together instead of pulling apart?",
      theme: "chemistry"
    },
    {
      id: "chemistry-16",
      text: "What helps us choose team members who strengthen our culture and mission?",
      theme: "chemistry"
    },
    {
      id: "chemistry-17",
      text: "Why is team chemistry important?",
      theme: "chemistry"
    },

    // Competency Questions (11)
    {
      id: "competency-1",
      text: "What makes a business both competitive and enduring?",
      theme: "competency"
    },
    {
      id: "competency-2",
      text: "What kind of planning turns vision into action?",
      theme: "competency"
    },
    {
      id: "competency-3",
      text: "How do I lead change that people believe in?",
      theme: "competency"
    },
    {
      id: "competency-4",
      text: "What kind of leadership keeps an organization wise and accountable?",
      theme: "competency"
    },
    {
      id: "competency-5",
      text: "How do I make decisions that protect both mission and people?",
      theme: "competency"
    },
    {
      id: "competency-6",
      text: "How do I get to the heart of a problem before solving it?",
      theme: "competency"
    },
    {
      id: "competency-7",
      text: "How do I think through complex problems with wisdom and clarity?",
      theme: "competency"
    },
    {
      id: "competency-8",
      text: "How can we solve problems with both clarity and perspective?",
      theme: "competency"
    },
    {
      id: "competency-9",
      text: "How can I steward my time for what makes the greatest impact?",
      theme: "competency"
    },
    {
      id: "competency-10",
      text: "How do I invest what God's given me in what truly matters?",
      theme: "competency"
    },
    {
      id: "competency-11",
      text: "Why is problem solving an important skill for leaders?",
      theme: "competency"
    }
  ],
  "advisor": [
    {
      id: "advisor-character-1",
      text: "How should I handle a team member who's underperforming?",
      theme: "character"
    },
    {
      id: "advisor-character-2",
      text: "I'm second-guessing a hard call I made last week — how do I think about it?",
      theme: "character"
    },
    {
      id: "advisor-character-3",
      text: "How do I stay grounded when a decision puts my values under pressure?",
      theme: "character"
    },
    {
      id: "advisor-chemistry-1",
      text: "What's the best way to navigate a conflict between two senior leaders?",
      theme: "chemistry"
    },
    {
      id: "advisor-chemistry-2",
      text: "A key teammate is disengaging. How should I approach the conversation?",
      theme: "chemistry"
    },
    {
      id: "advisor-chemistry-3",
      text: "How do I rebuild trust with a peer after a public disagreement?",
      theme: "chemistry"
    },
    {
      id: "advisor-competency-1",
      text: "Help me think through the tradeoffs of restructuring our team.",
      theme: "competency"
    },
    {
      id: "advisor-competency-2",
      text: "We're losing money on a contract — should we renegotiate or walk?",
      theme: "competency"
    },
    {
      id: "advisor-competency-3",
      text: "How do I sequence a launch when engineering and sales disagree on timing?",
      theme: "competency"
    }
  ]
};

// Theme colors for visual distinction - 3 C's only
export const themeColors: Record<string, string> = {
  character: "bg-purple-50 border-purple-200 text-purple-800",
  chemistry: "bg-blue-50 border-blue-200 text-blue-800",
  competency: "bg-green-50 border-green-200 text-green-800"
};

// Theme icons - 3 C's only
export const themeIcons: Record<string, string> = {
  character: "💎",
  chemistry: "🤝",
  competency: "📊"
};
