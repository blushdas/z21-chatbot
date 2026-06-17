
import React, { useState } from 'react';
import { useJournal } from '@/context/JournalContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Search, Book, CalendarIcon } from 'lucide-react';
import JournalEntryCard from '@/components/journal/JournalEntryCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChatMode } from '@/components/ChatInterface';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

const JournalSection: React.FC = () => {
  const { journalEntries, filterEntriesByMode } = useJournal();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterMode, setFilterMode] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  
  // Filter journal entries
  const filteredEntries = journalEntries
    .filter(entry => {
      // Text search
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          entry.userNote.toLowerCase().includes(searchLower) ||
          entry.botResponse.toLowerCase().includes(searchLower) ||
          entry.originalPrompt.toLowerCase().includes(searchLower) ||
          entry.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
      return true;
    })
    .filter(entry => {
      // Mode filter
      if (filterMode && filterMode !== 'all') {
        return entry.mode === filterMode;
      }
      return true;
    })
    .filter(entry => {
      // Date filter
      if (filterDate) {
        const entryDate = new Date(entry.timestamp);
        return (
          entryDate.getDate() === filterDate.getDate() &&
          entryDate.getMonth() === filterDate.getMonth() &&
          entryDate.getFullYear() === filterDate.getFullYear()
        );
      }
      return true;
    });
  
  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-brand-green flex items-center gap-2">
          <Book className="h-5 w-5" /> Memory Journal
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex-1 flex flex-col">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search journal entries..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={filterMode} onValueChange={setFilterMode}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Filter by mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="Coaching">Coaching</SelectItem>
                <SelectItem value="Family">Family</SelectItem>
                <SelectItem value="Investor">Investor</SelectItem>
                <SelectItem value="Ambassador">Ambassador</SelectItem>
              </SelectContent>
            </Select>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-10 p-0 ${filterDate ? 'border-brand-green text-brand-green' : ''}`}
                  title="Filter by date"
                >
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={filterDate}
                  onSelect={setFilterDate}
                  initialFocus
                />
                {filterDate && (
                  <div className="border-t p-2 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFilterDate(undefined)}
                      className="text-sm"
                    >
                      Clear date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[330px] pr-4">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {searchTerm || filterMode !== 'all' || filterDate ? (
                  <p>No journal entries match your filters</p>
                ) : (
                  <>
                    <p>No journal entries yet</p>
                    <p className="text-sm mt-2">Save insights from your conversations to build your journal</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEntries.map((entry) => (
                  <JournalEntryCard key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};

export default JournalSection;
