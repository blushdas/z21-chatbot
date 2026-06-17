import React, { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
import { useChatManagementContext } from '@/context/ChatManagementContext';
import { useToast } from '@/hooks/use-toast';

const BulkDeleteChatsSection: React.FC = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [deletedCount, setDeletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const { bulkDeleteAllChats, savedChats } = useChatManagementContext();
  const { toast } = useToast();

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    setDeleteProgress(0);
    setDeletedCount(0);
    setTotalCount(savedChats.length);
    
    try {
      const deleted = await bulkDeleteAllChats((deleted, total) => {
        setDeletedCount(deleted);
        setTotalCount(total);
        setDeleteProgress((deleted / total) * 100);
      });
      
      toast({
        title: "All chats deleted",
        description: `Successfully deleted ${deleted || savedChats.length} chats from your account.`,
      });
    } catch (error) {
      console.error('Failed to delete chats:', error);
      toast({
        title: "Error",
        description: "Failed to delete chats. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteProgress(0);
      setDeletedCount(0);
      setTotalCount(0);
    }
  };

  return (
    <div className="rounded-2xl bg-[var(--chat-card)] border border-[var(--chat-border)] p-6">
      {/* Danger card */}
      <div className="rounded-xl border border-[var(--color-error-border)] bg-[var(--color-error-soft)] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Trash2 size={16} className="text-[color:var(--color-error)]" />
          <h3 className="font-semibold text-[color:var(--color-error)] text-base">Bulk Delete Chats</h3>
        </div>
        <p className="text-sm text-[var(--chat-muted)]">
          Permanently delete all chat conversations from your account. This action cannot be undone.
        </p>

        {/* Warning block */}
        <div className="rounded-lg bg-[var(--color-warning-soft)] border border-[var(--color-warning-border)] p-3 flex items-start gap-2">
          <AlertTriangle size={15} className="text-[color:var(--color-warning)] flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[color:var(--color-warning)]">
            <span className="font-semibold">Warning: </span>
            This will permanently delete all {savedChats.length} conversations from your account. This action cannot be undone.
          </div>
        </div>

        {/* Progress */}
        {isDeleting && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-[var(--chat-muted)]">
              <span>Deleting chats...</span>
              <span>{deletedCount} / {totalCount}</span>
            </div>
            <Progress value={deleteProgress} className="h-1.5" />
          </div>
        )}

        {/* Delete button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              disabled={savedChats.length === 0 || isDeleting}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              <Trash2 size={14} className="mr-2" />
              {isDeleting ? 'Deleting all chats...' : `Delete All ${savedChats.length} Chats`}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-[var(--chat-card)] border-[var(--chat-border)] text-[var(--chat-text)]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-[var(--chat-text)]">Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-[var(--chat-muted)]">
                This action cannot be undone. This will permanently delete all {savedChats.length} chat conversations.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-[var(--chat-border)] text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)]">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700 text-white">
                Yes, delete all chats
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default BulkDeleteChatsSection;