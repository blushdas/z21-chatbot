import { supabase } from '@/integrations/supabase/client';
import { BetaWaitlistFormData } from '@/types/betaWaitlist';

export const submitBetaWaitlist = async (data: BetaWaitlistFormData) => {
  const { data: result, error } = await supabase
    .from('beta_waitlist')
    .insert([{
      name: data.name,
      email: data.email,
      organization: data.organization || null,
      reason: data.reason,
      status: 'pending'
    }])
    .select()
    .single();
  
  if (error) {
    // Check for duplicate email error
    if (error.code === '23505') {
      throw new Error("You're already on the waitlist!");
    }
    throw new Error(error.message || 'Something went wrong. Please try again.');
  }
  
  return result;
};
