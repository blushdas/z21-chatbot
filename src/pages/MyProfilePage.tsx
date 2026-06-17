
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ChevronLeft, User, Settings, LogOut, Star, MessageSquare, Clock, Camera, Edit2, Mail, Lock, Shield, Tag, FileText, UserCog, Trash2 } from 'lucide-react';
import PreferencesCard from '@/components/profile/PreferencesCard';
import FavoritesSection from '@/components/profile/FavoritesSection';
import UserFeedbackSection from '@/components/profile/UserFeedbackSection';
import GeneralFeedbackForm from '@/components/profile/GeneralFeedbackForm';
import ChatCategoriesManager from '@/components/profile/ChatCategoriesManager';
import CanvasesSection from '@/components/profile/CanvasesSection';
import AccountSettings from '@/components/profile/AccountSettings';
import DeletedChatsSection from '@/components/profile/DeletedChatsSection';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/context/SupabaseAuthContext';
import { MockUserRole } from '@/data/mockUserProfile';
import AvatarUploader from '@/components/profile/AvatarUploader';
import EditProfileModal from '@/components/profile/EditProfileModal';

type TabId = 'account' | 'preferences' | 'categories' | 'canvases' | 'favorites' | 'feedback' | 'deleted';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'preferences', label: 'Preferences', icon: <Settings size={14} /> },
  { id: 'account', label: 'Account', icon: <UserCog size={14} /> },
  // Categories tab hidden for now
  { id: 'canvases', label: 'Canvases', icon: <FileText size={14} /> },
  { id: 'favorites', label: 'Favorites', icon: <Star size={14} /> },
  { id: 'deleted', label: 'Deleted chats', icon: <Trash2 size={14} /> },
  { id: 'feedback', label: 'Feedback', icon: <MessageSquare size={14} /> },
];

