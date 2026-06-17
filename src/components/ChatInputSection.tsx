
import React, { useMemo } from 'react';
import ChatInputArea from '@/components/ChatInputArea';
import ModeChangeNotification from '@/components/ModeChangeNotification';
import ProjectNewChatHero from '@/components/ProjectNewChatHero';
import { ChatMode } from '@/components/ChatInterface';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useBrand } from '@/context/BrandContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useVisualViewportOffset } from '@/hooks/useVisualViewportOffset';
import { useSidebarState } from '@/hooks/useSidebarState';
import type { UsePromptImprovementReturn } from '@/hooks/usePromptImprovement';
import { FlaskConical, Lightbulb, FileText, ChevronDown, Sparkles, Target, Users, BarChart3 } from 'lucide-react';

interface ChatInputSectionProps {
  messages: any[];
  isLoaded: boolean;
  currentMode: ChatMode;
  setCurrentMode: (mode: ChatMode) => void;
  currentLength: string;
  subPrompts: string[];
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  useKnowledgebase: boolean;
  onKnowledgebaseChange: (value: boolean) => void;
  disabled: boolean;
  onSendMessage: (
    message: string,
    attachments?: Array<{
      fileId: string;
      fileName: string;
      parsedText: string;
      fileType?: string;
      pageCount?: number;
    }>,
  ) => void;
  onStartNewChat: () => void;
  setCurrentLength: (length: string) => void;
  onSubPromptsChange: (subPrompts: string[]) => void;
  pendingModeChange?: ChatMode | null;
  onDismissPendingModeChange?: () => void;
  onMessageSent?: () => void;
  chatInitialized?: boolean;
  lastResponseTimestamp?: number;
  dualResponseMode?: boolean;
  onToggleDualResponse?: (enabled: boolean) => void;
  currentChatId?: string | null;
  folderId?: string | null;
  isStreaming?: boolean;
  onStopGeneration?: () => void;
  promptImprovement?: UsePromptImprovementReturn;
  onToggleSharpen?: () => void;
  isSharpening?: boolean;
  /** Create a real chat row if none exists yet (used when attaching files before sending). */
  ensureChatId?: () => Promise<string | null>;
}

const FEATURE_CARDS: {
  Icon: typeof Target;
  title: string;
  prompts: string[];
}[] = [
  {
    Icon: Target,
    title: 'Character Insight',
    prompts: [
      'What is my mindset?',
      'How do my values shape the decisions I make?',
      'What are my biggest blind spots right now?',
      'Where is my confidence strongest and weakest?',
      'What patterns keep showing up in how I react under pressure?',
      'What does integrity look like for me this week?',
      'How am I growing compared to a year ago?',
    ],
  },
  {
    Icon: Users,
    title: 'Chemistry Assistant',
    prompts: [
      'What helps me understand people beyond first impressions?',
      'How can I read the room better in tense conversations?',
      'What signals tell me someone is genuinely aligned with me?',
      'How do I build trust faster without losing depth?',
      'What is the kindest way to give someone hard feedback?',
      'How do I tell the difference between charm and character?',
      'What questions reveal who someone really is?',
    ],
  },
  {
    Icon: BarChart3,
    title: 'Competency Frameworks',
    prompts: [
      'What makes a business both competitive and enduring?',
      'Which competencies matter most for the next stage of my career?',
      'How do I turn a skill into a durable advantage?',
      'What separates great operators from great leaders?',
      'Where should I be investing my learning hours this quarter?',
      'How do I measure mastery in a field I love?',
      'What is the highest-leverage skill I am currently underusing?',
    ],
  },
];

const QUICK_ACTIONS = [
  { icon: <FlaskConical size={15} />, label: 'Explore Chemistry' },
  { icon: <Lightbulb size={15} />, label: 'Brainstorm Strategy' },
  { icon: <FileText size={15} />, label: 'Make a plan' },
];

