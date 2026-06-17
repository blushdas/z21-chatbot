export type ChatMode = "coach";
export type Mode = ChatMode;

export type ResponseMode = "coaching" | "direct_quotes" | "storytelling";
export type ResponseLength = "short" | "medium" | "long";
export type LLMModel = "auto" | "openai" | "claude";

export interface MessageType {
  id: string;
  sender: "user" | "daryle" | "system" | "verification";
  content: string;
  timestamp: Date;
  mode: ChatMode;
  chatId?: string;
  citation?: {
    source: string;
    title: string;
    url?: string;
  } | string;
  intent?: string;
  sources?: Array<{
    title: string;
    url?: string;
    date?: string;
    type?: string;
  }>;
  isSystemMessage?: boolean;
  responseStyle?: 'standard' | 'quickAnswer' | 'directQuotes' | 'storytelling';
  model?: 'grounded' | 'fast' | 'deep' | 'auto' | 'chatgpt' | 'claude' | 'chatgpt-claude' | 'gemini';
  knowledgeBaseEnabled?: boolean;
  routeMetadata?: {
    route: string;
    modelsUsed: string[];
    stageTimings: Array<{ model: string; durationMs: number }>;
    totalDurationMs: number;
    classification?: string;
  };
  wasSharpened?: boolean;
  originalPrompt?: string;
}
