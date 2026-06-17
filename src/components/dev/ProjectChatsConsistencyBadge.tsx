import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import {
  PROJECT_CHATS_EVENT,
  isDebugEnabled,
  readProjectChats,
  type ChatSetSnapshot,
} from '@/lib/projectChatsDebug';
import { useChatManagement } from '@/hooks/useChatManagement';

/**
 * Dev-only floating badge that compares the chat set rendered by
 * ProjectWorkspace vs ProjectNewChatHero for the active project.
 *
 * Visible only on /folder/:folderId or /chat/:chatId (when that chat
 * belongs to a folder), and only when import.meta.env.DEV is true.
 */
const ProjectChatsConsistencyBadge: React.FC = () => {
  if (!isDebugEnabled()) return null;
  return <Inner />;
};

const Inner: React.FC = () => {
  const location = useLocation();
  const params = useParams();
  const { savedChats } = useChatManagement();
  const [open, setOpen] = useState(true);
  const [tick, setTick] = useState(0);

  // Resolve the folderId being viewed.
  const folderId = React.useMemo(() => {
    if (location.pathname.startsWith('/folder/') && params.folderId) {
      return params.folderId as string;
    }
    if (location.pathname.startsWith('/chat/') && params.chatId) {
      const chat = savedChats.find(c => c.id === params.chatId);
      return chat?.folder_id || null;
    }
    return null;
  }, [location.pathname, params.folderId, params.chatId, savedChats]);

  useEffect(() => {
    const handler = () => setTick(t => t + 1);
    window.addEventListener(PROJECT_CHATS_EVENT, handler);
    return () => window.removeEventListener(PROJECT_CHATS_EVENT, handler);
  }, []);

  if (!folderId) return null;

  const { workspace, hero } = readProjectChats(folderId);
  const status = compare(workspace, hero);

  return (
    <div
      className="fixed bottom-3 right-3 z-[9999] pointer-events-auto font-mono text-[11px] select-none"
      data-testid="project-chats-consistency-badge"
    >
      <div
        className={`rounded-md shadow-lg border px-2.5 py-1.5 backdrop-blur-md ${
          status.tone === 'match'
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
            : status.tone === 'partial'
            ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
            : 'bg-rose-500/15 border-rose-500/40 text-rose-200'
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2"
          title="Toggle project chats consistency details"
        >
          <span className="inline-block h-2 w-2 rounded-full bg-current" />
          <span>chats {status.label}</span>
          <span className="opacity-70">
            ws:{workspace?.ids.length ?? '–'} · hero:{hero?.ids.length ?? '–'}
          </span>
        </button>
        {open && (
          <div className="mt-2 max-w-[320px] space-y-1 border-t border-current/20 pt-1.5">
            <Row label="folder" value={shortId(folderId)} />
            <Row label="workspace" value={fmtSet(workspace)} />
            <Row label="hero" value={fmtSet(hero)} />
            {status.tone !== 'match' && (
              <>
                <Row label="only ws" value={list(status.onlyWorkspace)} />
                <Row label="only hero" value={list(status.onlyHero)} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex gap-2">
    <span className="opacity-60 w-16 shrink-0">{label}</span>
    <span className="break-all">{value}</span>
  </div>
);

const shortId = (id: string) => id.slice(0, 8);
const fmtSet = (s: ChatSetSnapshot | null) =>
  s ? `${s.ids.length} [${s.ids.map(shortId).join(',') || '∅'}]` : 'not reported';
const list = (ids: string[]) => (ids.length ? ids.map(shortId).join(', ') : '∅');

function compare(ws: ChatSetSnapshot | null, hero: ChatSetSnapshot | null) {
  if (!ws || !hero) {
    return { tone: 'partial' as const, label: 'waiting…', onlyWorkspace: [], onlyHero: [] };
  }
  const wsSet = new Set(ws.ids);
  const heroSet = new Set(hero.ids);
  const onlyWorkspace = ws.ids.filter(id => !heroSet.has(id));
  const onlyHero = hero.ids.filter(id => !wsSet.has(id));
  if (onlyWorkspace.length === 0 && onlyHero.length === 0) {
    return { tone: 'match' as const, label: 'match', onlyWorkspace, onlyHero };
  }
  return { tone: 'mismatch' as const, label: 'mismatch', onlyWorkspace, onlyHero };
}

export default ProjectChatsConsistencyBadge;