const MyProfilePage: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>('preferences');
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const { user, profile: authProfile, signOut } = useAuth();
  const profileHook = useProfile();

  const mapRole = (dbRole: string | undefined): MockUserRole => {
    switch (dbRole) {
      case 'admin':
      case 'superadmin':
        return 'Admin';
      default:
        return 'Team Member';
    }
  };

  const userProfile = {
    id: user?.id || '',
    name: authProfile?.name || profileHook.profile.name || 'Anonymous User',
    email: user?.email || '',
    avatarUrl: authProfile?.avatar_url || profileHook.profile.avatar_url || '',
    initials: (authProfile?.name || profileHook.profile.name || 'AU')
      .split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
    role: mapRole(authProfile?.role),
    joinedDate: new Date(user?.created_at || new Date()),
    preferences: {
      defaultMode: 'coach' as const,
      defaultTone: 'warm_reflective',
      theme: 'light',
      notifications: true,
      language: 'en',
      timezone: 'UTC',
    },
    accessLevels: { coach: true, ambassador: true, investor: true, family: false, faith: true },
  };

  const updateProfile = (updated: any) => {
    profileHook.updateProfile({ name: updated.name, avatar_url: updated.avatarUrl });
  };

  const updatePreferences = (prefs: any) => {
    localStorage.setItem('userPreferences', JSON.stringify(prefs));
  };

  useEffect(() => {
    const tab = searchParams.get('tab') as TabId | null;
    if (tab) {
      // Back-compat: old 'general-feedback' maps to merged 'feedback' tab
      setActiveTab((tab as string) === 'general-feedback' ? 'feedback' : tab);
      return;
    }
    if (location.pathname === '/profile/preferences') setActiveTab('preferences');
    else if (location.pathname === '/profile/favorites') setActiveTab('favorites');
    else if (location.pathname === '/profile/feedback') setActiveTab('feedback');
    else if (location.pathname === '/profile/general-feedback') setActiveTab('feedback');
  }, [location.pathname, searchParams]);

  return (
    <div className="theme-aware-profile flex flex-col min-h-screen bg-[var(--chat-bg)] text-[var(--chat-text)]">

      {/* Top nav */}
      <nav className="flex items-center justify-between h-14 px-6 border-b border-[var(--chat-border)] bg-[var(--chat-bg)] flex-shrink-0">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-sm text-[var(--chat-muted)] hover:text-[var(--chat-text)] transition-colors"
        >
          <ChevronLeft size={16} />
          <span>Back to Chat</span>
        </Link>
        <div className="flex items-center gap-1">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[var(--chat-muted)] hover:text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)] rounded-lg transition-colors">
            <User size={14} />
            <span>My Profile</span>
          </button>
          {(authProfile?.role === 'admin' || authProfile?.role === 'superadmin') && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[var(--chat-muted)] hover:text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)] rounded-lg transition-colors"
            >
              <Settings size={14} />
              <span>Admin</span>
            </Link>
          )}
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[var(--chat-muted)] hover:text-red-700 dark:hover:text-red-400 hover:bg-[var(--ui-bg-hover)] rounded-lg transition-colors"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[267px_1fr] gap-6">

            {/* Left column */}
            <div className="space-y-4">

              {/* Profile card */}
              <div className="rounded-2xl bg-[var(--chat-card)] border border-[var(--chat-border)] p-5 flex flex-col items-center text-center">
                <div className="mb-5">
                  <AvatarUploader
                    currentAvatarUrl={userProfile.avatarUrl}
                    userName={userProfile.name}
                    size="md"
                    onAvatarUpdate={(url) => profileHook.updateProfile({ avatar_url: url })}
                  />
                </div>
                <p className="font-semibold text-[var(--chat-text)] text-base">{userProfile.name}</p>
                <p className="text-[var(--chat-muted)] text-sm">{userProfile.role}</p>
              </div>

              {/* Account Details card */}
              <div className="rounded-2xl bg-[var(--chat-card)] border border-[var(--chat-border)] p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--chat-text)] mb-1">
                  <User size={14} className="text-brand-yellow" />
                  Account Details
                </div>

                {/* Full Name */}
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[var(--chat-muted)] mb-1">Full Name</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--chat-text)]">{userProfile.name}</span>
                    <button
                      onClick={() => setActiveTab('account')}
                      className="text-xs text-brand-yellow hover:text-brand-yellow/80 transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[var(--chat-muted)] mb-1 flex items-center gap-1">
                    <Mail size={10} />
                    Email Address
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-[var(--chat-text)] truncate">{userProfile.email}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Shield size={10} className="text-green-400" />
                        <span className="text-[11px] text-green-400">Verified</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('account')}
                      className="text-xs text-brand-yellow hover:text-brand-yellow/80 transition-colors flex-shrink-0"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                {/* Password */}
                <div className="hidden">
                  <p className="text-[10px] uppercase tracking-widest text-[var(--chat-muted)] mb-1 flex items-center gap-1">
                    <Lock size={10} />
                    Password
                  </p>
                  {!showPasswordSection ? (
                    <button
                      onClick={() => setShowPasswordSection(true)}
                      className="w-full py-2 rounded-lg border border-[var(--chat-border)] text-sm text-[var(--chat-muted)] hover:bg-[var(--ui-bg-hover)] hover:text-[var(--chat-text)] transition-colors text-left px-3"
                    >
                      Change Password
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="password"
                        placeholder="New password (min 6 characters)"
                        value={profileHook.newPassword}
                        onChange={(e) => profileHook.setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg)] text-sm text-[var(--chat-text)] placeholder:text-[var(--chat-muted)] focus:outline-none focus:border-brand-yellow"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            if (!profileHook.newPassword) return;
                            await profileHook.updatePassword(profileHook.newPassword);
                            setShowPasswordSection(false);
                          }}
                          disabled={profileHook.loading || !profileHook.newPassword || profileHook.newPassword.length < 6}
                          className="flex-1 py-2 rounded-lg bg-brand-yellow text-brand-blue text-sm font-medium hover:bg-brand-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {profileHook.loading ? 'Updating...' : 'Update'}
                        </button>
                        <button
                          onClick={() => {
                            setShowPasswordSection(false);
                            profileHook.setNewPassword('');
                          }}
                          className="flex-1 py-2 rounded-lg border border-[var(--chat-border)] text-sm text-[var(--chat-muted)] hover:bg-[var(--ui-bg-hover)] hover:text-[var(--chat-text)] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Account Status */}
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[var(--chat-muted)] mb-2">Account Status</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--chat-muted)]">Role:</span>
                    <span className="text-[var(--chat-text)] font-medium">{userProfile.role}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-[var(--chat-muted)]">Account ID:</span>
                    <span className="text-[var(--chat-muted)] font-mono text-xs">{user?.id?.slice(0, 10)}...</span>
                  </div>
                </div>

                {/* Sign Out */}
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[var(--chat-muted)] mb-1 flex items-center gap-1">
                    <LogOut size={10} />
                    Session
                  </p>
                  <p className="text-[11px] text-[var(--chat-muted)] mb-2">Sign out of your Daryle AI account on this device.</p>
                  <button
                    onClick={signOut}
                    className="w-full py-2 rounded-lg border border-red-500/30 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <LogOut size={13} />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>

            {/* Right column — Tabs */}
            <div className="min-w-0">
              {/* Tab bar — horizontally scrollable on narrow screens */}
              <div
                role="tablist"
                aria-label="Profile sections"
                className="inline-flex items-center gap-1 mb-5 bg-[var(--chat-card)]/60 backdrop-blur-md rounded-2xl p-1.5 border border-[var(--chat-border)] shadow-sm overflow-x-auto whitespace-nowrap scrollbar-hide max-w-full snap-x snap-mandatory"
              >
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`shrink-0 snap-start inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-brand-yellow text-brand-blue font-semibold tracking-tight shadow-[0_2px_10px_-3px_hsl(var(--brand-yellow)/0.45)]'
                        : 'text-[var(--chat-muted)] font-medium hover:text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)]'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div>
                {activeTab === 'account' && <AccountSettings />}
                {activeTab === 'preferences' && (
                  <PreferencesCard userProfile={userProfile} onUpdatePreferences={updatePreferences} />
                )}
                {activeTab === 'categories' && <ChatCategoriesManager />}
                {activeTab === 'canvases' && <CanvasesSection />}
                {activeTab === 'favorites' && <FavoritesSection />}
                {activeTab === 'deleted' && <DeletedChatsSection />}
                {activeTab === 'feedback' && (
                  <div className="space-y-6">
                    <GeneralFeedbackForm />
                    <UserFeedbackSection />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        userProfile={userProfile}
        onUpdateProfile={updateProfile}
      />
    </div>
  );
};

export default MyProfilePage;
