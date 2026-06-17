import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, HelpCircle, Menu, ShieldCheck, PanelRight, MessageSquare, Sparkles, Zap, Quote, Wand2, FolderOpen, Mic } from 'lucide-react';
import { ChatMode, ResponseMode, MessageType } from '@/components/ChatInterface';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useBrand } from '@/context/BrandContext';
import { modeLabelMap } from '@/utils/messageMetadataLabels';
import { getModeIcon } from '@/utils/modeIcons';
import { SaveStatus } from '@/hooks/useSaveStatusIndicator';
import { useSidebarState } from '@/hooks/useSidebarState';
import { useFolders } from '@/context/FolderContext';
import { Link } from 'react-router-dom';
import ChatHeaderMenu from '@/components/ChatHeaderMenu';
import { useChatManagementContext } from '@/context/ChatManagementContext';
import GuidedTourButton from '@/components/tour/GuidedTourButton';
import FavoritesButton from '@/components/favorites/FavoritesButton';
import CanvasesButton from '@/components/canvases/CanvasesButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const WISDOM_MODES = [
  { value: 'quickAnswer', label: 'Standard Mode',  description: 'Concise, direct answers',                  icon: Zap },
  { value: 'standard',    label: 'Wisdom Mode',   description: 'Daryle\'s full wisdom and teaching style', icon: Sparkles },
  { value: 'directQuotes',label: 'Direct Quotes',  description: 'Responses grounded in Daryle\'s exact words', icon: Quote },
  { value: 'noBlueprints',label: 'No Blueprints',  description: 'Raw model output — no Daryle prompts (KB still used if enabled)', icon: Wand2 },
];

const FOUNDER_VOICE_ALAN_PLATT = {
  value: 'founderVoiceAlanPlatt',
  label: 'Founder Voice: Alan Platt',
  description: "Responses shaped by Alan Platt's voice and teaching",
  icon: Mic,
};

