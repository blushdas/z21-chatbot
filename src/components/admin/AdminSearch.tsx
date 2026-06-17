import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MessageSquare, BarChart3, FileText, Search } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/SupabaseAuthContext';

interface AdminSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResult {
  users: Array<{ id: string; name: string; email: string }>;
  chats: Array<{ id: string; title: string; user_id: string }>;
  feedback: Array<{ id: string; message_id: string; rating: string | null }>;
}

const AdminSearch: React.FC<AdminSearchProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult>({ users: [], chats: [], feedback: [] });
  const [isSearching, setIsSearching] = useState(false);

  const isSuperAdmin = profile?.role === 'superadmin';

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  // Search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults({ users: [], chats: [], feedback: [] });
      return;
    }

    setIsSearching(true);

    try {
      const searchTerm = `%${searchQuery}%`;

      // Parallel queries
      const [usersRes, chatsRes, feedbackRes] = await Promise.all([
        isSuperAdmin
          ? supabase
              .from('profiles')
              .select('id, name, email')
              .or(`name.ilike.${searchTerm},email.ilike.${searchTerm}`)
              .limit(5)
          : Promise.resolve({ data: [], error: null }),
        isSuperAdmin
          ? supabase
              .from('chats')
              .select('id, title, user_id')
              .ilike('title', searchTerm)
              .limit(5)
          : Promise.resolve({ data: [], error: null }),
        isSuperAdmin
          ? supabase
              .from('feedback_logs')
              .select('id, message_id, rating')
              .limit(5)
          : Promise.resolve({ data: [], error: null }),
      ]);

      setResults({
        users: usersRes.data || [],
        chats: chatsRes.data || [],
        feedback: feedbackRes.data || [],
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [isSuperAdmin]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const handleSelect = (type: string, id: string) => {
    onOpenChange(false);
    setQuery('');
    
    switch (type) {
      case 'user':
        navigate(`/admin/users?user=${id}`);
        break;
      case 'chat':
        navigate(`/admin/chats?chat=${id}`);
        break;
      case 'feedback':
        navigate(`/admin/feedback?id=${id}`);
        break;
    }
  };

  const hasResults = results.users.length > 0 || results.chats.length > 0 || results.feedback.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Search users, chats, feedback..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {!query && (
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 py-6">
              <Search className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Start typing to search...
              </p>
            </div>
          </CommandEmpty>
        )}

        {query && !hasResults && !isSearching && (
          <CommandEmpty>No results found for "{query}"</CommandEmpty>
        )}

        {isSearching && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Searching...
          </div>
        )}

        {results.users.length > 0 && (
          <CommandGroup heading="Users">
            {results.users.map((user) => (
              <CommandItem
                key={user.id}
                onSelect={() => handleSelect('user', user.id)}
                className="cursor-pointer"
              >
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.chats.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Chats">
              {results.chats.map((chat) => (
                <CommandItem
                  key={chat.id}
                  onSelect={() => handleSelect('chat', chat.id)}
                  className="cursor-pointer"
                >
                  <BarChart3 className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{chat.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {results.feedback.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Feedback">
              {results.feedback.map((fb) => (
                <CommandItem
                  key={fb.id}
                  onSelect={() => handleSelect('feedback', fb.id)}
                  className="cursor-pointer"
                >
                  <MessageSquare className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    <span className="truncate">Feedback #{fb.message_id.slice(0, 8)}</span>
                    {fb.rating && (
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        fb.rating === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {fb.rating === 'up' ? '👍' : '👎'}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Quick navigation */}
        <CommandSeparator />
        <CommandGroup heading="Quick Navigation">
          <CommandItem onSelect={() => { onOpenChange(false); navigate('/admin/users'); }} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>All Users</span>
          </CommandItem>
          <CommandItem onSelect={() => { onOpenChange(false); navigate('/admin/feedback'); }} className="cursor-pointer">
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>All Feedback</span>
          </CommandItem>
          <CommandItem onSelect={() => { onOpenChange(false); navigate('/admin/chats'); }} className="cursor-pointer">
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>All Chats</span>
          </CommandItem>
          <CommandItem onSelect={() => { onOpenChange(false); navigate('/admin/knowledge'); }} className="cursor-pointer">
            <FileText className="mr-2 h-4 w-4" />
            <span>Knowledge Base</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default AdminSearch;
