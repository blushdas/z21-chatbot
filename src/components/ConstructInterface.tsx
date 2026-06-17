import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Edit, Eye, Archive, Trash2, History, Settings, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useConstruct, useConstructVersions } from '@/hooks/useConstructs';
import { useAuth } from '@/context/SupabaseAuthContext';

import TagPill from './TagPill';
import { formatDistanceToNow } from 'date-fns';

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

interface ConstructInterfaceProps {
  selectedConstructSlug: string | null;
  onStartNewConstruct: (constructId?: string) => void;
}

const ConstructInterface: React.FC<ConstructInterfaceProps> = ({
  selectedConstructSlug,
  onStartNewConstruct
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { 
    data: construct, 
    isLoading: constructLoading, 
    error: constructError 
  } = useConstruct(selectedConstructSlug || '');

  const { 
    data: versions = [], 
    isLoading: versionsLoading 
  } = useConstructVersions(construct?.id || '');

  const getStateColor = (state: string) => {
    switch (state) {
      case 'published': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-muted dark:text-muted-foreground dark:border-border';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-muted dark:text-muted-foreground dark:border-border';
    }
  };

  const handleEdit = () => {
    if (construct) {
      navigate(`/constructs/${construct.slug}/edit`);
    }
  };

  const handleNewConstruct = () => {
    navigate('/constructs/new');
    onStartNewConstruct();
  };

  const handleBackToConstructs = () => {
    navigate('/constructs');
  };

  // Show loading state
  if (selectedConstructSlug && constructLoading) {
    return (
      <div className="flex flex-col h-full min-h-0 bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue mx-auto mb-4"></div>
            <div className="text-brand-blue dark:text-white">Loading construct...</div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (selectedConstructSlug && constructError) {
    return (
      <div className="flex flex-col h-full min-h-0 bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-destructive">
            <p className="mb-4">Error loading construct</p>
            <Button onClick={() => navigate('/constructs')} variant="outline">
              Back to Constructs
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state when no construct is selected
  if (!selectedConstructSlug || !construct) {
    return (
      <div className="flex flex-col h-full min-h-0 bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 bg-brand-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Settings className="w-12 h-12 text-brand-blue" />
            </div>
            <h2 className="text-2xl font-semibold text-brand-blue dark:text-white mb-3">
              No Construct Selected
            </h2>
            <p className="text-muted-foreground mb-6">
              Select a construct from the sidebar to view and edit it, or create a new one to get started.
            </p>
            <div className="space-y-3">
              <Button onClick={handleNewConstruct} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Create New Construct
              </Button>
              <p className="text-sm text-muted-foreground">
                Constructs help you organize and manage AI workflows and configurations.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-6 mb-4">
            {/* Image Section */}
            <div className="w-full lg:w-80 flex-shrink-0">
              <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg overflow-hidden">
                <img
                  src={getConstructImage(construct.slug)}
                  alt={construct.title}
                  className="w-full h-full object-contain"
                />
              </AspectRatio>
            </div>
            
            {/* Content Section */}
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold text-brand-blue dark:text-white">
                  {construct.title}
                </h1>
                <Badge className={`${getStateColor(construct.state)}`}>
                  {construct.state}
                </Badge>
                <Badge variant="outline">
                  v{construct.latest_version}
                </Badge>
              </div>
              
              {construct.description && (
                <p className="text-muted-foreground max-w-none">
                  {construct.description}
                </p>
              )}
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span>
                  Created {formatDistanceToNow(new Date(construct.created_at), { addSuffix: true })}
                </span>
                <span>•</span>
                <span>
                  Updated {formatDistanceToNow(new Date(construct.updated_at), { addSuffix: true })}
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={handleBackToConstructs} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Back to All Constructs</span>
                  <span className="sm:hidden">Back</span>
                </Button>
                <Button onClick={handleEdit} variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button onClick={handleNewConstruct}>
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">New Construct</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="border-b border-border bg-card">
            <TabsList className="ml-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="versions">Versions</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-auto">
            <TabsContent value="overview" className="p-6 space-y-6">
              {/* Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Slug</label>
                    <p className="text-sm text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                      {construct.slug}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground">OE Keys</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {construct.oe_keys?.length > 0 ? (
                        construct.oe_keys.map((key, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {key}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">No OE keys defined</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground">Tags</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {construct.tags?.length > 0 ? (
                        construct.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">No tags assigned</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Current Version Notes */}
              {versions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Current Version Notes</CardTitle>
                    <CardDescription>
                      Version {construct.latest_version} notes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {versions[0]?.notes_md ? (
                      <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap text-sm text-foreground bg-muted p-3 rounded">
                          {versions[0].notes_md}
                        </pre>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No notes for this version</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="versions" className="p-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Version History</CardTitle>
                  <CardDescription>
                    All versions of this construct
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {versionsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-blue mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Loading versions...</p>
                    </div>
                  ) : versions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No versions found
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {versions.map((version) => (
                        <div key={version.id} className="flex items-start justify-between p-3 border border-border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">Version {version.version}</span>
                              {version.version === construct.latest_version && (
                                <Badge variant="default" className="text-xs">Current</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Created {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                            </p>
                            {version.notes_md && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                {version.notes_md}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="p-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Construct Preview</CardTitle>
                  <CardDescription>
                    Preview how this construct will appear
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Eye className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    Preview functionality coming soon
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="p-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Audit History</CardTitle>
                  <CardDescription>
                    Track all changes made to this construct
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <History className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    Audit history functionality coming soon
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default ConstructInterface;