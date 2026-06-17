
import React, { useState } from 'react';
import { JournalEntry, useJournal } from '@/context/JournalContext';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Edit, MessageSquare, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
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

interface JournalEntryCardProps {
  entry: JournalEntry;
}

const JournalEntryCard: React.FC<JournalEntryCardProps> = ({ entry }) => {
  const { updateEntry, deleteEntry } = useJournal();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showFullResponse, setShowFullResponse] = useState(false);
  const [userNote, setUserNote] = useState(entry.userNote);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleSaveNote = () => {
    updateEntry(entry.id, { userNote });
    setIsEditing(false);
    toast({
      title: "Note Updated",
      description: "Your journal entry has been updated.",
      duration: 2000,
    });
  };

  const handleDelete = () => {
    deleteEntry(entry.id);
    toast({
      title: "Entry Deleted",
      description: "Your journal entry has been removed.",
      duration: 2000,
    });
    setIsDeleteDialogOpen(false);
  };

  const formattedDate = formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true });

  return (
    <div className="bg-white rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="p-4 sm:p-6">
        <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Calendar className="h-4 w-4" />
              <span>{formattedDate}</span>
              <span className="bg-brand-green/10 text-brand-green dark:bg-brand-green/20 dark:text-brand-green/90 text-xs font-medium px-2 py-0.5 rounded">
                {entry.mode} Mode
              </span>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-1">
              {entry.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsEditing(!isEditing)}
              aria-label={isEditing ? "Cancel editing" : "Edit note"}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsDeleteDialogOpen(true)}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              aria-label="Delete entry"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="border-l-4 border-brand-green pl-3 py-1 italic text-sm text-gray-600">
            "{entry.originalPrompt}"
          </div>
          
          <div className="bg-gray-50 rounded p-3">
            <div className="font-serif text-gray-800 text-sm leading-relaxed">
              {showFullResponse ? entry.botResponse : `${entry.botResponse.substring(0, 150)}${entry.botResponse.length > 150 ? '...' : ''}`}
            </div>
            {entry.botResponse.length > 150 && (
              <Button 
                variant="link" 
                size="sm" 
                onClick={() => setShowFullResponse(!showFullResponse)}
                className="mt-1 p-0 h-auto text-xs"
              >
                {showFullResponse ? "Show less" : "Show full response"}
              </Button>
            )}
          </div>
          
          <div className="mt-2">
            <div className="text-sm font-medium text-gray-700 mb-1">
              Your reflection:
            </div>
            
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={userNote}
                  onChange={(e) => setUserNote(e.target.value)}
                  placeholder="What did you learn from this? How will you apply this insight?"
                  className="h-24 resize-none focus:border-brand-green focus:ring-brand-green"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    setUserNote(entry.userNote);
                    setIsEditing(false);
                  }}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveNote}>
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-100 dark:border-gray-700 rounded p-3 text-sm">
                {entry.userNote || "No reflection added yet."}
              </div>
            )}
          </div>
          
          <Button variant="outline" size="sm" className="mt-2">
            <MessageSquare className="h-4 w-4 mr-1" /> Ask follow-up
          </Button>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Journal Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this reflection? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 text-white hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default JournalEntryCard;
