
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ChatWithProfile {
  id: string;
  title: string;
  updated_at: string;
  profiles: {
    name: string | null;
    email: string;
  } | null;
}

interface ChatsTableProps {
  chats: ChatWithProfile[];
  loading: boolean;
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

const ChatsTable: React.FC<ChatsTableProps> = ({
  chats,
  loading,
  selectedChatId,
  onSelectChat
}) => {
  const truncateTitle = (title: string, maxLength: number = 40) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  const formatLastUpdated = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'Unknown';
    }
  };

  const getOwnerDisplay = (profiles: ChatWithProfile['profiles']) => {
    if (!profiles) return 'Unknown User';
    return profiles.name || profiles.email;
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        Loading chats...
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>No chats found</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Last Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {chats.map((chat) => (
          <TableRow
            key={chat.id}
            className={`cursor-pointer hover:bg-muted/50 ${
              selectedChatId === chat.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
            }`}
            onClick={() => onSelectChat(chat.id)}
          >
            <TableCell className="font-medium">
              <div className="flex flex-col">
                <span className="text-sm">
                  {truncateTitle(chat.title)}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {chat.id.substring(0, 8)}...
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="text-sm">
                  {getOwnerDisplay(chat.profiles)}
                </span>
                {chat.profiles?.email && (
                  <span className="text-xs text-muted-foreground">
                    {chat.profiles.email}
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {formatLastUpdated(chat.updated_at)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ChatsTable;
