import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AdminNav from '@/components/admin/AdminNav';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

interface Construct {
  id: string;
  slug: string;
  title: string;
  description?: string;
  oe_keys: string[];
  tags: string[];
  state: 'draft' | 'published' | 'archived';
  latest_version: number;
  created_at: string;
  updated_at: string;
}

const EditConstructPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    oeKeys: [] as string[],
    tags: [] as string[],
  });
  
  const [newOeKey, setNewOeKey] = useState('');
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: construct, isLoading, error } = useQuery({
    queryKey: ['construct', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('constructs')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      return data as Construct;
    },
    enabled: !!slug && !!user,
  });

  useEffect(() => {
    if (construct) {
      setFormData({
        title: construct.title,
        description: construct.description || '',
        oeKeys: construct.oe_keys,
        tags: construct.tags,
      });
    }
  }, [construct]);

  const commonOeKeys = [
    'Ownership', 'Governance', 'Purpose', 'Structure', 
    'Process', 'People', 'Performance', 'Culture'
  ];

  const addOeKey = (key: string) => {
    if (key && !formData.oeKeys.includes(key)) {
      setFormData(prev => ({
        ...prev,
        oeKeys: [...prev.oeKeys, key]
      }));
      setNewOeKey('');
    }
  };

  const removeOeKey = (key: string) => {
    setFormData(prev => ({
      ...prev,
      oeKeys: prev.oeKeys.filter(k => k !== key)
    }));
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !construct) {
      toast({
        title: "Authentication required",
        description: "Please log in to edit constructs.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for the construct.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('constructs')
        .update({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          oe_keys: formData.oeKeys,
          tags: formData.tags,
        })
        .eq('id', construct.id);

      if (error) throw error;

      // Log the update
      await supabase
        .from('construct_audit_logs')
        .insert({
          user_id: user.id,
          action: 'CONSTRUCT_UPDATE',
          construct_id: construct.id,
          meta: {
            title: formData.title,
            oe_keys: formData.oeKeys,
            tags: formData.tags,
          },
        });

      toast({
        title: "Construct updated",
        description: "Your construct has been updated successfully.",
      });

      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['construct', slug] });
      queryClient.invalidateQueries({ queryKey: ['constructs'] });

      navigate(`/constructs/${slug}`);
    } catch (error) {
      console.error('Error updating construct:', error);
      toast({
        title: "Error updating construct",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <AdminNav />
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error || !construct) {
    return (
      <div className="min-h-screen bg-muted/30">
        <AdminNav />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">
              {error ? 'Error loading construct for editing.' : 'Construct not found.'}
            </p>
            <Button variant="outline" onClick={() => navigate('/constructs')}>
              <ArrowLeft className="mr-2" size={16} />
              Back to Constructs
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminNav />
      
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(`/constructs/${slug}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Back to Construct
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold text-[var(--chat-text)]">Edit Construct</h1>
            <p className="text-[var(--chat-text-secondary)] mt-1">
              Update the construct details and metadata
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter construct title..."
                  className="mt-1"
                />
                <p className="text-xs text-[var(--chat-muted)] mt-1">
                  Slug: {construct.slug} (unchangeable)
                </p>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the construct..."
                  rows={3}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Organizational Essentials */}
          <Card>
            <CardHeader>
              <CardTitle>Organizational Essentials (OE Keys)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Common OE Keys</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {commonOeKeys.map((key) => (
                    <Button
                      key={key}
                      type="button"
                      variant={formData.oeKeys.includes(key) ? "default" : "outline"}
                      size="sm"
                      onClick={() => formData.oeKeys.includes(key) ? removeOeKey(key) : addOeKey(key)}
                    >
                      {key}
                      {formData.oeKeys.includes(key) && <X className="ml-1" size={14} />}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  value={newOeKey}
                  onChange={(e) => setNewOeKey(e.target.value)}
                  placeholder="Add custom OE key..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOeKey(newOeKey))}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addOeKey(newOeKey)}
                  disabled={!newOeKey.trim()}
                >
                  <Plus size={16} />
                </Button>
              </div>

              {formData.oeKeys.length > 0 && (
                <div>
                  <Label>Selected OE Keys</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.oeKeys.map((key) => (
                      <Badge key={key} variant="outline" className="flex items-center gap-1">
                        {key}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 hover:bg-transparent"
                          onClick={() => removeOeKey(key)}
                        >
                          <X size={12} />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add tag..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(newTag))}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addTag(newTag)}
                  disabled={!newTag.trim()}
                >
                  <Plus size={16} />
                </Button>
              </div>

              {formData.tags.length > 0 && (
                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 hover:bg-transparent"
                          onClick={() => removeTag(tag)}
                        >
                          <X size={12} />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/constructs/${slug}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.title.trim() || isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                'Saving...'
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditConstructPage;