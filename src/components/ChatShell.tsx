import React, { useState, useRef, useEffect } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const Z21_WELCOME: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content: 'Z21 Chatbot. Ask me anything.',
    timestamp: new Date(),
  },
];

export default function ChatShell() {
  const [messages, setMessages] = useState<ChatMessage[]>(Z21_WELCOME);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    // Simulated response — replace with real API call when backend is wired
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const aiMsg: ChatMessage = {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: `[Z21] Received: "${text}" — backend not wired yet. This is the scaffold speaking.`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, aiMsg]);
    setIsStreaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#b79a70] text-black font-medium'
                  : 'bg-[#111111] text-white border border-[#222222]'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isStreaming && (
          <div className="flex justify-start">
            <div className="bg-[#111111] border border-[#222222] rounded-2xl px-4 py-3">
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

      {/* Input bar */}
      <div className="border-t border-[#1a1a1a] px-4 py-4">
        <div className="flex items-end gap-3 max-w-3xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Z21…"
            rows={1}
            className="flex-1 bg-[#111111] border border-[#222222] rounded-xl px-4 py-3 text-sm text-white placeholder-[#444444] resize-none focus:outline-none focus:border-[#b79a70] transition-colors"
            style={{ maxHeight: '120px' }}
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
  );
}
