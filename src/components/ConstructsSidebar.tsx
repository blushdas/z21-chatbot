import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useConstructs, useDeleteConstruct } from '@/hooks/useConstructs';
import { useAuth } from '@/context/SupabaseAuthContext';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';

interface ConstructsSidebarProps {
  onSelectConstruct: (construct: any) => void;
  onNewConstruct: () => void;
}

const ConstructsSidebar: React.FC<ConstructsSidebarProps> = ({ 
  onSelectConstruct, 
  onNewConstruct 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { open: sidebarOpen } = useSidebar();
  
  const { 
    data: constructs = [], 
    isLoading, 
    error 
  } = useConstructs();
  
  const deleteConstructMutation = useDeleteConstruct();

  // Add pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const CONSTRUCTS_PER_PAGE = 50;

  // Check if there are more constructs to load
  useEffect(() => {
    if (constructs.length >= CONSTRUCTS_PER_PAGE && constructs.length % CONSTRUCTS_PER_PAGE === 0) {
      setHasMore(true);
    } else {
      setHasMore(false);
    }
  }, [constructs.length]);

  // Format constructs for the sidebar
  const formattedConstructs = useMemo(() => {
    if (!user) return [];
    
    return constructs.map(construct => ({
      id: construct.id,
      slug: construct.slug,
      title: construct.title,
      description: construct.description,
      state: construct.state,
      version: construct.latest_version,
      tags: construct.tags || [],
      createdAt: construct.created_at ? new Date(construct.created_at).getTime() : Date.now(),
      updatedAt: construct.updated_at ? new Date(construct.updated_at).getTime() : Date.now(),
    }));
  }, [constructs, user]);

  // Calculate displayedCurrentConstructSlug
  const displayedCurrentConstructSlug = useMemo(() => {
    if (!user) return null;
    return slug || null;
  }, [slug, user]);

  // Group constructs by state
  const constructsByState = useMemo(() => {
    const groups = {
      published: formattedConstructs.filter(c => c.state === 'published'),
      draft: formattedConstructs.filter(c => c.state === 'draft'),
      archived: formattedConstructs.filter(c => c.state === 'archived'),
    };
    
    // Sort each group by updatedAt (latest first)
    Object.keys(groups).forEach(key => {
      groups[key as keyof typeof groups].sort((a, b) => b.updatedAt - a.updatedAt);
    });
    
    return groups;
  }, [formattedConstructs]);

  // Filter constructs by search term
  const filteredConstructs = formattedConstructs.filter(construct =>
    construct.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    construct.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    construct.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleNewConstruct = async () => {
    if (!user) return;
    navigate('/constructs/new');
    onNewConstruct();
  };

  const handleSelectConstruct = (construct: any) => {
    if (!user) return;

    if (construct.slug === slug) {
      return;
    }
    
    navigate(`/constructs/${construct.slug}`);
    onSelectConstruct(construct);
  };

  const ConstructItem: React.FC<{ construct: any }> = ({ construct }) => {
    const isActive = construct.slug === displayedCurrentConstructSlug;
    
    return (
      <div
        className={`p-2 rounded-md cursor-pointer transition-all duration-200 hover:bg-brand-yellow/10 ${
          isActive ? 'bg-brand-yellow/20' : ''
        }`}
        onClick={() => handleSelectConstruct(construct)}
      >
        <div className="flex items-center justify-between">
          <h3 className={`font-medium text-sm truncate ${
            isActive ? 'text-brand-blue' : 'text-brand-offwhite'
          }`}>
            {sidebarOpen ? construct.title : construct.title.substring(0, 2)}
          </h3>
          {sidebarOpen && (
            <span className="text-xs ml-2 flex-shrink-0">
              {construct.state === 'published' ? '🌐' : construct.state === 'draft' ? '📝' : '📦'}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <Sidebar className="bg-brand-blue border-r border-brand-yellow" collapsible="icon">
      <SidebarHeader className="p-4 border-b border-brand-yellow">
        {sidebarOpen && (
          <>
            {/* Logo */}
            <div className="mb-4 flex justify-center">
            <img 
              src="/lovable-uploads/Daryle_Logo_White.svg"
              alt="Daryle AI"
                className="w-full max-w-[200px] h-auto cursor-pointer"
                onClick={() => navigate('/')}
              />
            </div>

            {/* Full width New button */}
            {user && (
              <Button
                onClick={handleNewConstruct}
                className="w-full bg-brand-yellow text-brand-blue hover:bg-brand-yellow/90 font-medium mb-3"
              >
                <Plus className="h-4 w-4 mr-2" />
                New
              </Button>
            )}
            
            {/* Search */}
            {user && (
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
          </>
        )}
        
        {!sidebarOpen && (
          <div className="flex flex-col items-center space-y-4">
            {/* Logo */}
            <div className="mb-3">
          <img 
            src="/lovable-uploads/Daryle_Logo_White.svg"
            alt="Daryle AI"
                className="w-12 h-auto cursor-pointer"
                onClick={() => navigate('/')}
              />
            </div>

            {user && (
              <Button
                onClick={handleNewConstruct}
                size="icon"
                className="bg-brand-yellow text-brand-blue hover:bg-brand-yellow/90"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="bg-brand-blue">
        {!user ? (
          <div className="p-4 text-center text-brand-offwhite/60 text-sm font-body">
            {sidebarOpen ? (
              <>
                <p className="mb-2">Sign in to manage constructs</p>
                <p className="text-xs">Create and organize your constructs</p>
              </>
            ) : (
              <div className="text-2xl">🔒</div>
            )}
          </div>
        ) : isLoading ? (
          <div className="p-4 text-center text-brand-offwhite/60 text-sm font-body">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-yellow mx-auto mb-2"></div>
            {sidebarOpen && "Loading constructs..."}
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-400 text-sm">
            {sidebarOpen ? "Error loading constructs" : "❌"}
          </div>
        ) : filteredConstructs.length === 0 ? (
          <div className="p-4 text-center text-brand-offwhite/60 text-sm font-body">
            {sidebarOpen ? (searchTerm ? 'No constructs match your search' : 'No constructs yet') : "📭"}
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="p-2 space-y-4">
              {/* Published Section */}
              {constructsByState.published.length > 0 && (
                <SidebarGroup>
                  {sidebarOpen && (
                    <SidebarGroupLabel className="flex items-center justify-between px-2 py-1 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🌐</span>
                        <span className="text-sm font-medium text-brand-offwhite">Published</span>
                      </div>
                      <Badge variant="outline" className="text-xs bg-brand-blue/20 border-brand-offwhite/20">
                        {constructsByState.published.length}
                      </Badge>
                    </SidebarGroupLabel>
                  )}
                  <SidebarGroupContent>
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
                  </SidebarGroupContent>
                </SidebarGroup>
              )}

              {/* Draft Section */}
              {constructsByState.draft.length > 0 && (
                <SidebarGroup>
                  {sidebarOpen && (
                    <SidebarGroupLabel className="flex items-center justify-between px-2 py-1 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">📝</span>
                        <span className="text-sm font-medium text-brand-offwhite">Drafts</span>
                      </div>
                      <Badge variant="outline" className="text-xs bg-brand-blue/20 border-brand-offwhite/20">
                        {constructsByState.draft.length}
                      </Badge>
                    </SidebarGroupLabel>
                  )}
                  <SidebarGroupContent>
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
                  </SidebarGroupContent>
                </SidebarGroup>
              )}

              {/* Archived Section */}
              {constructsByState.archived.length > 0 && (
                <SidebarGroup>
                  {sidebarOpen && (
                    <SidebarGroupLabel className="flex items-center justify-between px-2 py-1 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">📦</span>
                        <span className="text-sm font-medium text-brand-offwhite">Archived</span>
                      </div>
                      <Badge variant="outline" className="text-xs bg-brand-blue/20 border-brand-offwhite/20">
                        {constructsByState.archived.length}
                      </Badge>
                    </SidebarGroupLabel>
                  )}
                  <SidebarGroupContent>
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
                  </SidebarGroupContent>
                </SidebarGroup>
              )}
            </div>
          </ScrollArea>
        )}
      </SidebarContent>
    </Sidebar>
  );
};

export default ConstructsSidebar;