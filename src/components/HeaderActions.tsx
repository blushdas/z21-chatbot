
import React from 'react';
import { Button } from '@/components/ui/button';
import { Book, User, Settings, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import FavoritesButton from './favorites/FavoritesButton';
import CanvasesButton from './canvases/CanvasesButton';
import { DualResponseSettings } from './DualResponseSettings';
import { useAuth } from '@/context/SupabaseAuthContext';

interface HeaderActionsProps {
  onToggleFavorites: () => void;
  onToggleSavedChats: () => void;
  onToggleMemory: () => void;
  activePanel: 'favorites' | 'saved' | 'memory' | null;
  dualResponseMode?: boolean;
  onToggleDualResponse?: (enabled: boolean) => void;
}

// Feature flag to temporarily hide Memory Journal
const SHOW_MEMORY_JOURNAL = false;
const SHOW_DUAL_RESPONSE = false;

const HeaderActions: React.FC<HeaderActionsProps> = ({ 
  onToggleFavorites, 
  onToggleSavedChats, 
  onToggleMemory,
  activePanel,
  dualResponseMode = false,
  onToggleDualResponse
}) => {
  const { profile } = useAuth();
  const initials = (profile?.name || '')
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  return (
    <div className="flex items-center gap-2">
      {/* Dual Response Mode Settings */}
      {SHOW_DUAL_RESPONSE && onToggleDualResponse && (
        <DualResponseSettings
          enabled={dualResponseMode}
          onToggle={onToggleDualResponse}
        />
      )}
      
      <FavoritesButton />
      <CanvasesButton />
      
      {/* Admin links for admin+ users */}
      {(profile?.role === 'admin' || profile?.role === 'superadmin') && (
        <>
          <Link to="/constructs">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1.5 text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)] dark:hover:bg-gray-700"
            >
              <Book size={16} />
              <span className="hidden sm:inline">Constructs</span>
            </Button>
          </Link>
          <Link to="/admin">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1.5 text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)] dark:hover:bg-gray-700"
            >
              <Settings size={16} />
              <span className="hidden sm:inline">Admin</span>
            </Button>
          </Link>
          {/* Third-Party Verification entry temporarily hidden */}
        </>
      )}
      
      {/* Memory button temporarily hidden */}
      {SHOW_MEMORY_JOURNAL && (
        <Button
          variant={activePanel === 'memory' ? 'default' : 'ghost'}
          size="sm"
          className={`flex items-center gap-1.5 ${
            activePanel === 'memory' 
              ? 'bg-brand-blue text-white' 
              : 'text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)] dark:hover:bg-gray-700'
          }`}
          onClick={onToggleMemory}
        >
          <Book size={16} />
          <span className="hidden sm:inline">Memory</span>
        </Button>
      )}
      
      <Link to="/profile">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1.5 text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)] dark:hover:bg-gray-700"
        >
          <Avatar className="h-6 w-6">
            {profile?.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt={profile?.name || 'Profile'} />
            ) : null}
            <AvatarFallback className="bg-brand-yellow text-brand-blue text-[10px] font-semibold">
              {initials || <User size={12} />}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline">My Profile</span>
        </Button>
      </Link>
    </div>
  );
};

export default HeaderActions;
