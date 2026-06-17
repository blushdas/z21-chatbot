import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useTheme } from '@/components/ui/theme-provider';

const ChatSidebarFooter: React.FC = () => {
  const { profile, user, setThemePreference } = useAuth();
  const { theme, setTheme } = useTheme();

  const initials = profile?.name
    ? profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'U';

  const isDark = theme !== 'light';
  const toggleTheme = () => {
    const next: 'light' | 'dark' = isDark ? 'light' : 'dark';
    setTheme(next);
    setThemePreference(next);
  };

  return (
    <div className="border-t border-[var(--chat-border)] bg-[var(--chat-sidebar)]">
      <div data-tour="profile-settings" className="flex items-center gap-3 px-4 py-4 group">
        {/* Avatar */}
        <Link to="/profile" className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 rounded-full bg-brand-yellow/20 border border-brand-yellow/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[var(--chat-text)] text-xs font-semibold">{initials}</span>
            )}
          </div>
          <span className="text-sm font-medium text-[var(--chat-text)] truncate">My Profile</span>
        </Link>

        {/* Theme toggle — moon/sun icon */}
        <button
          onClick={toggleTheme}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--chat-muted)] hover:text-[var(--chat-text)] hover:bg-[var(--chat-card)] transition-colors flex-shrink-0"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* Settings gear */}
        <Link
          to="/profile"
          className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--chat-muted)] hover:text-[var(--chat-text)] hover:bg-[var(--chat-card)] transition-colors flex-shrink-0"
        >
          <Settings size={14} />
        </Link>
      </div>
    </div>
  );
};

export default ChatSidebarFooter;
