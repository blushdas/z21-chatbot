import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useConstructs } from '@/hooks/useConstructs';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useMediaQuery } from '@/hooks/use-media-query';
import ConstructsFilterBar from './ConstructsFilterBar';
import ConstructPreviewModal from './ConstructPreviewModal';
import MobileConstructsCarousel from './MobileConstructsCarousel';

// Map construct slugs to their image paths
const getConstructImage = (slug: string): string => {
  const imageMap: Record<string, string> = {
    'time-management-matrix': '/constructs/time-management-matrix.jpg',
    'competency-continuum': '/constructs/competency-continuum.jpg', 
    'ae-pyramid': '/constructs/ae-pyramid.jpg',
    'johari-window': '/constructs/johari-window.jpg',
    'appeal': '/constructs/appeal.jpg',
    'trust-levels': '/constructs/trust-levels.jpg',
  };
  
  return imageMap[slug] || '/placeholder.svg';
};


const ConstructsGridOverview: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Detect if user arrived from the admin dashboard
  const cameFromAdmin = useMemo(() => {
    try {
      const prev = sessionStorage.getItem('previousPath') || '';
      if (prev.startsWith('/admin')) return true;
      // Fallback to referrer for full page reloads
      if (typeof document !== 'undefined' && document.referrer) {
        const url = new URL(document.referrer, window.location.origin);
        if (url.origin === window.location.origin && url.pathname.startsWith('/admin')) {
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }, []);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('updated-desc');
  
  // Modal state
  const [selectedConstruct, setSelectedConstruct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  
  const { data: allConstructs = [], isLoading, error } = useConstructs(searchQuery, stateFilter);

  // Get available tags for filter dropdown
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    allConstructs.forEach(construct => {
      construct.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [allConstructs]);

  // Filter and sort constructs
  const constructs = useMemo(() => {
    let filtered = [...allConstructs];

    // Filter by tags
    if (tagFilters.length > 0) {
      filtered = filtered.filter(construct =>
        tagFilters.some(tag => construct.tags?.includes(tag))
      );
    }

    // Sort constructs
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'updated-asc':
          return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        case 'created-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'created-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'updated-desc':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

    return filtered;
  }, [allConstructs, tagFilters, sortBy]);

  const handleConstructClick = (construct: any) => {
    if (isMobile) {
      // On mobile, navigate directly
      navigate(`/constructs/${construct.slug}`);
    } else {
      // On desktop, show modal
      setSelectedConstruct(construct);
      setIsModalOpen(true);
    }
  };

  const handleNewConstruct = () => {
    navigate('/constructs/new');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedConstruct(null);
  };

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-brand-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Eye className="w-12 h-12 text-brand-blue" />
          </div>
          <h2 className="text-2xl font-semibold text-brand-blue dark:text-white mb-3">
            Explore Constructs
          </h2>
          <p className="text-muted-foreground mb-6">
            Browse our collection of organizational and coaching constructs to enhance your understanding of AI frameworks.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue mx-auto mb-4"></div>
          <div className="text-brand-blue dark:text-white">Loading constructs...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center text-destructive">
          <p className="mb-4">Error loading constructs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 sm:gap-4 mb-2">
                {cameFromAdmin ? (
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/admin')}
                    className="text-brand-blue dark:text-white hover:text-brand-blue/80 dark:hover:text-white/80 p-2 sm:px-3"
                    size="sm"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Back to Admin Dashboard</span>
                    <span className="sm:hidden">Admin</span>
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/')}
                    className="text-brand-blue dark:text-white hover:text-brand-blue/80 dark:hover:text-white/80 p-2 sm:px-3"
                    size="sm"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Back to Chat</span>
                    <span className="sm:hidden">Back</span>
                  </Button>
                )}
                <h1 className="text-xl sm:text-3xl font-bold text-brand-blue dark:text-white">
                  Constructs
                </h1>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground px-2 sm:px-0">
                Explore and manage organizational frameworks and coaching constructs
              </p>
            </div>
            <Button 
              onClick={handleNewConstruct} 
              className="bg-brand-blue hover:bg-brand-blue/90 text-white dark:bg-primary dark:hover:bg-primary/90 dark:text-primary-foreground w-full sm:w-auto"
              size={isMobile ? "default" : "default"}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Construct
            </Button>
          </div>
          
          {/* Filters */}
          <div className="px-0">
            <ConstructsFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              stateFilter={stateFilter}
              onStateFilterChange={setStateFilter}
              tagFilters={tagFilters}
              onTagFiltersChange={setTagFilters}
              availableTags={availableTags}
              sortBy={sortBy}
              onSortChange={setSortBy}
              totalCount={allConstructs.length}
              filteredCount={constructs.length}
            />
          </div>
        </div>
      </div>

      {/* Scrollable Grid Container */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 pb-safe-area-inset-bottom">
        {constructs.length === 0 ? (
          <div className="text-center py-8 sm:py-16 px-4">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-brand-blue/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Plus className="w-8 h-8 sm:w-12 sm:h-12 text-brand-blue" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-brand-blue dark:text-white mb-2 sm:mb-3">
              No Constructs Yet
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
              Get started by creating your first construct
            </p>
            <Button onClick={handleNewConstruct} className="bg-brand-blue hover:bg-brand-blue/90 text-white dark:bg-primary dark:hover:bg-primary/90 dark:text-primary-foreground w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Create First Construct
            </Button>
          </div>
        ) : isMobile ? (
          <MobileConstructsCarousel
            constructs={constructs}
            getConstructImage={getConstructImage}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {constructs.map((construct) => (
              <Card
                key={construct.id}
                className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] bg-card border-border"
                onClick={() => handleConstructClick(construct)}
              >
                <CardContent className="p-0">
                  <AspectRatio ratio={16 / 10}>
                    <img
                      src={getConstructImage(construct.slug)}
                      alt={construct.title}
                      className="w-full h-full object-contain rounded-t-lg bg-muted"
                    />
                  </AspectRatio>
                  <div className="p-3">
                    <h3 className="font-semibold text-base sm:text-lg text-brand-blue dark:text-white group-hover:text-brand-blue/80 dark:group-hover:text-white/80 transition-colors line-clamp-2 text-center">
                      {construct.title}
                    </h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* Preview Modal */}
      <ConstructPreviewModal
        construct={selectedConstruct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        getConstructImage={getConstructImage}
      />
    </div>
  );
};

export default ConstructsGridOverview;