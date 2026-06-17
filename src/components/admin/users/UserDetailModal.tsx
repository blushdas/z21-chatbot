import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { parseAdminError } from '@/utils/adminErrorParser';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  User, 
  MessageSquare, 
  Star, 
  MessageCircle, 
  Save,
  Calendar,
  Shield,
  Users,
  UserCheck,
  Mail,
  Trash2,
  UserX,
  UserPlus,
  Activity,
  Key,
  LogOut
} from 'lucide-react';
import { toast } from 'sonner';
import UserChatsTab from './UserChatsTab';
import UserFavoritesTab from './UserFavoritesTab';
import UserFeedbackTab from './UserFeedbackTab';
import UserSecurityTab from './UserSecurityTab';
import type { UserProfile, UserRole } from '@/types/user';

interface UserDetailModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, isOpen, onClose }) => {
  const [editedName, setEditedName] = useState(user.name || '');
  const [editedEmail, setEditedEmail] = useState(user.email || '');
  const [editedRole, setEditedRole] = useState<UserRole>(user.role);
  const [userSuspended, setUserSuspended] = useState((user as any).suspended || false);
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const queryClient = useQueryClient();

  // Get user statistics
  const { data: userStats } = useQuery({
    queryKey: ['user-stats', user.id],
    queryFn: async () => {
      const [chatsResult, favoritesResult, feedbackResult] = await Promise.all([
        supabase.from('chats').select('id').eq('user_id', user.id),
        supabase.from('favorites').select('id').eq('user_id', user.id),
        supabase.from('feedback_logs').select('id').eq('user_id', user.id)
      ]);

      return {
        chats: chatsResult.data?.length || 0,
        favorites: favoritesResult.data?.length || 0,
        feedback: feedbackResult.data?.length || 0
      };
    },
    enabled: isOpen
  });

  // Get current user's role to check if they are superadmin
  const { data: currentUserProfile } = useQuery({
    queryKey: ['current-user-profile'],
    queryFn: async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single();
      
      return data;
    }
  });

  const isSuperAdmin = currentUserProfile?.role === 'superadmin';

  // Sync form state when user prop changes (after successful updates)
  useEffect(() => {
    setEditedName(user.name || '');
    setEditedEmail(user.email || '');
    setEditedRole(user.role);
    setUserSuspended((user as any).suspended || false);
  }, [user]);

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (updates: { name?: string; email?: string; role?: UserRole; suspended?: boolean }) => {
      const { error } = await supabase.functions.invoke('admin-update-profile', {
        body: {
          userId: user.id,
          ...updates,
        }
      });
      if (error) {
        const parsed = await parseAdminError(error);
        throw new Error(parsed.message);
      }
    },
    onSuccess: () => {
      toast.success('User updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats', user.id] });
    },
    onError: (error) => {
      toast.error('Failed to update user', { description: (error as Error).message });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId }
      });
      if (error) {
        const parsed = await parseAdminError(error);
        throw new Error(parsed.message);
      }
    },
    onSuccess: () => {
      toast.success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      onClose();
    },
    onError: (error) => {
      toast.error('Failed to delete user', { description: (error as Error).message });
    }
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const { data, error } = await supabase.functions.invoke('admin-update-password', {
        body: { userId, newPassword }
      });
      if (error) {
        const parsed = await parseAdminError(error);
        throw new Error(parsed.message);
      }
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      toast.success('Password updated successfully');
      setNewPassword('');
      setShowPasswordField(false);
    },
    onError: (error) => {
      toast.error((error as Error)?.message || 'Failed to update password');
    }
  });

  const handleSaveChanges = () => {
    const updates: { name?: string; email?: string; role?: UserRole; suspended?: boolean } = {};
    
    if (editedName !== user.name) {
      updates.name = editedName;
    }
    
    if (editedEmail !== user.email) {
      updates.email = editedEmail;
    }
    
    if (editedRole !== user.role) {
      updates.role = editedRole;
    }

    if (userSuspended !== (user as any).suspended) {
      updates.suspended = userSuspended;
    }

    if (Object.keys(updates).length > 0) {
      updateUserMutation.mutate(updates);
    }
  };

  const handleDeleteUser = () => {
    if (user.role === 'superadmin') {
      toast.error('Cannot delete superadmin users');
      return;
    }
    deleteUserMutation.mutate(user.id);
  };

  const handleForcePasswordReset = async () => {
    try {
      const { error } = await supabase.functions.invoke('admin-reset-password', {
        body: { userId: user.id }
      });
      if (error) {
        const parsed = await parseAdminError(error);
        toast.error('Failed to send reset email', { description: parsed.message });
        return;
      }
      toast.success('Password reset email sent');
    } catch (error) {
      toast.error('Failed to send reset email');
    }
  };

  const handleUpdatePassword = () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    updatePasswordMutation.mutate({ userId: user.id, newPassword });
  };

  const handleForceLogout = async () => {
    setIsLoggingOut(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.functions.invoke('admin-logout-user', {
        body: { userId: user.id },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) {
        const parsed = await parseAdminError(error);
        toast.error('Failed to force logout user', { description: parsed.message });
        return;
      }
      toast.success(`${user.name || user.email} has been logged out`);
    } catch (error) {
      toast.error('Failed to force logout user');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'superadmin':
        return <Shield className="w-4 h-4" />;
      case 'admin':
        return <UserCheck className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'superadmin':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300 border-purple-200 dark:border-purple-500/20';
      case 'admin':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 border-blue-200 dark:border-blue-500/20';
      case 'user':
        return 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300 border-green-200 dark:border-green-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center">
              <span className="text-lg font-medium text-brand-green">
                {(user.name || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="text-xl font-semibold">{user.name || 'Unnamed User'}</div>
              <Badge className={`${getRoleBadgeColor(user.role)} flex items-center gap-1 w-fit mt-1`}>
                {getRoleIcon(user.role)}
                {user.role}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="chats" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Chats ({userStats?.chats || 0})
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Favorites ({userStats?.favorites || 0})
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Feedback ({userStats?.feedback || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      placeholder="Enter user name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editedEmail}
                      onChange={(e) => setEditedEmail(e.target.value)}
                      placeholder="Enter user email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={editedRole} onValueChange={(value: UserRole) => setEditedRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="superadmin">Superadmin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Account Status</Label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="status"
                        checked={!userSuspended}
                        onChange={() => setUserSuspended(false)}
                        className="rounded border-input"
                      />
                      <span className="text-sm flex items-center gap-1">
                        <UserPlus className="w-4 h-4 text-green-600" />
                        Active
                      </span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="status"
                        checked={userSuspended}
                        onChange={() => setUserSuspended(true)}
                        className="rounded border-input"
                      />
                      <span className="text-sm flex items-center gap-1">
                        <UserX className="w-4 h-4 text-red-600" />
                        Suspended
                      </span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>User ID</Label>
                    <div className="p-2 bg-muted rounded border font-mono text-sm">
                      {user.id}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Joined Date</Label>
                    <div className="p-2 bg-muted rounded border flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Password Update Section - Only for Super Admins */}
                {isSuperAdmin && (
                  <div className="space-y-4 p-4 bg-orange-50 rounded-lg border border-orange-200 dark:border-orange-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Key className="w-5 h-5 text-orange-600" />
                        <Label className="text-orange-800 font-medium">Update Password</Label>
                      </div>
                      {!showPasswordField && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPasswordField(true)}
                          className="text-orange-600 border-orange-300 hover:bg-orange-100"
                        >
                          <Key className="w-4 h-4 mr-1" />
                          Change Password
                        </Button>
                      )}
                    </div>
                    
                    {showPasswordField && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">New Password</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password (min 6 characters)"
                            className="border-orange-300 focus:border-orange-500"
                          />
                          <p className="text-sm text-orange-700">
                            Password must be at least 6 characters long
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleUpdatePassword}
                            disabled={updatePasswordMutation.isPending || !newPassword}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                          >
                            {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowPasswordField(false);
                              setNewPassword('');
                            }}
                            className="text-orange-600 border-orange-300 hover:bg-orange-100"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center pt-4">
                  <div className="flex gap-2 flex-wrap">
                    {/* Force Logout — fires directly, low-risk reversible action */}
                    <Button 
                      variant="outline"
                      onClick={handleForceLogout}
                      disabled={isLoggingOut}
                      className="flex items-center gap-2 text-amber-700 border-amber-300 hover:bg-amber-50"
                    >
                      <LogOut className="w-4 h-4" />
                      {isLoggingOut ? 'Logging out...' : 'Force Logout'}
                    </Button>

                    {/* Force Password Reset — confirmation required */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline"
                          className="flex items-center gap-2 text-orange-600 border-orange-300 hover:bg-orange-50"
                        >
                          <Mail className="w-4 h-4" />
                          Force Password Reset
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Send Password Reset Email</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will send a password reset email to <strong>{user.email}</strong>. The user will be prompted to choose a new password when they click the link. Continue?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleForcePasswordReset}
                            className="bg-orange-600 text-white hover:bg-orange-700"
                          >
                            Send Reset Email
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    {/* Delete User — confirmation required, destructive */}
                    {user.role !== 'superadmin' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline"
                            className="flex items-center gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete User
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to permanently delete <strong>{user.name || user.email}</strong>? This action cannot be undone and will remove all associated data including chats, favorites, and feedback.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteUser}
                              disabled={deleteUserMutation.isPending}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                  <Button 
                    onClick={handleSaveChanges}
                    disabled={updateUserMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chats">
            <UserChatsTab userId={user.id} userName={user.name || undefined} />
          </TabsContent>

          <TabsContent value="favorites">
            <UserFavoritesTab userId={user.id} />
          </TabsContent>

          <TabsContent value="feedback">
            <UserFeedbackTab userId={user.id} />
          </TabsContent>

          <TabsContent value="security">
            <UserSecurityTab
              userId={user.id}
              userName={user.name || user.email || undefined}
              onForceLogout={handleForceLogout}
              isForcingLogout={isLoggingOut}
            />
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  User Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Account Timeline */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 rounded-lg border border-green-200 dark:border-green-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-green-800 dark:text-green-300">Account Created</div>
                          <div className="text-sm text-green-700 dark:text-green-400/80">Member since</div>
                        </div>
                      </div>
                      <div className="text-lg font-medium text-green-900 dark:text-green-200">
                        {new Date(user.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-500/20">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <Activity className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-blue-800 dark:text-blue-300">Last Updated</div>
                          <div className="text-sm text-blue-700 dark:text-blue-400/80">Profile modified</div>
                        </div>
                      </div>
                      <div className="text-lg font-medium text-blue-900 dark:text-blue-200">
                        {new Date(user.updated_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {/* Activity Stats */}
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 p-6 rounded-lg border border-purple-200 dark:border-purple-500/20">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        <Activity className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xl font-semibold text-purple-900 dark:text-purple-200">Activity Overview</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-card rounded-lg border border-purple-100 dark:border-purple-500/20">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                          <MessageSquare className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">{userStats?.chats || 0}</div>
                        <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Chats</div>
                        <div className="text-xs text-muted-foreground mt-1">Conversations saved</div>
                      </div>
                      
                      <div className="text-center p-4 bg-card rounded-lg border border-purple-100 dark:border-purple-500/20">
                        <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Star className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">{userStats?.favorites || 0}</div>
                        <div className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Favorites</div>
                        <div className="text-xs text-muted-foreground mt-1">Messages bookmarked</div>
                      </div>
                      
                      <div className="text-center p-4 bg-card rounded-lg border border-purple-100 dark:border-purple-500/20">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                          <MessageCircle className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">{userStats?.feedback || 0}</div>
                        <div className="text-sm font-medium text-green-700 dark:text-green-300">Feedback</div>
                        <div className="text-xs text-muted-foreground mt-1">Responses given</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailModal;
