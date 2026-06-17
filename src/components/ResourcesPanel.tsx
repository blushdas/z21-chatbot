import React, { useState } from 'react';
import { X, Search, Download, Sparkles } from 'lucide-react';

interface ResourcesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const MOCK_RESOURCES = [
  {
    id: 1,
    title: '1-on-1 Discussion Guide',
    type: 'TEMPLATE',
    size: '1.2 MB',
    description: 'A structured template to navigate difficult conversations with clarity and grace.',
    tags: ['Chemistry', 'Competency'],
    icon: '📄',
  },
  {
    id: 2,
    title: 'Values Alignment Framework',
    type: 'FRAMEWORK',
    size: '845 KB',
    description: 'Exercise to help team members align their personal values with the organizational mission.',
    tags: ['Character'],
    icon: '🧭',
  },
  {
    id: 3,
    title: 'Conflict Resolution Matrix',
    type: 'WORKSHEET',
    size: '2.1 MB',
    description: 'Step-by-step worksheet for mediating disputes and restoring healthy team dynamics.',
    tags: ['Chemistry'],
    icon: '📋',
  },
  {
    id: 4,
    title: 'Leadership Development Plan',
    type: 'TEMPLATE',
    size: '1.5 MB',
    description: 'Comprehensive template for mapping out quarterly growth goals and actionable steps.',
    tags: ['Competency', 'Character'],
    icon: '🗺️',
  },
  {
    id: 5,
    title: 'Team Health Assessment',
    type: 'WORKSHEET',
    size: '500 KB',
    description: 'A quick diagnostic tool to gauge the overall chemistry and morale of your team.',
    tags: ['Chemistry'],
    icon: '❤️',
  },
];

const TAG_COLORS: Record<string, string> = {
  Chemistry: 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/25',
  Competency: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25',
  Character: 'bg-brand-yellow/15 text-brand-blue dark:text-brand-yellow border-brand-yellow/25',
};

type FilterTab = 'All' | 'Templates' | 'Worksheets';

const ResourcesPanel: React.FC<ResourcesPanelProps> = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('All');

  const filtered = MOCK_RESOURCES.filter((r) => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase());
    const matchTab = activeTab === 'All' ||
      (activeTab === 'Templates' && r.type === 'TEMPLATE') ||
      (activeTab === 'Worksheets' && r.type === 'WORKSHEET');
    return matchSearch && matchTab;
  });

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full w-64 bg-[var(--chat-sidebar)] border-l border-[var(--chat-border)] flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--chat-border)]">
        <span className="font-semibold text-[var(--chat-text)] text-sm">Resources</span>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded text-[var(--chat-muted)] hover:text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)] transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-3 border-b border-[var(--chat-border)]">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--chat-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates & guides..."
            className="w-full bg-[var(--chat-bg)] border border-[var(--chat-border)] rounded-lg pl-8 pr-3 py-2 text-xs text-[var(--chat-text)] placeholder:text-[var(--chat-muted)] focus:outline-none focus:border-brand-yellow/50 transition-colors"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-[var(--chat-border)]">
        {(['All', 'Templates', 'Worksheets'] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              activeTab === tab
                ? 'bg-brand-yellow/20 text-brand-yellow border border-brand-yellow/30'
                : 'text-[var(--chat-muted)] hover:text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Resource list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {filtered.map((r) => (
          <div
            key={r.id}
            className="rounded-lg bg-[var(--chat-card)] border border-[var(--chat-border)] hover:bg-[var(--chat-card-2)] p-3 transition-colors group"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base flex-shrink-0">{r.icon}</span>
                <span className="text-xs font-semibold text-[var(--chat-text)] truncate">{r.title}</span>
              </div>
              <button className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-[var(--chat-muted)] hover:text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)] transition-colors opacity-0 group-hover:opacity-100">
                <Download size={12} />
              </button>
            </div>
            <div className="text-[10px] text-[var(--chat-muted)] mb-1.5">{r.type} · {r.size}</div>
            <p className="text-[11px] text-[var(--chat-muted)] leading-relaxed mb-2">{r.description}</p>
            <div className="flex items-center gap-1 flex-wrap">
              {r.tags.map((tag) => (
                <span key={tag} className={`px-1.5 py-0.5 rounded text-[10px] border ${TAG_COLORS[tag] ?? ''}`}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="px-3 py-3 border-t border-[var(--chat-border)]">
        <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-yellow hover:bg-brand-yellow/90 text-brand-blue text-xs font-semibold transition-colors">
          <Sparkles size={13} />
          Request Custom Template
        </button>
        <p className="text-[10px] text-[var(--chat-muted)] text-center mt-1.5">
          Can't find what you need? Ask Daryle to generate a specific framework.
        </p>
      </div>
    </div>
  );
};

export default ResourcesPanel;
