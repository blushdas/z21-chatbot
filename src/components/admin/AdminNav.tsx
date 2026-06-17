
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronDown, User, LayoutDashboard, Users, MessageSquare, BarChart3, Shield, TrendingUp, GitCompare, Tag, Globe, Database, Gauge, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/SupabaseAuthContext';

const AdminNav: React.FC = () => {
  const { profile } = useAuth();
  const location = useLocation();
  const isUserRoute = location.pathname.includes('/admin/users');
  const isDomainsRoute = location.pathname.includes('/admin/domains');
  const isFeedbackRoute = location.pathname.includes('/admin/feedback');
  const isChatsRoute = location.pathname.includes('/admin/chats');
  const isSecurityRoute = location.pathname === '/admin/security';
  const isAuditLogRoute = location.pathname === '/admin/audit-log';
  const isSecuritySettingsRoute = location.pathname === '/admin/security-settings';
  const isAnalyticsRoute = location.pathname.includes('/admin/analytics');
  const isDualResponseRoute = location.pathname.includes('/admin/dual-response');
  const isKnowledgeRoute = location.pathname.includes('/admin/knowledge');
  const isBenchmarkRoute = location.pathname.includes('/admin/benchmarks');
  const isSuperAdmin = profile?.role === 'superadmin';
  const isAdmin = profile?.role === 'admin' || isSuperAdmin;

  const adminMenuItems = [
    { 
      label: 'Knowledge Base', 
      path: '/admin/knowledge', 
      icon: Database, 
      isActive: isKnowledgeRoute,
      showForAdmin: true 
    },
    { 
      label: 'Constructs', 
      path: '/constructs', 
      icon: Tag, 
      isActive: location.pathname.includes('/constructs'),
      showForAdmin: false 
    },
    { 
      label: 'Users', 
      path: '/admin/users', 
      icon: Users, 
      isActive: isUserRoute,
      showForAdmin: false 
    },
    { 
      label: 'Email Domains', 
      path: '/admin/domains', 
      icon: Globe, 
      isActive: isDomainsRoute,
      showForAdmin: false 
    },
    { 
      label: 'Feedback', 
      path: '/admin/feedback', 
      icon: MessageSquare, 
      isActive: isFeedbackRoute,
      showForAdmin: false 
    },
    { 
      label: 'Chats', 
      path: '/admin/chats', 
      icon: BarChart3, 
      isActive: isChatsRoute,
      showForAdmin: false 
    },
    { 
      label: 'Security Center', 
      path: '/admin/security', 
      icon: Shield, 
      isActive: isSecurityRoute,
      showForAdmin: false 
    },
    { 
      label: 'Audit Log', 
      path: '/admin/audit-log', 
      icon: Activity, 
      isActive: isAuditLogRoute,
      showForAdmin: true 
    },
    { 
      label: 'Security Settings', 
      path: '/admin/security-settings', 
      icon: Shield, 
      isActive: isSecuritySettingsRoute,
      showForAdmin: false 
    },
    { 
      label: 'Analytics', 
      path: '/admin/analytics', 
      icon: TrendingUp, 
      isActive: isAnalyticsRoute,
      showForAdmin: false 
    },
    { 
      label: 'Dual Response Analytics', 
      path: '/admin/dual-response-analytics', 
      icon: GitCompare, 
      isActive: isDualResponseRoute,
      showForAdmin: false 
    },
    { 
      label: 'Benchmarks', 
      path: '/admin/benchmarks', 
      icon: Gauge, 
      isActive: isBenchmarkRoute,
      showForAdmin: false 
    },
    { 
      label: 'Service Health', 
      path: '/admin/service-health', 
      icon: Activity, 
      isActive: location.pathname.includes('/admin/service-health'),
      showForAdmin: false 
    },
  ];

  const visibleItems = adminMenuItems.filter(item => 
    item.showForAdmin || isSuperAdmin
  );

  return (
    <nav className="flex justify-between items-center px-6 py-4 border-b bg-brand-offwhite text-brand-blue dark:text-foreground">
      <div className="flex items-center gap-4">
        <Link to="/">
          <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center gap-1.5 text-brand-blue dark:text-foreground hover:bg-brand-yellow/10"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to Chat</span>
          </Button>
        </Link>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="flex items-center gap-1.5 text-brand-blue dark:text-foreground hover:bg-brand-yellow/10"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Admin Dashboard</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start" 
            className="w-56 bg-background border border-border z-50"
          >
            {visibleItems.map((item) => {
              const Icon = item.icon;
              return (
                <DropdownMenuItem key={item.path} asChild>
                  <Link 
                    to={item.path}
                    className={`flex items-center gap-2 px-2 py-2 text-sm cursor-pointer ${
                      item.isActive 
                        ? 'bg-brand-yellow/20 text-brand-blue dark:text-foreground font-medium' 
                        : 'text-muted-foreground hover:bg-brand-yellow/10 hover:text-brand-blue dark:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex gap-4 text-sm font-medium">
        <Link to="/profile">
          <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center gap-1.5 text-brand-blue dark:text-foreground hover:bg-brand-yellow/10"
          >
            <User className="h-4 w-4" />
            <span>My Profile</span>
          </Button>
        </Link>
      </div>
    </nav>
  );
};

export default AdminNav;
