import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AddKnowledgeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DOCUMENT_TYPES = ['Book', 'Podcast', 'Article', 'Video', 'Course', 'Whitepaper', 'Interview', 'Other'];
const DOMAINS = ['Leadership', 'Communication', 'Culture', 'Strategy', 'Personal Growth', 'Team Dynamics', 'Other'];

const AddKnowledgeModal: React.FC<AddKnowledgeModalProps> = ({ open, onOpenChange }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    original_title: '',
    document_type: '',
    source_url: '',
    domain: '',
    subdomain: '',
    category: '',
    tags: '',
    summary: '',
    bullet_points: '',
    file_date: '',
    box_file_id: ''
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const payload = {
        original_title: formData.original_title,
        document_type: formData.document_type,
        source_url: formData.source_url || null,
        domain: formData.domain || null,
        subdomain: formData.subdomain || null,
        category: formData.category || null,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        summary: formData.summary || null,
        bullet_points: formData.bullet_points ? formData.bullet_points.split('\n').map(b => b.trim()).filter(Boolean) : [],
        file_date: formData.file_date || null,
        box_file_id: formData.box_file_id || null,
        status: 'pending',
        created_by: user?.id || null
      };

      const { error } = await supabase
        .from('knowledge_sources')
        .insert(payload);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-sources'] });
      toast.success('Source added successfully');
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to add source: ' + error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      original_title: '',
      document_type: '',
      source_url: '',
      domain: '',
      subdomain: '',
      category: '',
      tags: '',
      summary: '',
      bullet_points: '',
      file_date: '',
      box_file_id: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.original_title || !formData.document_type) {
      toast.error('Title and Document Type are required');
      return;
    }
    addMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Knowledge Source</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="original_title">Title *</Label>
              <Input
                id="original_title"
                value={formData.original_title}
                onChange={(e) => setFormData({ ...formData, original_title: e.target.value })}
                placeholder="Original document title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document_type">Document Type *</Label>
              <Select
                value={formData.document_type}
                onValueChange={(value) => setFormData({ ...formData, document_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source_url">Source URL</Label>
              <Input
                id="source_url"
                type="url"
                value={formData.source_url}
                onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="box_file_id">Box File ID</Label>
              <Input
                id="box_file_id"
                value={formData.box_file_id}
                onChange={(e) => setFormData({ ...formData, box_file_id: e.target.value })}
                placeholder="Box file identifier"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Select
                value={formData.domain}
                onValueChange={(value) => setFormData({ ...formData, domain: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select domain" />
                </SelectTrigger>
                <SelectContent>
                  {DOMAINS.map((domain) => (
                    <SelectItem key={domain} value={domain}>
                      {domain}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subdomain">Subdomain</Label>
              <Input
                id="subdomain"
                value={formData.subdomain}
                onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                placeholder="e.g., Executive Coaching"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Core Curriculum"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file_date">File Date</Label>
              <Input
                id="file_date"
                type="date"
                value={formData.file_date}
                onChange={(e) => setFormData({ ...formData, file_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="leadership, coaching, communication"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Brief description of the content..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bullet_points">Key Points (one per line)</Label>
            <Textarea
              id="bullet_points"
              value={formData.bullet_points}
              onChange={(e) => setFormData({ ...formData, bullet_points: e.target.value })}
              placeholder="First key takeaway&#10;Second key takeaway&#10;Third key takeaway"
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addMutation.isPending}>
              {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Source
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddKnowledgeModal;
