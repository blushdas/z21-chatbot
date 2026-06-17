import React, { useState } from 'react';
import { Menu, Search, Bell, Sun, Moon, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ui/theme-provider';
import { useAuth } from '@/context/SupabaseAuthContext';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AdminSearch from './AdminSearch';
import AdminNotifications from './AdminNotifications';
import { useBrand } from '@/context/BrandContext';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuClick }) => {
  const { theme, setTheme } = useTheme();
  const { profile, signOut, setThemePreference } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const { activeBrand, productName, logoUrl, logoDarkUrl } = useBrand();

  // Hide Daryle.AI logo for justin admin
  const isJustin = profile?.name?.toLowerCase().includes('justin') ?? false;

  const toggleTheme = () => {
    const next: 'light' | 'dark' = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setThemePreference(next);
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 md:px-6 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Left section */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="h-9 w-9 hover:bg-muted"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {!isJustin && (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/" aria-label="Back to chat" className="flex items-center">
                {activeBrand && (logoUrl || logoDarkUrl) ? (
                  <img
                    src={(theme === 'dark' ? logoDarkUrl : logoUrl) ?? logoUrl ?? logoDarkUrl ?? ''}
                    alt={productName}
                    className="h-7"
                  />
                ) : activeBrand ? (
                  <span className="text-base font-heading font-bold text-foreground">{productName}</span>
                ) : (
                  <>
                    <img
                      src="/lovable-uploads/Daryle_Logo_Dark.svg"
                      alt="Daryle AI"
                      className="h-7 dark:hidden"
                    />
                    <img
                      src="/lovable-uploads/Daryle_Logo_White.svg"
                      alt="Daryle AI"
                      className="h-7 hidden dark:block"
                    />
                  </>
                )}
              </Link>
              <span className="text-sm font-medium text-muted-foreground">/</span>
              <span className="text-sm font-semibold text-foreground">Admin</span>
            </div>
          )}
        </div>

        {/* Center section - Search */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground h-9 px-3 bg-muted/50 border-border hover:bg-muted"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4 mr-2" />
            <span className="text-sm">Search users, chats, feedback...</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Mobile search button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 md:hidden hover:bg-muted"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Notifications */}
          <AdminNotifications />

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 hover:bg-muted"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-9 gap-2 px-2 hover:bg-muted"
              >
                <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="" 
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-semibold text-accent">
                      {profile?.name?.charAt(0) || 'A'}
                    </span>
                  )}
                </div>
                <span className="hidden md:inline-block text-sm font-medium max-w-[100px] truncate">
                  {profile?.name || 'Admin'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{profile?.name}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  My Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/" className="cursor-pointer">
                  Back to Chat
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => signOut()}
                className="text-destructive focus:text-destructive dark:text-red-400 dark:focus:text-red-300 cursor-pointer"
              >
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Search Modal */}
      <AdminSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
};

export default AdminHeader;
