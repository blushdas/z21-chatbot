import { supabase } from '@/integrations/supabase/client';

export interface GeneralFeedback {
  id: string;
  user_id: string;
  category: string;
  subject: string | null;
  message: string;
  created_at: string;
  profiles?: {
    name: string | null;
    email: string | null;
  } | null;
}

export interface GeneralFeedbackInput {
  category: string;
  subject?: string;
  message: string;
}

export const generalFeedbackService = {
  async submitFeedback(data: GeneralFeedbackInput): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('general_feedback' as any)
      .insert({
        user_id: userData.user.id,
        category: data.category,
        subject: data.subject || null,
        message: data.message,
      });

    if (error) {
      throw error;
    }
  },

  async getUserFeedback(): Promise<GeneralFeedback[]> {
    const { data, error } = await supabase
      .from('general_feedback' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []) as unknown as GeneralFeedback[];
  },

  async getAllFeedback(): Promise<GeneralFeedback[]> {
    const { data, error } = await supabase
      .from('general_feedback' as any)
      .select(`
        *,
        profiles:user_id (
          name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []) as unknown as GeneralFeedback[];
  },

  async deleteFeedback(id: string): Promise<void> {
    const { error } = await supabase
      .from('general_feedback' as any)
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  },
};
