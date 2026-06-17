import React, { useState, useRef, useEffect, useCallback } from 'react';
import Z21Sidebar, { SidebarChat, loadChats, saveChats } from './Z21Sidebar';
import { Menu, Plus } from 'lucide-react';

const STORAGE_KEY = 'z21_chats';
const WELCOME_MSG = {
  id: 'welcome',
  role: 'assistant' as const,
  content: 'Z21 Chatbot. Ask me anything.',
  timestamp: new Date(),
};

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatState {
  id: string;
  title: string;
  messages: ChatMessage[];
}

function newChatId() {
  return `chat_${Date.now()}`;
}

function genId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function makeChat(title = 'New Chat'): ChatState {
  return { id: newChatId(), title, messages: [{ ...WELCOME_MSG, id: genId() }] };
}

export default function ChatShell() {
  const [chats, setChats] = useState<ChatState[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load chats from localStorage on mount
  useEffect(() => {
    const stored = loadChats();
    if (stored.length === 0) {
      const initial = makeChat();
      setChats([initial]);
      setActiveChatId(initial.id);
    } else {
      // Rebuild full chat states from sidebar metadata
      const rebuilt: ChatState[] = stored.map((s) => ({
        id: s.id,
        title: s.title,
        messages: [{ ...WELCOME_MSG, id: genId() }],
      }));
      setChats(rebuilt);
      setActiveChatId(stored[0].id);
    }
  }, []);

  // Persist sidebar chat list to localStorage
  useEffect(() => {
    if (chats.length === 0) return;
    const sidebar: SidebarChat[] = chats.map((c) => ({
      id: c.id,
      title: c.title,
      preview: c.messages[c.messages.length - 1]?.content.slice(0, 60) ?? '',
      updatedAt: Date.now(),
    }));
    saveChats(sidebar);
  }, [chats]);

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [input]);

  const startNewChat = useCallback(() => {
    const chat = makeChat();
    setChats((prev) => [chat, ...prev]);
    setActiveChatId(chat.id);
  }, []);

  const selectChat = useCallback((id: string) => {
    setActiveChatId(id);
  }, []);

  const deleteChat = useCallback((id: string) => {
    setChats((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (activeChatId === id && next.length > 0) {
        setActiveChatId(next[0].id);
      } else if (next.length === 0) {
        const fresh = makeChat();
        setActiveChatId(fresh.id);
        return [fresh];
      }
      return next;
    });
  }, [activeChatId]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !activeChat || isStreaming) return;

    const userMsg: ChatMessage = {
      id: genId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChat.id ? { ...c, messages: [...c.messages, userMsg] } : c
      )
    );
    setInput('');
    setIsStreaming(true);

    // Simulated response — replace with real API call
    await new Promise((r) => setTimeout(r, 1200));

    const aiMsg: ChatMessage = {
      id: genId(),
      role: 'assistant',
      content: `[Z21] "${text}" — backend not wired yet. This is the scaffold.`,
      timestamp: new Date(),
    };

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChat.id ? { ...c, messages: [...c.messages, aiMsg] } : c
      )
    );
    setIsStreaming(false);

    // Auto-title first message
    if (activeChat.messages.length === 1) {
      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChat.id
            ? { ...c, title: text.slice(0, 40) + (text.length > 40 ? '…' : '') }
            : c
        )
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-full overflow-hidden bg-black">
      {/* Sidebar */}
      <Z21Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeChatId={activeChatId}
        onSelectChat={selectChat}
        onNewChat={startNewChat}
      />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1a1a1a]">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl hover:bg-[#111111] text-[#666666] hover:text-white transition-colors"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}
          <h1 className="text-xs uppercase tracking-widest text-[#b79a70] font-medium truncate">
            {activeChat?.title ?? 'Z21 Chatbot'}
          </h1>
          <div className="ml-auto">
            <button
              onClick={startNewChat}
              className="p-2 rounded-xl hover:bg-[#111111] text-[#666666] hover:text-white transition-colors"
              title="New chat"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
          {activeChat?.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#b79a70] text-black font-medium'
                    : 'bg-[#111111] text-white border border-[#1e1e1e]'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isStreaming && (
            <div className="flex justify-start">
              <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-[#b79a70] rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-[#b79a70] rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1.5 h-1.5 bg-[#b79a70] rounded-full animate-bounce [animation-delay:0.3s]" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-[#1a1a1a] px-4 py-4">
          <div className="flex items-end gap-3 max-w-3xl mx-auto">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Z21…"
              rows={1}
              className="flex-1 bg-[#111111] border border-[#222222] rounded-xl px-4 py-3 text-sm text-white placeholder-[#444444] resize-none focus:outline-none focus:border-[#b79a70] transition-colors"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isStreaming}
              className="flex-shrink-0 w-10 h-10 bg-[#b79a70] hover:bg-[#c4a87a] disabled:opacity-30 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 8L2 14V8.5L8 8L2 7.5V2L14 8Z" fill="black" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
