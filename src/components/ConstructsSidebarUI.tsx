import React, { useState, useEffect } from 'react';
import { Plus, Search, FileText, Eye, Edit, Trash2, Copy } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

interface Construct {
  id: string;
  slug: string;
  title: string;
  description?: string;
  state: 'draft' | 'published' | 'archived';
  version: number;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

interface ConstructsByState {
  published: Construct[];
  draft: Construct[];
  archived: Construct[];
}

interface ConstructsSidebarUIProps {
  constructs: Construct[];
  constructsByState: ConstructsByState;
  currentConstructSlug: string | null;
  onNewConstruct: () => void;
  onSelectConstruct: (construct: Construct) => void;
  onEditConstruct: (construct: Construct) => void;
  onDeleteConstruct: (constructId: string) => void;
  onDuplicateConstruct: (construct: Construct) => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  isAuthenticated: boolean;
  isLoading?: boolean;
  error?: any;
}

const ConstructsSidebarUI: React.FC<ConstructsSidebarUIProps> = ({
  constructs,
  constructsByState,
  currentConstructSlug,
  onNewConstruct,
  onSelectConstruct,
  onEditConstruct,
  onDeleteConstruct,
  onDuplicateConstruct,
  hasMore = false,
  isLoadingMore = false,
  isAuthenticated,
  isLoading = false,
  error
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const getStateColor = (state: string) => {
    switch (state) {
      case 'published': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'published': return '🌐';
      case 'draft': return '📝';
      case 'archived': return '📦';
      default: return '❓';
    }
  };

  const filteredConstructs = constructs.filter(construct =>
    construct.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    construct.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    construct.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const ConstructItem: React.FC<{ construct: Construct }> = ({ construct }) => {
    const isActive = construct.slug === currentConstructSlug;
    
    return (
      <div
        className={`p-2 rounded-md cursor-pointer transition-all duration-200 hover:bg-brand-yellow/10 ${
          isActive ? 'bg-brand-yellow/20' : ''
        }`}
        onClick={() => onSelectConstruct(construct)}
      >
        <div className="flex items-center justify-between">
          <h3 className={`font-medium text-sm truncate ${
            isActive ? 'text-brand-blue' : 'text-brand-offwhite'
          }`}>
            {construct.title}
          </h3>
          <span className="text-xs ml-2 flex-shrink-0">
            {getStateIcon(construct.state)}
          </span>
        </div>
      </div>
    );
  };

  const SectionHeader: React.FC<{ title: string; icon: string; count: number }> = ({ title, icon, count }) => (
    <div className="flex items-center justify-between px-2 py-1 mb-2">
      <div className="flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        <span className="text-sm font-medium text-brand-offwhite">{title}</span>
      </div>
      <Badge variant="outline" className="text-xs bg-brand-blue/20 border-brand-offwhite/20">
        {count}
      </Badge>
    </div>
  );

  return (
    <div className="w-[260px] h-full bg-brand-blue text-brand-offwhite shadow-lg flex flex-col border-r border-brand-yellow relative z-50">
      {/* Header */}
      <div className="p-4 border-b border-brand-yellow/30">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-brand-offwhite">Constructs</h2>
          {isAuthenticated && (
            <Button
              onClick={onNewConstruct}
              size="sm"
              className="bg-brand-yellow text-brand-blue hover:bg-brand-yellow/90 font-medium"
            >
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          )}
        </div>
        
        {/* Search */}
        {isAuthenticated && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-offwhite/60" />
            <input
              type="text"
              placeholder="Search constructs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-brand-blue/50 border border-brand-yellow/30 rounded-md text-brand-offwhite placeholder-brand-offwhite/60 focus:outline-none focus:ring-2 focus:ring-brand-yellow/50 focus:border-brand-yellow/50"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {!isAuthenticated ? (
          <div className="p-4 text-center text-brand-offwhite/60 text-sm font-body">
            <p className="mb-2">Sign in to manage constructs</p>
            <p className="text-xs">Create and organize your constructs</p>
          </div>
        ) : isLoading ? (
          <div className="p-4 text-center text-brand-offwhite/60 text-sm font-body">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-yellow mx-auto mb-2"></div>
            Loading constructs...
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-400 text-sm">
            Error loading constructs
          </div>
        ) : filteredConstructs.length === 0 ? (
          <div className="p-4 text-center text-brand-offwhite/60 text-sm font-body">
            {searchTerm ? 'No constructs match your search' : 'No constructs yet'}
          </div>
        ) : (
          <ScrollArea className="h-full scrollbar-force-visible" type="always">
            <div className="p-2 space-y-4">
              {/* Published Section */}
              {constructsByState.published.length > 0 && (
                <div>
                  <SectionHeader title="Published" icon={getStateIcon('published')} count={constructsByState.published.length} />
                  <div className="space-y-1">
                    {constructsByState.published
                      .filter(construct => !searchTerm || 
                        construct.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        construct.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        construct.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
                      )
                      .map(construct => (
                        <ConstructItem key={construct.id} construct={construct} />
                      ))}
                  </div>
                </div>
              )}

              {/* Draft Section */}
              {constructsByState.draft.length > 0 && (
                <div>
                  <SectionHeader title="Drafts" icon={getStateIcon('draft')} count={constructsByState.draft.length} />
                  <div className="space-y-1">
                    {constructsByState.draft
                      .filter(construct => !searchTerm || 
                        construct.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        construct.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        construct.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
                      )
                      .map(construct => (
                        <ConstructItem key={construct.id} construct={construct} />
                      ))}
                  </div>
                </div>
              )}

              {/* Archived Section */}
              {constructsByState.archived.length > 0 && (
                <div>
                  <SectionHeader title="Archived" icon={getStateIcon('archived')} count={constructsByState.archived.length} />
                  <div className="space-y-1">
                    {constructsByState.archived
                      .filter(construct => !searchTerm || 
                        construct.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        construct.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        construct.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
                      )
                      .map(construct => (
                        <ConstructItem key={construct.id} construct={construct} />
                      ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default ConstructsSidebarUI;