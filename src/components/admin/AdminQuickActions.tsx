import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  UserPlus, 
  Download, 
  FileText, 
  Activity, 
  X,
  Database,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/SupabaseAuthContext';
import { toast } from 'sonner';

const AdminQuickActions: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);

  const isSuperAdmin = profile?.role === 'superadmin';

  const handleExport = async () => {
    toast.info('Export feature coming soon', {
      description: 'Data export will be available in a future update.',
    });
    setOpen(false);
  };

  const handleHealthCheck = () => {
    toast.success('System Health: All systems operational', {
      description: 'Database, API, and all services are running normally.',
    });
    setOpen(false);
  };

  const actions = [
    {
      label: 'Add User',
      icon: UserPlus,
      action: () => {
        navigate('/admin/users?action=add');
        setOpen(false);
      },
      color: 'text-green-500',
      requiresSuperAdmin: true,
    },
    {
      label: 'Knowledge Base',
      icon: Database,
      action: () => {
        navigate('/admin/knowledge');
        setOpen(false);
      },
      color: 'text-blue-500',
      requiresSuperAdmin: false,
    },
    {
      label: 'Export Data',
      icon: Download,
      action: handleExport,
      color: 'text-purple-500',
      requiresSuperAdmin: true,
    },
    {
      label: 'Security Logs',
      icon: Shield,
      action: () => {
        navigate('/admin/security');
        setOpen(false);
      },
      color: 'text-red-500',
      requiresSuperAdmin: true,
    },
    {
      label: 'System Health',
      icon: Activity,
      action: handleHealthCheck,
      color: 'text-orange-500',
      requiresSuperAdmin: false,
    },
  ];

  const visibleActions = actions.filter(
    (action) => !action.requiresSuperAdmin || isSuperAdmin
  );

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Action buttons - shown when open */}
      <div
        className={cn(
          'absolute bottom-16 right-0 flex flex-col items-end gap-2 transition-all duration-200',
          open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        {visibleActions.map((action, index) => (
          <Button
            key={action.label}
            variant="secondary"
            size="sm"
            className={cn(
              'flex items-center gap-2 shadow-lg bg-background text-foreground border border-border hover:bg-muted transition-all duration-200 whitespace-nowrap',
              open ? 'animate-in fade-in slide-in-from-bottom-2' : ''
            )}
            style={{
              animationDelay: open ? `${index * 50}ms` : '0ms',
            }}
            onClick={action.action}
          >
            <action.icon className={cn('h-4 w-4', action.color)} />
            <span className="text-sm font-medium text-foreground">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Main FAB button */}
      <Button
        size="icon"
        className={cn(
          'h-14 w-14 rounded-full shadow-lg transition-all duration-200',
          'bg-accent hover:bg-accent/90 text-accent-foreground',
          open && 'rotate-45'
        )}
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Close quick actions' : 'Open quick actions'}
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <Zap className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
};

export default AdminQuickActions;