const ChatInputSection: React.FC<ChatInputSectionProps> = ({
  messages,
  isLoaded,
  currentMode,
  setCurrentMode,
  currentLength,
  subPrompts,
  selectedModel,
  setSelectedModel,
  useKnowledgebase,
  onKnowledgebaseChange,
  disabled,
  onSendMessage,
  onStartNewChat,
  setCurrentLength,
  onSubPromptsChange,
  pendingModeChange,
  onDismissPendingModeChange,
  onMessageSent,
  chatInitialized = false,
  lastResponseTimestamp = 0,
  dualResponseMode = false,
  onToggleDualResponse,
  currentChatId,
  folderId,
  isStreaming = false,
  onStopGeneration,
  promptImprovement,
  onToggleSharpen,
  isSharpening,
  ensureChatId,
}) => {
  const { user, profile } = useAuth();
  const { activeBrand, productName, logoUrl, logoDarkUrl } = useBrand();
  const isCityChangers = activeBrand?.slug === 'city-changers';
  const isMobile = useIsMobile();
  const keyboardOffset = useVisualViewportOffset();
  const { isOpen: sidebarOpen } = useSidebarState();

  const firstName = profile?.name?.split(' ')[0]
    || user?.user_metadata?.name?.split(' ')[0]
    || user?.email?.split('@')[0]
    || 'there';

  const shouldOffsetForSidebar = !isMobile && (user ? sidebarOpen : true);
  const showCentralizedLayout = messages.length === 0 && isLoaded && !isMobile;

  // Rotate one prompt per category each new chat. Re-seeds whenever the chat id changes
  // (including null → new chat), so every fresh chat surfaces a different question set.
  const rotatedFeatureCards = useMemo(
    () =>
      FEATURE_CARDS.map((card) => ({
        Icon: card.Icon,
        title: card.title,
        desc: card.prompts[Math.floor(Math.random() * card.prompts.length)],
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentChatId],
  );

  if (showCentralizedLayout && folderId) {
    return (
      <ProjectNewChatHero
        folderId={folderId}
        currentChatId={currentChatId}
        inputSlot={
          <ChatInputArea
            key={currentChatId ?? 'new'}
            onSendMessage={(msg, atts) => { onSendMessage(msg, atts); onMessageSent?.(); }}
            onStartNewChat={onStartNewChat}
            currentMode={currentMode}
            setCurrentMode={setCurrentMode}
            currentLength={currentLength}
            setCurrentLength={setCurrentLength}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            useKnowledgebase={useKnowledgebase}
            onKnowledgebaseChange={onKnowledgebaseChange}
            disabled={disabled}
            chatId={currentChatId ?? undefined}
            folderId={folderId ?? null}
            hasMessages={false}
            isBotTyping={disabled}
            isStreaming={isStreaming}
            onStopGeneration={onStopGeneration}
            promptImprovement={promptImprovement}
            onToggleSharpen={onToggleSharpen}
            isSharpening={isSharpening}
            ensureChatId={ensureChatId}
            emptyState
          />
        }
      />
    );
  }

  if (showCentralizedLayout) {
    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-[var(--chat-bg)]">
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-8 pt-20">

          {/* AI logo with soft halo glow */}
          <div className="relative mb-6 w-28 h-28 flex items-center justify-center">
            {/* Soft radial halo */}
            <div
              aria-hidden
              className="absolute inset-0 rounded-full blur-2xl opacity-70"
              style={{
                background:
                  "radial-gradient(circle, hsl(var(--primary) / 0.35) 0%, hsl(var(--primary) / 0.15) 45%, transparent 70%)",
              }}
            />
            {isCityChangers ? (
              <img
                src="/brands/city-changers-icon.png"
                alt={activeBrand?.product_name ?? 'City Changers AI'}
                className="relative w-24 h-24 object-contain drop-shadow-[0_8px_24px_rgba(21,38,69,0.25)] animate-logo-glow"
              />
            ) : activeBrand && (logoUrl || logoDarkUrl) ? (
              <img
                src={logoUrl ?? logoDarkUrl ?? ''}
                alt={productName}
                className="relative w-24 h-24 object-contain drop-shadow-[0_8px_24px_rgba(21,38,69,0.25)] animate-logo-glow"
              />
            ) : (
              <>
                <img
                  src="/lovable-uploads/Daryle_Round_Logo_Light.svg"
                  alt={productName}
                  className="relative w-24 h-24 object-contain drop-shadow-[0_8px_24px_rgba(21,38,69,0.25)] dark:hidden animate-logo-glow"
                />
                <img
                  src="/lovable-uploads/Daryle_Round_Logo.svg"
                  alt={productName}
                  className="relative w-24 h-24 object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.4)] hidden dark:block animate-logo-glow"
                />
              </>
            )}
          </div>

          {/* Heading */}
          <h2 className="text-3xl font-semibold text-[var(--chat-text)] mb-6 text-center">
            What's on your mind, {firstName}?
          </h2>

          {/* Quick action chips */}
          <div className="flex items-center gap-3 mb-6 flex-wrap justify-center">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                onClick={() => onSendMessage(a.label)}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--chat-border)] bg-[var(--ui-bg-hover)] text-[var(--chat-muted)] hover:text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)] hover:border-[var(--chat-border)] transition-all text-sm"
              >
                {a.icon}
                <span>{a.label}</span>
              </button>
            ))}
          </div>

          {/* Input box */}
          <div className="w-full max-w-2xl mb-4">
            <ChatInputArea
              key={currentChatId ?? 'new'}
              onSendMessage={(msg, atts) => { onSendMessage(msg, atts); onMessageSent?.(); }}
              onStartNewChat={onStartNewChat}
              currentMode={currentMode}
              setCurrentMode={setCurrentMode}
              currentLength={currentLength}
              setCurrentLength={setCurrentLength}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              useKnowledgebase={useKnowledgebase}
              onKnowledgebaseChange={onKnowledgebaseChange}
              disabled={disabled}
              chatId={currentChatId ?? undefined}
              folderId={folderId ?? null}
              hasMessages={false}
              isBotTyping={disabled}
              isStreaming={isStreaming}
              onStopGeneration={onStopGeneration}
              promptImprovement={promptImprovement}
              onToggleSharpen={onToggleSharpen}
              isSharpening={isSharpening}
              ensureChatId={ensureChatId}
              emptyState
            />
          </div>

          {/* Spacer instead of redundant Wisdom Mode selector (already in header) */}
          <div className="mb-8" />

          {/* Feature cards — one rotating prompt per category, per new chat */}
          <div className="grid grid-cols-3 gap-4 w-full max-w-2xl">
            {rotatedFeatureCards.map((card) => (
              <button
                key={card.title}
                onClick={() => onSendMessage(card.desc)}
                className="flex flex-col items-start p-5 rounded-xl bg-[var(--chat-input-bg)] border border-[var(--chat-border)] hover:border-[var(--chat-border)] hover:bg-[var(--chat-card-2)] transition-all text-left"
              >
                <span className="mb-3 inline-flex items-center justify-center h-9 w-9 rounded-lg bg-brand-yellow/10 text-brand-yellow">
                  <card.Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <span className="text-sm font-semibold text-[var(--chat-text)] mb-1">{card.title}</span>
                <span className="text-xs text-[var(--chat-muted)] leading-relaxed">{card.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Regular bottom input bar (has messages)
  return (
    <div
      className={`fixed right-0 transition-all duration-200 bg-[var(--chat-bg)] border-t border-[var(--chat-border)] px-4 py-3 z-50 ${
        shouldOffsetForSidebar ? 'left-[288px]' : 'left-0'
      } ${keyboardOffset === 0 ? 'safe-bottom' : ''}`}
      style={{ bottom: keyboardOffset }}
    >
      {pendingModeChange && (
        <ModeChangeNotification
          mode={pendingModeChange}
          onDismiss={onDismissPendingModeChange || (() => {})}
        />
      )}

      <div className="max-w-3xl mx-auto">
        <ChatInputArea
          key={currentChatId ?? 'new'}
          onSendMessage={(msg, atts) => { onSendMessage(msg, atts); onMessageSent?.(); }}
          onStartNewChat={onStartNewChat}
          currentMode={currentMode}
          setCurrentMode={setCurrentMode}
          currentLength={currentLength}
          setCurrentLength={setCurrentLength}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          useKnowledgebase={useKnowledgebase}
          onKnowledgebaseChange={onKnowledgebaseChange}
          disabled={disabled}
          chatId={currentChatId ?? undefined}
          folderId={folderId ?? null}
          hasMessages={messages.length > 0}
          isBotTyping={disabled}
          isStreaming={isStreaming}
          onStopGeneration={onStopGeneration}
          promptImprovement={promptImprovement}
          onToggleSharpen={onToggleSharpen}
          isSharpening={isSharpening}
          ensureChatId={ensureChatId}
        />
      </div>
    </div>
  );
};

export default ChatInputSection;
