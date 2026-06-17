import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { parseAdminError } from '@/utils/adminErrorParser';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import {
  Eye,
  Settings,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Star,
  MessageCircle,
  Calendar,
  Clock,
  Users,
  Activity,
  MoreHorizontal,
  Mail,
  Copy,
  Link as LinkIcon,
  ShieldCheck,
  UserCog,
  Ban,
  LogOut,
  KeyRound,
  UserCheck,
  UserX,
  Trash2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface UserWithStats {
  id: string;
  name: string | null;
  email: string;
  role: string;
  suspended: boolean;
  created_at: string;
  updated_at: string;
  avatar_url: string | null;
  email_verified: boolean;
  email_confirmed_at: string;
  last_sign_in_at: string;
  stats?: {
    chats: number;
    favorites: number;
    feedback: number;
    lastActivity: string;
  };
}

interface Column {
  key: string;
  label: string;
  sortable: boolean;
  visible: boolean;
  width?: string;
}

interface UsersTableProps {
  users: UserWithStats[];
  selectedUsers: Set<string>;
  onSelectUser: (userId: string) => void;
  onSelectAll: () => void;
  onViewUser: (user: UserWithStats) => void;
  isLoading?: boolean;
}

type SortDirection = 'asc' | 'desc' | null;

const UsersTable: React.FC<UsersTableProps> = ({
  users,
  selectedUsers,
  onSelectUser,
  onSelectAll,
  onViewUser,
  isLoading,
}) => {
  const [sortColumn, setSortColumn] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const queryClient = useQueryClient();

  // Current admin context (for self-row guards + role gating)
  const { data: currentCtx } = useQuery({
    queryKey: ['admin-current-ctx'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { id: '', role: 'user' as const };
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      return { id: user.id, role: (profile?.role ?? 'user') as 'user' | 'admin' | 'superadmin' };
    },
    staleTime: 60_000,
  });
  const currentUserId = currentCtx?.id ?? '';
  const isSuperAdmin = currentCtx?.role === 'superadmin';

  // Confirmation dialog state
  const [confirm, setConfirm] = useState<null | {
    title: string;
    description: string;
    actionLabel: string;
    destructive?: boolean;
    typedValue?: string;
    onConfirm: () => Promise<void> | void;
  }>(null);
  const [typedInput, setTypedInput] = useState('');
  const openConfirm = (cfg: NonNullable<typeof confirm>) => {
    setTypedInput('');
    setConfirm(cfg);
  };
  const closeConfirm = () => {
    setConfirm(null);
    setTypedInput('');
  };
  
  const [columns, setColumns] = useState<Column[]>([
    { key: 'select', label: 'Select', sortable: false, visible: true, width: 'w-12' },
    { key: 'user', label: 'User', sortable: true, visible: true },
    { key: 'email', label: 'Email', sortable: true, visible: true },
    { key: 'status', label: 'Status', sortable: true, visible: true },
    { key: 'role', label: 'Role', sortable: true, visible: true },
    { key: 'chats', label: 'Chats', sortable: true, visible: true, width: 'w-20' },
    { key: 'favorites', label: 'Favorites', sortable: true, visible: true, width: 'w-24' },
    { key: 'feedback', label: 'Feedback', sortable: true, visible: true, width: 'w-24' },
    { key: 'last_login', label: 'Last Login', sortable: true, visible: true },
    { key: 'created_at', label: 'Created', sortable: true, visible: true },
    { key: 'actions', label: 'Actions', sortable: false, visible: true, width: 'w-24' },
  ]);

  // Fetch user stats for all users
  const { data: usersWithStats = [] } = useQuery({
    queryKey: ['users-with-stats', users.map(u => u.id)],
    queryFn: async () => {
      if (users.length === 0) return [];

      const userIds = users.map(u => u.id);
      
      // Fetch stats for all users in parallel
      const [chatsResult, favoritesResult, feedbackResult] = await Promise.all([
        supabase
          .from('chats')
          .select('user_id, updated_at')
          .in('user_id', userIds),
        supabase
          .from('favorites')
          .select('user_id')
          .in('user_id', userIds),
        supabase
          .from('feedback_logs')
          .select('user_id')
          .in('user_id', userIds),
      ]);

      // Calculate stats per user
      const userStats = userIds.reduce((acc, userId) => {
        const userChats = chatsResult.data?.filter(chat => chat.user_id === userId) || [];
        const userFavorites = favoritesResult.data?.filter(fav => fav.user_id === userId) || [];
        const userFeedback = feedbackResult.data?.filter(feedback => feedback.user_id === userId) || [];
        
        // Find last activity from chats
        const lastChatActivity = userChats.length > 0 
          ? Math.max(...userChats.map(chat => new Date(chat.updated_at).getTime()))
          : 0;
        
        acc[userId] = {
          chats: userChats.length,
          favorites: userFavorites.length,
          feedback: userFeedback.length,
          lastActivity: lastChatActivity > 0 ? new Date(lastChatActivity).toISOString() : null,
        };
        
        return acc;
      }, {} as Record<string, any>);

      // Merge users with their stats
      return users.map(user => ({
        ...user,
        stats: userStats[user.id] || { chats: 0, favorites: 0, feedback: 0, lastActivity: null }
      }));
    },
    enabled: users.length > 0,
  });

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(current => {
        if (current === 'asc') return 'desc';
        if (current === 'desc') return null;
        return 'asc';
      });
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const toggleColumnVisibility = (columnKey: string) => {
    setColumns(current =>
      current.map(col =>
        col.key === columnKey ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const sortedUsers = useMemo(() => {
    if (!sortDirection || !sortColumn) return usersWithStats;

    return [...usersWithStats].sort((a, b) => {
      let aValue: any = a[sortColumn as keyof typeof a];
      let bValue: any = b[sortColumn as keyof typeof b];

      // Handle special sorting cases
      if (sortColumn === 'chats' || sortColumn === 'favorites' || sortColumn === 'feedback') {
        aValue = a.stats?.[sortColumn as keyof typeof a.stats] || 0;
        bValue = b.stats?.[sortColumn as keyof typeof b.stats] || 0;
      } else if (sortColumn === 'last_login') {
        aValue = a.last_sign_in_at ? new Date(a.last_sign_in_at).getTime() : 0;
        bValue = b.last_sign_in_at ? new Date(b.last_sign_in_at).getTime() : 0;
      } else if (sortColumn === 'user') {
        aValue = a.name || a.email;
        bValue = b.name || b.email;
      } else if (sortColumn === 'status') {
        aValue = a.suspended ? 'suspended' : 'active';
        bValue = b.suspended ? 'suspended' : 'active';
      }

      // Convert to comparable values
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [usersWithStats, sortColumn, sortDirection]);

  const visibleColumns = columns.filter(col => col.visible);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300';
      case 'admin':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300';
      case 'user':
        return 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="h-4 w-4 text-blue-600" />;
    }
    if (sortDirection === 'desc') {
      return <ArrowDown className="h-4 w-4 text-blue-600" />;
    }
    return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
  };

  const formatLastLogin = (lastSignIn: string) => {
    if (!lastSignIn) return 'Never';
    return formatDistanceToNow(new Date(lastSignIn), { addSuffix: true });
  };

  const handleSendPasswordReset = async (userId: string, email: string) => {
    try {
      const { error } = await supabase.functions.invoke('admin-reset-password', {
        body: { userId }
      });
      if (error) {
        const parsed = await parseAdminError(error);
        toast.error('Failed to send password reset', { description: parsed.message });
        return;
      }
      toast.success(`Password reset email sent to ${email}`);
    } catch (error) {
      toast.error('Failed to send password reset email');
    }
  };

  const refetchUsers = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    queryClient.invalidateQueries({ queryKey: ['users-with-stats'] });
  };

  const invokeAdmin = async (fn: string, body: Record<string, unknown>, successMsg: string, failMsg: string) => {
    try {
      const { error } = await supabase.functions.invoke(fn, { body });
      if (error) {
        const parsed = await parseAdminError(error);
        toast.error(failMsg, { description: parsed.message });
        return false;
      }
      toast.success(successMsg);
      refetchUsers();
      return true;
    } catch {
      toast.error(failMsg);
      return false;
    }
  };

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Copy failed');
    }
  };

  const handleSendMagicLink = (u: UserWithStats) =>
    invokeAdmin('admin-send-magic-link', { userId: u.id }, `Magic link sent to ${u.email}`, 'Failed to send magic link');

  const handleVerifyEmail = (u: UserWithStats) =>
    invokeAdmin('admin-verify-email', { userId: u.id }, `Email verified for ${u.email}`, 'Failed to verify email');

  const handleChangeRole = (u: UserWithStats, role: 'user' | 'admin' | 'superadmin') =>
    invokeAdmin('admin-update-profile', { userId: u.id, role }, `Role updated to ${role}`, 'Failed to update role');

  const handleToggleSuspend = (u: UserWithStats) => {
    const next = !u.suspended;
    openConfirm({
      title: next ? `Suspend ${u.email}?` : `Reactivate ${u.email}?`,
      description: next
        ? 'They will be signed out and unable to log in until reactivated.'
        : 'They will regain access immediately.',
      actionLabel: next ? 'Suspend' : 'Reactivate',
      destructive: next,
      onConfirm: () =>
        invokeAdmin(
          'admin-update-profile',
          { userId: u.id, suspended: next },
          next ? `${u.email} suspended` : `${u.email} reactivated`,
          'Failed to update status',
        ).then(() => {}),
    });
  };

  const handleForceLogout = (u: UserWithStats) =>
    openConfirm({
      title: `Sign ${u.email} out of all devices?`,
      description: 'All active sessions will be invalidated immediately.',
      actionLabel: 'Force logout',
      destructive: true,
      onConfirm: () =>
        invokeAdmin('admin-logout-user', { userId: u.id }, `${u.email} signed out`, 'Failed to force logout').then(() => {}),
    });

  const handleResetMfa = (u: UserWithStats) =>
    openConfirm({
      title: `Reset 2FA for ${u.email}?`,
      description: 'All 2FA factors will be removed. The user will need to re-enroll.',
      actionLabel: 'Reset 2FA',
      destructive: true,
      onConfirm: () =>
        invokeAdmin(
          'admin-user-security',
          { userId: u.id, action: 'reset_mfa' },
          `2FA reset for ${u.email}`,
          'Failed to reset 2FA',
        ).then(() => {}),
    });

  const handleImpersonate = (u: UserWithStats) =>
    openConfirm({
      title: `Sign in as ${u.email}?`,
      description: 'This action is logged. A new tab will open with a one-time sign-in link for this user.',
      actionLabel: 'Impersonate',
      destructive: true,
      onConfirm: async () => {
        try {
          const { data, error } = await supabase.functions.invoke('admin-impersonate-user', { body: { userId: u.id } });
          if (error || !(data as any)?.action_link) {
            const parsed = error ? await parseAdminError(error) : { message: 'No link returned' };
            toast.error('Failed to impersonate', { description: parsed.message });
            return;
          }
          window.open((data as any).action_link, '_blank', 'noopener,noreferrer');
          toast.success(`Impersonation link opened for ${u.email}`);
        } catch {
          toast.error('Failed to impersonate');
        }
      },
    });

  const handleDelete = (u: UserWithStats) =>
    openConfirm({
      title: `Delete ${u.email}?`,
      description: `This permanently removes the user and their data. Type the email to confirm.`,
      actionLabel: 'Delete forever',
      destructive: true,
      typedValue: u.email,
      onConfirm: () =>
        invokeAdmin('admin-delete-user', { userId: u.id }, `${u.email} deleted`, 'Failed to delete user').then(() => {}),
    });

  if (isLoading) {
    return (
      <div className="w-full p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Column Visibility Controls */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Showing {sortedUsers.length} users
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Show/Hide Columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {columns
              .filter(col => col.key !== 'select' && col.key !== 'actions')
              .map(column => (
                <DropdownMenuCheckboxItem
                  key={column.key}
                  checked={column.visible}
                  onCheckedChange={() => toggleColumnVisibility(column.key)}
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map(column => (
                <TableHead
                  key={column.key}
                  className={`${column.width || ''} ${column.sortable ? 'cursor-pointer hover:bg-muted' : ''}`}
                  onClick={column.sortable ? () => handleSort(column.key) : undefined}
                >
                  <div className="flex items-center gap-2">
                    {column.key === 'select' ? (
                      <Checkbox
                        checked={selectedUsers.size === sortedUsers.length && sortedUsers.length > 0}
                        onCheckedChange={onSelectAll}
                      />
                    ) : (
                      <>
                        {column.label}
                        {column.sortable && getSortIcon(column.key)}
                      </>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUsers.map((user) => (
              <TableRow key={user.id} className={user.suspended ? 'opacity-60 bg-red-50' : ''}>
                {visibleColumns.map(column => {
                  switch (column.key) {
                    case 'select':
                      return (
                        <TableCell key={column.key}>
                          <Checkbox
                            checked={selectedUsers.has(user.id)}
                            onCheckedChange={() => onSelectUser(user.id)}
                          />
                        </TableCell>
                      );
                    
                    case 'user':
                      return (
                        <TableCell key={column.key}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {(user.name || user.email).charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">{user.name || 'No name'}</div>
                              <div className="text-sm text-muted-foreground">{user.id.substring(0, 8)}...</div>
                            </div>
                          </div>
                        </TableCell>
                      );
                    
                    case 'email':
                      return (
                        <TableCell key={column.key}>
                          <div>
                            <div>{user.email}</div>
                            {user.email_verified && (
                              <Badge variant="outline" className="text-xs mt-1 bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300 border-green-200 dark:border-green-500/20">
                                Verified
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      );
                    
                    case 'status':
                      return (
                        <TableCell key={column.key}>
                          {user.suspended ? (
                            <Badge className="bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300 text-xs">
                              Suspended
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300 text-xs">
                              Active
                            </Badge>
                          )}
                        </TableCell>
                      );
                    
                    case 'role':
                      return (
                        <TableCell key={column.key}>
                          <Badge className={getRoleColor(user.role)}>
                            {user.role}
                          </Badge>
                        </TableCell>
                      );
                    
                    case 'chats':
                      return (
                        <TableCell key={column.key}>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{user.stats?.chats || 0}</span>
                          </div>
                        </TableCell>
                      );
                    
                    case 'favorites':
                      return (
                        <TableCell key={column.key}>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{user.stats?.favorites || 0}</span>
                          </div>
                        </TableCell>
                      );
                    
                    case 'feedback':
                      return (
                        <TableCell key={column.key}>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{user.stats?.feedback || 0}</span>
                          </div>
                        </TableCell>
                      );
                    
                    case 'last_login':
                      return (
                        <TableCell key={column.key}>
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className={!user.last_sign_in_at ? 'text-muted-foreground italic' : ''}>
                              {formatLastLogin(user.last_sign_in_at)}
                            </span>
                          </div>
                        </TableCell>
                      );
                    
                    case 'created_at':
                      return (
                        <TableCell key={column.key}>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                      );
                    
                    case 'actions':
                      return (
                        <TableCell key={column.key}>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewUser(user)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem onClick={() => onViewUser(user)}>
                                  <Eye className="w-4 h-4 mr-2" /> View profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleCopy(user.email, 'Email')}>
                                  <Copy className="w-4 h-4 mr-2" /> Copy email
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleCopy(user.id, 'User ID')}>
                                  <Copy className="w-4 h-4 mr-2" /> Copy user ID
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleSendPasswordReset(user.id, user.email)}>
                                  <Mail className="w-4 h-4 mr-2" /> Send password reset
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSendMagicLink(user)}>
                                  <LinkIcon className="w-4 h-4 mr-2" /> Send magic link
                                </DropdownMenuItem>
                                {!user.email_verified && (
                                  <DropdownMenuItem onClick={() => handleVerifyEmail(user)}>
                                    <ShieldCheck className="w-4 h-4 mr-2" /> Verify email manually
                                  </DropdownMenuItem>
                                )}
                                {user.id !== currentUserId && (
                                  <>
                                    <DropdownMenuSeparator />
                                    {isSuperAdmin && (
                                      <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>
                                          <UserCog className="w-4 h-4 mr-2" /> Change role
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent>
                                          {(['user', 'admin', 'superadmin'] as const).map((r) => (
                                            <DropdownMenuItem
                                              key={r}
                                              disabled={user.role === r}
                                              onClick={() => handleChangeRole(user, r)}
                                            >
                                              {r}
                                            </DropdownMenuItem>
                                          ))}
                                        </DropdownMenuSubContent>
                                      </DropdownMenuSub>
                                    )}
                                    <DropdownMenuItem onClick={() => handleToggleSuspend(user)}>
                                      {user.suspended ? (
                                        <><UserCheck className="w-4 h-4 mr-2" /> Reactivate user</>
                                      ) : (
                                        <><Ban className="w-4 h-4 mr-2" /> Suspend user</>
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleForceLogout(user)}>
                                      <LogOut className="w-4 h-4 mr-2" /> Force logout
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleResetMfa(user)}>
                                      <KeyRound className="w-4 h-4 mr-2" /> Reset 2FA
                                    </DropdownMenuItem>
                                    {isSuperAdmin && (
                                      <DropdownMenuItem onClick={() => handleImpersonate(user)}>
                                        <UserX className="w-4 h-4 mr-2" /> Impersonate user
                                      </DropdownMenuItem>
                                    )}
                                    {isSuperAdmin && user.role !== 'superadmin' && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => handleDelete(user)}
                                          className="text-destructive focus:text-destructive"
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" /> Delete user
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      );
                    
                    default:
                      return <TableCell key={column.key}>-</TableCell>;
                  }
                })}
              </TableRow>
            ))}
            {sortedUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(open) => { if (!open) closeConfirm(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirm?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          {confirm?.typedValue && (
            <Input
              autoFocus
              placeholder={confirm.typedValue}
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
            />
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!!confirm?.typedValue && typedInput !== confirm.typedValue}
              className={confirm?.destructive ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
              onClick={async () => {
                const fn = confirm?.onConfirm;
                closeConfirm();
                if (fn) await fn();
              }}
            >
              {confirm?.actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UsersTable;