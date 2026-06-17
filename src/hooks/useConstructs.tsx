import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  user_id: string;
}

interface ConstructVersion {
  id: string;
  construct_id: string;
  version: number;
  diagram_json?: any;
  notes_md?: string;
  created_by_id: string;
  created_at: string;
}

interface CreateConstructData {
  title: string;
  description?: string;
  oe_keys: string[];
  tags: string[];
}

interface UpdateConstructData {
  title?: string;
  description?: string;
  oe_keys?: string[];
  tags?: string[];
  state?: 'draft' | 'published' | 'archived';
}

export const useConstructs = (searchQuery?: string, stateFilter?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['constructs', searchQuery, stateFilter],
    queryFn: async () => {
      let query = supabase
        .from('constructs')
        .select('*')
        .order('updated_at', { ascending: false });

      if (stateFilter && stateFilter !== 'all') {
        query = query.eq('state', stateFilter as 'draft' | 'published' | 'archived');
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Construct[];
    },
    enabled: !!user,
  });
};

export const useConstruct = (slug: string) => {
  const { user } = useAuth();

  return useQuery({
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
};

export const useConstructVersions = (constructId: string) => {
  return useQuery({
    queryKey: ['construct-versions', constructId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('construct_versions')
        .select('*')
        .eq('construct_id', constructId)
        .order('version', { ascending: false });
      
      if (error) throw error;
      return data as ConstructVersion[];
    },
    enabled: !!constructId,
  });
};

export const useConstructVersion = (constructId: string, version: number) => {
  return useQuery({
    queryKey: ['construct-version', constructId, version],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('construct_versions')
        .select('*')
        .eq('construct_id', constructId)
        .eq('version', version)
        .single();
      
      if (error) throw error;
      return data as ConstructVersion;
    },
    enabled: !!constructId && !!version,
  });
};

export const useCreateConstruct = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateConstructData) => {
      if (!user) throw new Error('User not authenticated');

      const slug = data.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Create the construct
      const { data: construct, error: constructError } = await supabase
        .from('constructs')
        .insert({
          user_id: user.id,
          slug,
          title: data.title,
          description: data.description || null,
          oe_keys: data.oe_keys,
          tags: data.tags,
          state: 'draft',
          latest_version: 1,
        })
        .select()
        .single();

      if (constructError) throw constructError;

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

      // Log the creation
      await supabase
        .from('construct_audit_logs')
        .insert({
          user_id: user.id,
          action: 'CONSTRUCT_CREATE',
          construct_id: construct.id,
          meta: {
            title: data.title,
            oe_keys: data.oe_keys,
            tags: data.tags,
          },
        });

      return construct;
    },
    onSuccess: (construct) => {
      queryClient.invalidateQueries({ queryKey: ['constructs'] });
      toast({
        title: "Construct created",
        description: "Your construct has been created successfully.",
      });
    },
    onError: (error) => {
      console.error('Error creating construct:', error);
      toast({
        title: "Error creating construct",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateConstruct = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateConstructData }) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('constructs')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      // Log the update
      await supabase
        .from('construct_audit_logs')
        .insert({
          user_id: user.id,
          action: 'CONSTRUCT_UPDATE',
          construct_id: id,
          meta: data as any,
        });

      return { id, data };
    },
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ['constructs'] });
      queryClient.invalidateQueries({ queryKey: ['construct'] });
      
      if (data.state) {
        toast({
          title: `Construct ${data.state}`,
          description: `The construct has been ${data.state} successfully.`,
        });
      } else {
        toast({
          title: "Construct updated",
          description: "Your construct has been updated successfully.",
        });
      }
    },
    onError: (error) => {
      console.error('Error updating construct:', error);
      toast({
        title: "Error updating construct",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteConstruct = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('constructs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constructs'] });
      toast({
        title: "Construct deleted",
        description: "The construct has been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error('Error deleting construct:', error);
      toast({
        title: "Error deleting construct",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateConstructVersion = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      versionId, 
      data 
    }: { 
      versionId: string; 
      data: { diagram_json?: any; notes_md?: string } 
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('construct_versions')
        .update(data)
        .eq('id', versionId);

      if (error) throw error;

      return { versionId, data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['construct-versions'] });
      queryClient.invalidateQueries({ queryKey: ['construct-version'] });
      toast({
        title: "Version updated",
        description: "The construct version has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Error updating version:', error);
      toast({
        title: "Error updating version",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });
};