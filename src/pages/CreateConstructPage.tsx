import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Upload, Image, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AdminNav from '@/components/admin/AdminNav';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

const CreateConstructPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    oeKeys: [] as string[],
    tags: [] as string[],
    assets: [] as Array<{ file: File; kind: 'image' | 'diagram'; title: string }>,
  });
  
  const [newOeKey, setNewOeKey] = useState('');
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const commonOeKeys = [
    'Ownership', 'Governance', 'Purpose', 'Structure', 
    'Process', 'People', 'Performance', 'Culture'
  ];

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, kind: 'image' | 'diagram') => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const validTypes = kind === 'image' 
        ? ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        : ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
      return validTypes.includes(file.type);
    });

    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid file type",
        description: kind === 'image' 
          ? "Please upload valid image files (JPEG, PNG, WebP, GIF)."
          : "Please upload valid diagram files (Images or PDF).",
        variant: "destructive",
      });
    }

    validFiles.forEach(file => {
      const defaultTitle = file.name.replace(/\.[^/.]+$/, "");
      setFormData(prev => ({
        ...prev,
        assets: [...prev.assets, { file, kind, title: defaultTitle }]
      }));
    });
  };

  const removeAsset = (index: number) => {
    setFormData(prev => ({
      ...prev,
      assets: prev.assets.filter((_, i) => i !== index)
    }));
  };

  const updateAssetTitle = (index: number, title: string) => {
    setFormData(prev => ({
      ...prev,
      assets: prev.assets.map((asset, i) => 
        i === index ? { ...asset, title } : asset
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create constructs.",
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
      const slug = generateSlug(formData.title);
      
      // Create the construct
      const { data: construct, error: constructError } = await supabase
        .from('constructs')
        .insert({
          user_id: user.id,
          slug,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          oe_keys: formData.oeKeys,
          tags: formData.tags,
          state: 'draft',
          latest_version: 1,
        })
        .select()
        .single();

      if (constructError) {
        if (constructError.code === '23505') { // Unique constraint violation
          throw new Error('A construct with this title already exists. Please choose a different title.');
        }
        throw constructError;
      }

      // Create the first version
      const { error: versionError } = await supabase
        .from('construct_versions')
        .insert({
          construct_id: construct.id,
          version: 1,
          diagram_json: null,
          notes_md: null,
          created_by_id: user.id,
        });

      if (versionError) throw versionError;

      // Upload assets if any
      const assetPromises = formData.assets.map(async (asset, index) => {
        const fileExt = asset.file.name.split('.').pop();
        const fileName = `${construct.id}/${Date.now()}_${index}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('construct-assets')
          .upload(fileName, asset.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('construct-assets')
          .getPublicUrl(fileName);

        // Save asset reference
        const { error: assetError } = await supabase
          .from('construct_assets')
          .insert({
            construct_version_id: construct.id,
            kind: asset.kind,
            url: publicUrl,
            title: asset.title || asset.file.name,
          });

        if (assetError) throw assetError;
      });

      await Promise.all(assetPromises);

      // Log the creation
      await supabase
        .from('construct_audit_logs')
        .insert({
          user_id: user.id,
          action: 'CONSTRUCT_CREATE',
          construct_id: construct.id,
          meta: {
            title: formData.title,
            oe_keys: formData.oeKeys,
            tags: formData.tags,
            assets_count: formData.assets.length,
          },
        });

      toast({
        title: "Construct created",
        description: `Your construct has been created successfully${formData.assets.length > 0 ? ` with ${formData.assets.length} asset(s)` : ''}.`,
      });

      navigate(`/constructs/${slug}`);
    } catch (error) {
      console.error('Error creating construct:', error);
      toast({
        title: "Error creating construct",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminNav />
      
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/constructs')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Back to Constructs
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold text-[var(--chat-text)]">Create New Construct</h1>
            <p className="text-[var(--chat-text-secondary)] mt-1">
              Define a new organizational construct with diagrams and teaching resources
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
                {formData.title && (
                  <p className="text-xs text-[var(--chat-muted)] mt-1">
                    Slug: {generateSlug(formData.title)}
                  </p>
                )}
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

          {/* Images and Diagrams */}
          <Card>
            <CardHeader>
              <CardTitle>Images & Diagrams</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Upload Images</Label>
                  <div className="border-2 border-dashed border-[var(--chat-border)] rounded-lg p-6 text-center">
                    <Image className="mx-auto mb-2 text-[var(--chat-muted)]" size={32} />
                    <p className="text-sm text-[var(--chat-text-secondary)] mb-2">Upload construct images</p>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFileUpload(e, 'image')}
                      className="hidden"
                      id="image-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      <Upload size={16} className="mr-2" />
                      Choose Images
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Upload Diagrams</Label>
                  <div className="border-2 border-dashed border-[var(--chat-border)] rounded-lg p-6 text-center">
                    <FileText className="mx-auto mb-2 text-[var(--chat-muted)]" size={32} />
                    <p className="text-sm text-[var(--chat-text-secondary)] mb-2">Upload diagrams & charts</p>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      multiple
                      onChange={(e) => handleFileUpload(e, 'diagram')}
                      className="hidden"
                      id="diagram-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('diagram-upload')?.click()}
                    >
                      <Upload size={16} className="mr-2" />
                      Choose Diagrams
                    </Button>
                  </div>
                </div>
              </div>

              {/* Uploaded Assets */}
              {formData.assets.length > 0 && (
                <div className="space-y-4">
                  <Label>Uploaded Assets ({formData.assets.length})</Label>
                  <div className="space-y-3">
                    {formData.assets.map((asset, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                        <div className="flex-shrink-0">
                          {asset.kind === 'image' ? (
                            <Image className="text-blue-500" size={20} />
                          ) : (
                            <FileText className="text-green-500" size={20} />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={asset.kind === 'image' ? 'default' : 'secondary'}>
                              {asset.kind}
                            </Badge>
                            <span className="text-sm text-[var(--chat-text-secondary)]">{asset.file.name}</span>
                            <span className="text-xs text-[var(--chat-muted)]">
                              ({(asset.file.size / 1024 / 1024).toFixed(1)} MB)
                            </span>
                          </div>
                          <Input
                            value={asset.title}
                            onChange={(e) => updateAssetTitle(index, e.target.value)}
                            placeholder="Asset title..."
                            className="text-sm"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAsset(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-[var(--chat-muted)]">
                Supported formats: JPEG, PNG, WebP, GIF for images. PDF files are also supported for diagrams.
              </p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/constructs')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.title.trim() || isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Construct'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateConstructPage;