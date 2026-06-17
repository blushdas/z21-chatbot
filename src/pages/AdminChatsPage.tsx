import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import UnifiedChatViewer from '@/components/admin/UnifiedChatViewer';
import AdminLayout from '@/components/admin/AdminLayout';
import BackToAdminButton from '@/components/admin/BackToAdminButton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, MessageSquare, Clock } from 'lucide-react';
import { toastError } from '@/utils/toastError';
import { formatDistanceToNow } from 'date-fns';

interface UserWithChats {
  id: string;
  name: string;
  email: string;
  chats: ChatData[];
}

interface ChatData {
  id: string;
  title: string;
  updated_at: string;
  created_at: string;
  message_count: number;
  mode?: string;
  messages?: any[];
}

const AdminChatsPage: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithChats[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Modal state
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<{
    id: string;
    title: string;
    messages: any[];
    mode?: string;
    created_at: string;
    updated_at: string;
    profiles?: { name?: string; email?: string } | null;
  } | null>(null);
  const [loadingChat, setLoadingChat] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!loading && user && profile) {
      if (profile.role !== 'superadmin') {
        toastError("You don't have permission to access this page.", 'Access Denied');
        navigate('/admin');
      }
    } else if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, profile, loading, navigate]);

  // Fetch all users with their chats
  useEffect(() => {
    const fetchUsersWithChats = async () => {
      if (!user || !profile || profile.role !== 'superadmin') return;

      try {
        setLoadingUsers(true);

        const [profilesRes, chatsRes] = await Promise.all([
          supabase.from('profiles').select('id, name, email').order('name'),
          supabase.from('chats').select('id, title, updated_at, created_at, user_id, mode, messages').order('updated_at', { ascending: false }),
        ]);

        if (profilesRes.error) throw profilesRes.error;
        if (chatsRes.error) throw chatsRes.error;

        const usersWithChats: UserWithChats[] = profilesRes.data
          .filter(p => !['beds.vinyls.2z@icloud.com', 'kylejasper8@gmail.com', 'andreea.havrisciuc@gmail.com'].includes((p.email || '').toLowerCase()))
          .map(p => ({
            id: p.id,
            name: p.name || 'Unknown',
            email: p.email,
            chats: chatsRes.data
              .filter(c => c.user_id === p.id)
              .map(c => ({
                id: c.id,
                title: c.title,
                updated_at: c.updated_at,
                created_at: c.created_at,
                mode: c.mode,
                message_count: Array.isArray(c.messages) ? c.messages.length : 0,
                messages: Array.isArray(c.messages) ? c.messages : [],
              })),
          }))
          .filter(u => u.chats.length > 0)
          .sort((a, b) => b.chats.length - a.chats.length);

        setUsers(usersWithChats);
      } catch (error) {
        toastError(error, 'Error', 'Failed to load users and chats');
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsersWithChats();
  }, [user, profile]);

  const handleChatRowClick = async (chat: ChatData) => {
    setLoadingChat(true);
    setChatModalOpen(true);

    try {
      // Fetch full chat data (messages may have been truncated in list fetch)
      const { data, error } = await supabase
        .from('chats')
        .select('id, title, messages, mode, created_at, updated_at, user_id')
        .eq('id', chat.id)
        .single();

      if (error) throw error;

      const owner = users.find(u => u.id === data.user_id);

      setSelectedChat({
        id: data.id,
        title: data.title,
        messages: Array.isArray(data.messages) ? data.messages : [],
        mode: data.mode,
        created_at: data.created_at,
        updated_at: data.updated_at,
        profiles: owner ? { name: owner.name, email: owner.email } : null,
      });
    } catch (err) {
      toastError(err, 'Error', 'Failed to load chat messages');
      setChatModalOpen(false);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleCloseModal = () => {
    setChatModalOpen(false);
    setSelectedChat(null);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!user || !profile || profile.role !== 'superadmin') return null;

  const selectedUserData = users.find(u => u.id === selectedUserId);

  return (
    <AdminLayout>
      <BackToAdminButton />
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/admin" className="hover:text-primary">Admin Dashboard</Link>
            <span>/</span>
            <span className="text-primary font-medium">User Chat Management</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-heading text-primary mb-2">User Chat Management</h1>
            <p className="text-muted-foreground">Browse users, view their chats, and inspect conversation details</p>
          </div>

          {/* User Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5 text-muted-foreground" />
                Select User
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedUserId || ''}
                onValueChange={(value) => setSelectedUserId(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loadingUsers ? 'Loading users…' : 'Select a user to view their chats'} />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{u.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {u.email} • {u.chats.length} chat{u.chats.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Full-width Chat List */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedUserData ? `${selectedUserData.name}'s Chats` : 'Select a User'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {selectedUserData
                  ? `${selectedUserData.chats.length} conversation${selectedUserData.chats.length !== 1 ? 's' : ''} — click any row to view`
                  : 'Choose a user from the dropdown above'}
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {!selectedUserId ? (
                <div className="p-12 text-center text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-40" />
                  <p>Select a user to view their chats</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {selectedUserData?.chats.map((chat) => (
                    <button
                      key={chat.id}
                      className="w-full text-left px-6 py-4 hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      onClick={() => handleChatRowClick(chat)}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{chat.title}</p>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {chat.message_count} message{chat.message_count !== 1 ? 's' : ''}
                              {chat.mode && (
                                <span className="ml-2 capitalize text-xs bg-muted px-1.5 py-0.5 rounded">
                                  {chat.mode}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true })}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      {/* UnifiedChatViewer Dialog */}
      <UnifiedChatViewer
        isOpen={chatModalOpen}
        onClose={handleCloseModal}
        chat={loadingChat ? null : selectedChat}
        userName={selectedUserData?.name}
        showMetadata={true}
      />
    </AdminLayout>
  );
};

export default AdminChatsPage;
