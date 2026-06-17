
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Mail,
  CheckCircle,
  XCircle,
  Shield,
  Activity,
  LogOut,
  Globe,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import BackToAdminButton from '@/components/admin/BackToAdminButton';
import UserDetailModal from '@/components/admin/users/UserDetailModal';
import UserChatsTab from '@/components/admin/users/UserChatsTab';
import UserFavoritesTab from '@/components/admin/users/UserFavoritesTab';
import UserFeedbackTab from '@/components/admin/users/UserFeedbackTab';
import AddUserModal from '@/components/admin/users/AddUserModal';
import UsersTable from '@/components/admin/users/UsersTable';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { parseAdminError } from '@/utils/adminErrorParser';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { UserProfile } from '@/types/user';

const AdminUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  // Fetch users using admin edge function
  const { data: users = [], isLoading, refetch, error: queryError } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      console.log('🔍 AdminUsersPage: Starting user fetch...');
      
      // Debug authentication
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔑 Current session:', session ? 'exists' : 'missing');
      console.log('🔑 Session token:', session?.access_token ? 'Present' : 'Missing');
      console.log('🔑 User ID:', session?.user?.id);
      
      // Check user role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session?.user?.id)
        .single();
      console.log('👤 User role:', profile?.role);
      
      console.log('📡 Calling admin-get-users function...');
      const { data, error } = await supabase.functions.invoke('admin-get-users', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      
      if (error) {
        const parsed = await parseAdminError(error);
        console.error('❌ Error fetching users:', parsed.message);
        throw new Error(parsed.message);
      }
      
      console.log('✅ Users data received:', data);
      console.log('📊 Number of users:', data?.users?.length || 0);
      return data?.users || [];
    },
    retry: 1,
    staleTime: 0, // Always refetch
  });

  // Log query state
  console.log('⚡ Query state:', { isLoading, users: users.length, error: queryError });

  if (queryError) {
    console.error('🚨 Query error:', queryError);
  }

  const filteredUsers = users.filter((user: any) => {
    const HIDDEN_EMAILS = ['beds.vinyls.2z@icloud.com', 'kylejasper8@gmail.com', 'andreea.havrisciuc@gmail.com'];
    if (HIDDEN_EMAILS.includes(user.email?.toLowerCase())) return false;
    const matchesSearch = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && !user.suspended) ||
                         (statusFilter === 'suspended' && user.suspended) ||
                         (statusFilter === 'verified' && user.email_verified) ||
                         (statusFilter === 'unverified' && !user.email_verified);
    return matchesSearch && matchesRole && matchesStatus;
  });

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

  const handleViewUser = (user: UserProfile) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedUsers(new Set(filteredUsers.map((user: any) => user.id)));
      setShowBulkActions(true);
    }
  };

  const handleBulkSuspend = async () => {
    try {
      await Promise.all(
        Array.from(selectedUsers).map(userId => 
          supabase.functions.invoke('admin-update-profile', {
            body: { userId, suspended: true }
          })
        )
      );
      setSelectedUsers(new Set());
      setShowBulkActions(false);
      refetch();
    } catch (error) {
      console.error('Bulk suspend failed:', error);
    }
  };

  const handleBulkActivate = async () => {
    try {
      await Promise.all(
        Array.from(selectedUsers).map(userId => 
          supabase.functions.invoke('admin-update-profile', {
            body: { userId, suspended: false }
          })
        )
      );
      setSelectedUsers(new Set());
      setShowBulkActions(false);
      refetch();
    } catch (error) {
      console.error('Bulk activate failed:', error);
    }
  };

  const handleForceLogoutAll = async () => {
    setIsLoggingOutAll(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.functions.invoke('admin-logout-all-users', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      if (error) {
        const parsed = await parseAdminError(error);
        toast.error('Failed to force logout all users', { description: parsed.message });
        return;
      }
      toast.success('All users have been logged out (except you)');
    } catch (error) {
      console.error('Force logout failed:', error);
      toast.error('Failed to force logout all users');
    } finally {
      setIsLoggingOutAll(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (queryError) {
    return (
      <AdminLayout>
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <div className="text-destructive text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Error Loading Users</h2>
            <p className="text-muted-foreground mb-4">{queryError.message}</p>
            <Button onClick={() => refetch()} className="mb-2">
              Retry
            </Button>
            <div className="text-xs text-muted-foreground mt-4">
              <p>Check console for detailed error logs</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        <BackToAdminButton />
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground mt-1">Manage users, roles, and permissions</p>
          </div>
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 text-destructive border-destructive/30 hover:bg-destructive/10">
                  <LogOut className="w-4 h-4" />
                  Force Logout All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Force Logout All Users</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will immediately terminate all active sessions for every user (except yours). All users will need to log in again. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleForceLogoutAll}
                    disabled={isLoggingOutAll}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isLoggingOutAll ? 'Logging out...' : 'Confirm Logout All'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button className="flex items-center gap-2" onClick={() => setShowAddModal(true)}>
              <UserPlus className="w-4 h-4" />
              Add User
            </Button>
            <Button variant="outline" className="flex items-center gap-2" asChild>
              <Link to="/admin/domains">
                <Globe className="w-4 h-4" />
                Email Domains
              </Link>
            </Button>
          </div>
        </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold text-brand-blue dark:text-foreground">{users.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">All registered users</p>
                  </div>
                  <Users className="w-8 h-8 text-brand-blue dark:text-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Users</p>
                    <p className="text-2xl font-bold text-green-600">
                      {users.filter((u: any) => !u.suspended).length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Non-suspended</p>
                  </div>
                  <UserPlus className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Admins</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {users.filter((u: any) => u.role === 'admin' || u.role === 'superadmin').length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Admin + Super admin</p>
                  </div>
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Email Verified</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {users.filter((u: any) => u.email_verified).length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Confirmed emails</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Recent Logins</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {users.filter((u: any) => {
                        if (!u.last_sign_in_at) return false;
                        const lastLogin = new Date(u.last_sign_in_at);
                        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                        return lastLogin > sevenDaysAgo;
                      }).length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
                  </div>
                  <Activity className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search users by email or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="superadmin">Super Admins</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="verified">Email Verified</SelectItem>
                  <SelectItem value="unverified">Email Unverified</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {showBulkActions && (
            <Card className="mb-6 border-blue-200 dark:border-blue-500/20 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleBulkActivate}
                      className="text-green-700 border-green-300 hover:bg-green-50"
                    >
                      Activate Selected
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleBulkSuspend}
                      className="text-orange-700 border-orange-300 hover:bg-orange-50"
                    >
                      Suspend Selected
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedUsers(new Set());
                        setShowBulkActions(false);
                      }}
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Users Table */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Users ({filteredUsers.length})</span>
                {filteredUsers.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    className="text-sm"
                  >
                    {selectedUsers.size === filteredUsers.length ? 'Deselect All' : 'Select All'}
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UsersTable
                users={filteredUsers}
                selectedUsers={selectedUsers}
                onSelectUser={handleSelectUser}
                onSelectAll={handleSelectAll}
                onViewUser={(user) => handleViewUser(user as any)}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>

          {/* User Detail Modal */}
          {selectedUser && (
            <UserDetailModal
              user={selectedUser}
              isOpen={showUserModal}
              onClose={() => {
                setShowUserModal(false);
                setSelectedUser(null);
                refetch();
              }}
            />
          )}

          {/* Add User Modal */}
          <AddUserModal
            open={showAddModal}
            onClose={() => setShowAddModal(false)}
            onCreated={() => refetch()}
          />
        </div>
      </AdminLayout>
    );
  };

export default AdminUsersPage;
