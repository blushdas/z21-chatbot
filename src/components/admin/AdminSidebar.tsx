import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  BarChart3,
  Database,
  Globe,
  Shield,
  Settings,
  TrendingUp,
  X,
  Home,
  Activity,
  FlaskConical,
  Flag,
  Bell,
  Paintbrush
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/SupabaseAuthContext';

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
  counts?: {
    users: number;
    chats: number;
    feedback: number;
    notifications?: number;
  };
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: number;
  requiresSuperAdmin?: boolean;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ open, onClose, counts }) => {
  const location = useLocation();
  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === 'superadmin';

  const mainNav: NavItem[] = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Users', path: '/admin/users', icon: Users, badge: counts?.users, requiresSuperAdmin: true },
    { label: 'Chats', path: '/admin/chats', icon: BarChart3, badge: counts?.chats, requiresSuperAdmin: true },
    { label: 'Feedback', path: '/admin/feedback', icon: MessageSquare, badge: counts?.feedback, requiresSuperAdmin: true },
    { label: 'Knowledge Base', path: '/admin/knowledge', icon: Database },
  ];

  const securityNav: NavItem[] = [
    { label: 'Security Center', path: '/admin/security', icon: Shield, requiresSuperAdmin: true },
    { label: 'Notifications', path: '/admin/notifications', icon: Bell, badge: counts?.notifications, requiresSuperAdmin: true },
    { label: 'Safety Flags', path: '/admin/safety', icon: Flag, requiresSuperAdmin: true },
    { label: 'Email Domains', path: '/admin/domains', icon: Globe, requiresSuperAdmin: true },
    { label: 'Security Settings', path: '/admin/security-settings', icon: Settings, requiresSuperAdmin: true },
  ];

  const insightsNav: NavItem[] = [
    
    { label: 'Service Health', path: '/admin/service-health', icon: Activity, requiresSuperAdmin: true },
  ];

  const labsNavItems: NavItem[] = [
    { label: 'Verification Mode', path: '/admin/verification-mode', icon: FlaskConical, requiresSuperAdmin: true },
    { label: 'White-Label Demo', path: '/admin/white-label', icon: Paintbrush, requiresSuperAdmin: true },
  ];

  const filterByRole = (items: NavItem[]) => 
    items.filter(item => !item.requiresSuperAdmin || isSuperAdmin);

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const active = isActive(item.path);
    
    return (
      <Link
        to={item.path}
        onClick={onClose}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
          active
            ? "bg-accent/20 text-accent-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Icon className={cn("h-5 w-5 flex-shrink-0", active && "text-accent")} />
        <span className="flex-1">{item.label}</span>
        {item.badge !== undefined && item.badge > 0 && (
          <span className={cn(
            "px-2 py-0.5 text-xs rounded-full font-medium",
            active 
              ? "bg-accent text-accent-foreground" 
              : "bg-muted text-muted-foreground"
          )}>
            {item.badge.toLocaleString()}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Backdrop overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-background border-r border-border transform transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <LayoutDashboard className="h-4 w-4 text-accent" />
            </div>
            <span className="font-heading font-bold text-foreground">Admin Panel</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="h-8 w-8 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 h-[calc(100vh-8rem)]">
          <div className="p-4 space-y-6">
            {/* Back to Chat */}
            <div>
              <Link
                to="/"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Home className="h-5 w-5" />
                <span>Back to Chat</span>
              </Link>
            </div>

            <Separator />

            {/* Main */}
            <div className="space-y-1">
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Main
              </p>
              {filterByRole(mainNav).map((item) => (
                <NavLink key={item.path} item={item} />
              ))}
            </div>

            {filterByRole(securityNav).length > 0 && (
              <>
                <Separator />
                <div className="space-y-1">
                  <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Security
                  </p>
                  {filterByRole(securityNav).map((item) => (
                    <NavLink key={item.path} item={item} />
                  ))}
                </div>
              </>
            )}

            {filterByRole(insightsNav).length > 0 && (
              <>
                <Separator />
                <div className="space-y-1">
                  <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Insights
                  </p>
                  {filterByRole(insightsNav).map((item) => (
                    <NavLink key={item.path} item={item} />
                  ))}
                </div>
              </>
            )}

            {filterByRole(labsNavItems).length > 0 && (
              <>
                <Separator />
                <div className="space-y-1">
                  <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Labs
                  </p>
                  {filterByRole(labsNavItems).map((item) => (
                    <NavLink key={item.path} item={item} />
                  ))}
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
            <span className="text-xs font-semibold text-accent">
                {profile?.name?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {profile?.name || 'Admin'}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {profile?.role || 'user'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
