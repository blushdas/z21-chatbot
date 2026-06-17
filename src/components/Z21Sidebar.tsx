import React, { useState, useEffect } from 'react';
import { MessageSquare, Trash2, Plus, X, Search } from 'lucide-react';

export interface SidebarChat {
  id: string;
  title: string;
  preview: string;
  updatedAt: number;
}

interface Z21SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
}

const STORAGE_KEY = 'z21_chats';

function loadChats(): SidebarChat[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveChats(chats: SidebarChat[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

export { loadChats, saveChats };
export type { SidebarChat };

export default function Z21Sidebar({
  isOpen,
  onClose,
  activeChatId,
  onSelectChat,
  onNewChat,
}: Z21SidebarProps) {
  const [chats, setChats] = useState<SidebarChat[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setChats(loadChats());
  }, []);

  const filtered = search
    ? chats.filter(
        (c) =>
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.preview.toLowerCase().includes(search.toLowerCase())
      )
    : chats;

  const deleteChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const next = chats.filter((c) => c.id !== id);
    setChats(next);
    saveChats(next);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-30 md:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside className="fixed md:relative z-40 inset-y-0 left-0 w-72 bg-[#090909] border-r border-[#1a1a1a] flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#b79a70]" />
            <span className="text-xs uppercase tracking-widest text-[#b79a70] font-medium">
              Chats
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onNewChat}
              className="p-1.5 rounded-lg hover:bg-[#1a1a1a] text-[#666666] hover:text-white transition-colors"
              title="New chat"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#1a1a1a] text-[#666666] hover:text-white transition-colors md:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-3 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2 bg-[#111111] border border-[#222222] rounded-xl px-3 py-2">
            <Search className="w-3.5 h-3.5 text-[#444444] flex-shrink-0" />
            <input
              type="text"
              placeholder="Search chats…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs text-white placeholder-[#444444] outline-none w-full"
            />
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-[#444444] text-xs">
                {search ? 'No chats found' : 'No chats yet'}
              </p>
              {!search && (
                <button
                  onClick={onNewChat}
                  className="mt-3 text-xs text-[#b79a70] hover:text-[#c4a87a] transition-colors"
                >
                  Start a conversation →
                </button>
              )}
            </div>
          ) : (
            <ul className="py-2">
              {filtered.map((chat) => (
                <li key={chat.id}>
                  <button
                    onClick={() => {
                      onSelectChat(chat.id);
                      onClose();
                    }}
                    className={`w-full text-left px-4 py-3 flex items-start justify-between gap-2 hover:bg-[#111111] transition-colors group ${
                      chat.id === activeChatId ? 'bg-[#111111]' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs truncate ${
                          chat.id === activeChatId ? 'text-white' : 'text-[#999999]'
                        }`}
                      >
                        {chat.title}
                      </p>
                      <p className="text-[10px] text-[#444444] truncate mt-0.5">
                        {chat.preview}
                      </p>
                    </div>
                    <button
                      onClick={(e) => deleteChat(e, chat.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#1a1a1a] text-[#444444] hover:text-[#b79a70] transition-all flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#1a1a1a]">
          <p className="text-[10px] text-[#333333]">
            {chats.length} chat{chats.length !== 1 ? 's' : ''} saved locally
          </p>
        </div>
      </aside>
    </>
  );
}