interface ChatHeaderProps {
  currentMode: ChatMode;
  currentLength: string;
  chatTitle: string | null;
  sessionStartTime: Date;
  chatCreatedAt?: Date;
  subPrompts: string[];
  onModeChange: (mode: string) => void;
  onLengthChange: (length: string) => void;
  onUpdateTitle: (title: string) => void;
  onSubPromptsChange: (subPrompts: string[]) => void;
  isBotTyping?: boolean;
  chatId?: string | null;
  folderId?: string | null;
  onRenameChat?: () => void;
  onDeleteChat?: () => void;
  dualResponseMode?: boolean;
  onToggleDualResponse?: (enabled: boolean) => void;
  messages?: MessageType[];
  responseMode?: ResponseMode;
  onResponseModeChange?: (mode: ResponseMode) => void;
  saveStatus?: SaveStatus;
  selectedMode?: string;
  selectedModel?: string;
  inlineVerificationEnabled?: boolean;
  onToggleInlineVerification?: (enabled: boolean) => void;
  verificationCount?: number;
  splitScreenVerification?: boolean;
  onToggleSplitScreenVerification?: (enabled: boolean) => void;
  onToggleResourcesPanel?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  currentMode,
  chatTitle,
  chatCreatedAt,
  onModeChange,
  subPrompts = ['quickAnswer'],
  onSubPromptsChange,
  isBotTyping = false,
  chatId,
  folderId,
  onRenameChat,
  onDeleteChat,
  messages = [],
  saveStatus = 'idle',
  selectedMode,
  selectedModel,
  inlineVerificationEnabled = false,
  onToggleInlineVerification,
  verificationCount = 0,
  splitScreenVerification = false,
  onToggleSplitScreenVerification,
  onToggleResourcesPanel,
}) => {
  const { user, profile } = useAuth();
  const { activeBrand } = useBrand();
  const isCityChangers = activeBrand?.slug === 'city-changers';
  const wisdomModes = isCityChangers ? [...WISDOM_MODES, FOUNDER_VOICE_ALAN_PLATT] : WISDOM_MODES;
  const voiceName = activeBrand?.product_name ?? 'Daryle';
  const brandedWisdomModes = wisdomModes.map((m) => ({
    ...m,
    description: m.description.replace(/Daryle/g, voiceName),
  }));
  const { deleteChat } = useChatManagementContext();
  const { openSidebar, isOpen: sidebarOpen } = useSidebarState();
  const { folders } = useFolders();
  const currentFolder = folderId ? folders.find(f => f.id === folderId) : null;
  const [wisdomOpen, setWisdomOpen] = useState(false);
  const wisdomRef = useRef<HTMLDivElement>(null);

  const activeSubPrompt = subPrompts[0] ?? 'quickAnswer';
  const modeLabel = modeLabelMap[activeSubPrompt] ?? 'Wisdom Mode';
  const ActiveModeIcon = getModeIcon(activeSubPrompt);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wisdomRef.current && !wisdomRef.current.contains(e.target as Node)) {
        setWisdomOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = async () => {
    if (chatId && onDeleteChat) {
      await deleteChat(chatId);
      onDeleteChat();
    }
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-30 h-16 flex items-center justify-between px-5 bg-[var(--chat-header-bg)] border-b border-[var(--chat-border)]">
      {/* Left: mobile sidebar + Wisdom Mode */}
      <div className="flex items-center gap-3">
        {user && (
          <button
            className="sm:hidden text-[var(--ui-icon)] hover:text-[var(--ui-icon-hover)] transition-colors"
            onClick={openSidebar}
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
        )}
        {user && !sidebarOpen && (
          <button
            className="hidden sm:flex text-[var(--ui-icon)] hover:text-[var(--ui-icon-hover)] transition-colors"
            onClick={openSidebar}
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
        )}

        {/* Wisdom Mode pill — opens sub-mode dropdown */}
        <div className="relative" ref={wisdomRef} data-tour="modes">
          <button
            onClick={() => setWisdomOpen(prev => !prev)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand-yellow hover:bg-brand-yellow/90 text-brand-blue text-sm font-semibold transition-colors"
          >
            <ActiveModeIcon size={14} className="text-brand-blue" />
            <span>{modeLabel}</span>
            <ChevronDown size={13} className={`text-brand-blue/70 transition-transform ${wisdomOpen ? 'rotate-180' : ''}`} />
          </button>

          {wisdomOpen && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-[var(--chat-card)] rounded-lg shadow-xl border border-[var(--chat-border)] z-[99999] overflow-hidden">
              <div className="px-3 py-2 border-b border-[var(--chat-border)] bg-[var(--chat-card-2)]">
                <p className="text-xs font-medium text-[var(--chat-muted)]">Choose response style</p>
              </div>
              {brandedWisdomModes.map((mode) => {
                const Icon = mode.icon;
                const isActive = activeSubPrompt === mode.value;
                return (
                  <button
                    key={mode.value}
                    onClick={() => { onSubPromptsChange?.([mode.value]); setWisdomOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 flex items-start gap-3 transition-colors ${
                      isActive
                        ? 'bg-brand-yellow/10 text-brand-yellow'
                        : 'text-[var(--chat-text)] hover:bg-[var(--chat-card-2)]'
                    }`}
                  >
                    <Icon size={15} className={`mt-0.5 flex-shrink-0 ${isActive ? 'text-brand-yellow' : 'text-[var(--chat-muted)]'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{mode.label}</span>
                        {isActive && <div className="w-1.5 h-1.5 bg-brand-yellow rounded-full" />}
                      </div>
                      <p className="text-xs text-[var(--chat-muted)] mt-0.5">{mode.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Coach / Advisor mode toggle */}
        <div className="flex items-center rounded-full bg-[var(--chat-card)] border border-[var(--chat-border)]">
          {(['coach', 'advisor'] as const).map((m, i) => {
            const isActive = currentMode === m;
            const label = m === 'coach' ? 'Daryle AI' : 'Advisor';
            const icon = m === 'coach' ? '🌿' : '🧭';
            return (
              <button
                key={m}
                onClick={() => onModeChange(m)}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm font-semibold transition-colors ${i === 0 ? 'rounded-l-full' : 'rounded-r-full'} ${isActive ? 'bg-brand-yellow text-brand-blue' : 'text-[var(--chat-text)] hover:bg-[var(--chat-card-2)]'}`}
              >
                <span>{icon}</span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>

        {currentFolder && (
          <Link
            to={`/folder/${currentFolder.id}`}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--chat-card-2)] hover:bg-[var(--ui-bg-hover)] text-[var(--chat-text)] text-sm font-medium transition-colors border border-[var(--chat-border)] max-w-[240px]"
            title={`Project: ${currentFolder.title}`}
          >
            <FolderOpen size={13} className="text-brand-yellow flex-shrink-0" />
            <span className="text-[var(--chat-muted)]">Project:</span>
            <span className="truncate">{currentFolder.title}</span>
          </Link>
        )}
      </div>

      {/* Right: superadmin tools + chat menu + help */}
      <div className="flex items-center gap-2">
        {user && <FavoritesButton />}
        {user && <CanvasesButton />}
        {user && <GuidedTourButton />}
        {/* Superadmin verification demos */}
        {profile?.role === 'superadmin' && onToggleInlineVerification && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium transition-all ${
                  inlineVerificationEnabled
                    ? 'bg-teal-600 text-white hover:bg-teal-700'
                    : 'text-[var(--ui-icon)] hover:text-[var(--ui-icon-hover)] hover:bg-[var(--ui-bg-hover)]'
                }`}
              >
                <ShieldCheck size={14} />
                <span className="hidden sm:inline">{inlineVerificationEnabled ? 'Verifying' : 'Verify'}</span>
                {inlineVerificationEnabled && verificationCount > 0 && (
                  <span className="text-[9px] bg-[var(--ui-bg-hover)] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {verificationCount}
                  </span>
                )}
                <ChevronDown size={11} className="opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-[var(--chat-card)] border-[var(--chat-border)] text-[var(--chat-text)]">
              <DropdownMenuItem
                onClick={() => onToggleInlineVerification(!inlineVerificationEnabled)}
                className="flex items-start gap-3 py-2.5 cursor-pointer hover:bg-[var(--ui-bg-hover)]"
              >
                <MessageSquare size={16} className="mt-0.5 text-teal-500 flex-shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-sm">Inline Verification</span>
                  <span className="text-[11px] text-[var(--ui-icon)]">Companion responds inline after each message</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onToggleSplitScreenVerification?.(!splitScreenVerification)}
                className="flex items-start gap-3 py-2.5 cursor-pointer hover:bg-[var(--ui-bg-hover)]"
              >
                <PanelRight size={16} className="mt-0.5 text-indigo-400 flex-shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-sm">Split-Screen Verification</span>
                  <span className="text-[11px] text-[var(--ui-icon)]">Side-by-side with verification panel</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Chat menu (rename/delete/export) */}
        {user?.id && chatId && messages.length > 0 && (
          <ChatHeaderMenu
            chatId={chatId}
            chatTitle={chatTitle || 'New Conversation'}
            currentFolderId={folderId}
            onRename={onRenameChat ?? (() => {})}
            onDelete={handleDelete}
            messages={messages}
            mode={currentMode}
            createdAt={chatCreatedAt?.toISOString()}
            selectedMode={selectedMode}
            selectedModel={selectedModel}
          />
        )}

        {/* Resources panel temporarily hidden */}
      </div>
    </div>
  );
};

export default ChatHeader;
