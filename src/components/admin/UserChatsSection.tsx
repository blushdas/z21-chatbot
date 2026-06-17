import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Eye, Search, Calendar } from 'lucide-react';
import { MessageType } from '@/components/ChatInterface';
import { Json } from '@/integrations/supabase/types';

interface ChatData {
  id: string;
  title: string;
  mode: string;
  messages: MessageType[];
  created_at: string;
  updated_at: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
}

const UserChatsSection: React.FC = () => {
  const [chats, setChats] = useState<ChatData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [selectedChat, setSelectedChat] = useState<ChatData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllChats();
  }, []);

  const parseMessages = (messages: Json): MessageType[] => {
    try {
      if (Array.isArray(messages)) {
        return messages as unknown as MessageType[];
      }
      if (typeof messages === 'string') {
        return JSON.parse(messages) as MessageType[];
      }
      return [];
    } catch (error) {
      console.error('Error parsing messages:', error);
      return [];
    }
  };

  const fetchAllChats = async () => {
    try {
      setLoading(true);
      
      // Get all chats with user profile information
      const { data: chatsData, error: chatsError } = await supabase
        .from('chats')
        .select(`
          id,
          title,
          mode,
          messages,
          created_at,
          updated_at,
          user_id
        `)
        .order('updated_at', { ascending: false });

      if (chatsError) throw chatsError;

      // Get user profiles to map user names (using public view for security)
      const userIds = [...new Set(chatsData?.map(chat => chat.user_id) || [])];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles_public')
        .select('id, name')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Get user emails from auth.users (requires service role in production)
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('Error fetching auth users:', authError);
      }

      // Combine chat data with user information
      const enrichedChats: ChatData[] = chatsData?.map(chat => {
        const profile = profiles?.find(p => p.id === chat.user_id);
        const authUser = authUsers?.users?.find((u: any) => u.id === chat.user_id);
        
        return {
          ...chat,
          messages: parseMessages(chat.messages),
          user_name: profile?.name || 'Unknown User',
          user_email: authUser?.email || 'N/A'
        };
      }) || [];

      setChats(enrichedChats);
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast({
        title: "Error",
        description: "Failed to load user chats",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredChats = chats.filter(chat => {
    const matchesSearch = 
      chat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMode = modeFilter === 'all' || chat.mode === modeFilter;
    
    return matchesSearch && matchesMode;
  });

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'coach': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300';
      case 'family': return 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300';
      case 'investor': return 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300';
      case 'ambassador': return 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300';
      case 'faith': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          User Chats Management
        </CardTitle>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by chat title, user name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={modeFilter} onValueChange={setModeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modes</SelectItem>
              <SelectItem value="coach">Coach</SelectItem>
              <SelectItem value="family">Family</SelectItem>
              <SelectItem value="investor">Investor</SelectItem>
              <SelectItem value="ambassador">Ambassador</SelectItem>
              <SelectItem value="faith">Faith</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Showing {filteredChats.length} of {chats.length} chats
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chat Title</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChats.map((chat) => (
                  <TableRow key={chat.id}>
                    <TableCell className="font-medium max-w-xs truncate">
                      {chat.title}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{chat.user_name}</div>
                        <div className="text-sm text-muted-foreground">{chat.user_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getModeColor(chat.mode)}>
                        {chat.mode}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {Array.isArray(chat.messages) ? chat.messages.length : 0}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(chat.updated_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedChat(chat)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <MessageSquare className="h-5 w-5" />
                              Chat: {selectedChat?.title}
                            </DialogTitle>
                            <div className="text-sm text-muted-foreground">
                              User: {selectedChat?.user_name} ({selectedChat?.user_email}) • 
                              Mode: {selectedChat?.mode} • 
                              Updated: {selectedChat && formatDate(selectedChat.updated_at)}
                            </div>
                          </DialogHeader>
                          <ScrollArea className="max-h-[60vh] w-full">
                            <div className="space-y-4 p-4">
                              {selectedChat?.messages && Array.isArray(selectedChat.messages) ? (
                                selectedChat.messages.map((message, index) => (
                                  <div
                                    key={index}
                                    className={`p-3 rounded-lg ${
                                      message.sender === 'user'
                                        ? 'bg-blue-50 border-l-4 border-blue-400'
                                        : 'bg-muted border-l-4 border-border'
                                    }`}
                                  >
                                    <div className="text-xs font-medium text-muted-foreground mb-1">
                                      {message.sender === 'user' ? 'User' : 'Daryle'}
                                      {message.timestamp && (
                                        <span className="ml-2">
                                          {new Date(message.timestamp).toLocaleString()}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-sm whitespace-pre-wrap">
                                      {message.content}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-center text-muted-foreground py-8">
                                  No messages found in this chat
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredChats.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || modeFilter !== 'all' 
                  ? 'No chats match your search criteria' 
                  : 'No chats found'
                }
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserChatsSection;
