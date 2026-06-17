
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/SupabaseAuthContext';
import { toast as sonnerToast } from 'sonner';

export interface PasswordStrength {
  length: boolean;
  upper: boolean;
  lower: boolean;
  number: boolean;
  symbol: boolean;
  notCommon: boolean;
}

const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '12345678', '123456789', 'qwerty123',
  'qwertyuiop', 'iloveyou', 'admin123', 'welcome1', 'letmein1', 'abc12345',
]);

export const evaluatePasswordStrength = (pw: string): PasswordStrength => ({
  length: pw.length >= 10,
  upper: /[A-Z]/.test(pw),
  lower: /[a-z]/.test(pw),
  number: /[0-9]/.test(pw),
  symbol: /[^A-Za-z0-9]/.test(pw),
  notCommon: pw.length > 0 && !COMMON_PASSWORDS.has(pw.toLowerCase()),
});

export const isPasswordStrong = (pw: string): boolean => {
  const s = evaluatePasswordStrength(pw);
  return s.length && s.upper && s.lower && s.number && s.symbol && s.notCommon;
};

interface ProfileData {
  name: string;
  email: string;
  avatar_url: string;
}

export const useProfile = () => {
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    email: '',
    avatar_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const { user, updateProfile: updateAuthProfile } = useAuth();
  const { toast } = useToast();

  // Load profile data on mount
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.user_metadata?.name || '',
        email: user.email || '',
        avatar_url: user.user_metadata?.avatar_url || ''
      });
    }
  }, [user]);

  const updateProfile = async (updates: Partial<ProfileData>) => {
    if (!user) {
      toast({
        title: "Error",
        description: "No user logged in",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Update profiles table using UPDATE instead of UPSERT
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: updates.name,
          avatar_url: updates.avatar_url
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update auth user metadata if name or avatar changed
      if (updates.name || updates.avatar_url) {
        const authUpdates: any = {
          data: {
            name: updates.name || profile.name,
            avatar_url: updates.avatar_url || profile.avatar_url
          }
        };

        const { error: authError } = await supabase.auth.updateUser(authUpdates);
        if (authError) throw authError;
      }

      // Update email separately if changed
      let emailChangeRequested = false;
      if (updates.email && updates.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: updates.email
        });
        if (emailError) {
          // Provide specific feedback based on the error
          const msg = emailError.message?.toLowerCase() || '';
          let userMessage = emailError.message || 'Failed to update email';
          if (msg.includes('not authorized') || msg.includes('not allowed')) {
            userMessage = 'This email address is not authorized. Only approved organization emails can be used.';
          } else if (msg.includes('already registered') || msg.includes('already in use') || msg.includes('unique')) {
            userMessage = 'This email address is already associated with another account.';
          } else if (msg.includes('invalid') || msg.includes('format')) {
            userMessage = 'Please enter a valid email address.';
          } else if (msg.includes('rate') || msg.includes('limit')) {
            userMessage = 'Too many attempts. Please wait a moment and try again.';
          }
          toast({
            title: "Email Update Failed",
            description: userMessage,
            variant: "destructive"
          });
          return;
        }
        emailChangeRequested = true;
      }

      // Update local state
      setProfile(prev => ({ ...prev, ...updates }));

      // Update auth context
      await updateAuthProfile({
        name: updates.name || null,
        avatar_url: updates.avatar_url || null
      });

      if (emailChangeRequested) {
        toast({
          title: "Confirmation Required",
          description: "A confirmation link has been sent to your new email address. Please check your inbox to complete the change.",
        });
      } else {
        toast({
          title: "Success",
          description: "Profile updated successfully!"
        });
      }

    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (
    password: string,
    currentPassword?: string
  ): Promise<boolean> => {
    if (!user?.email) {
      sonnerToast.error('Not signed in');
      return false;
    }
    if (!currentPassword) {
      sonnerToast.error('Enter your current password');
      return false;
    }
    if (!isPasswordStrong(password)) {
      sonnerToast.error('Password does not meet the strength requirements');
      return false;
    }
    if (password === currentPassword) {
      sonnerToast.error('New password must be different from your current password');
      return false;
    }

    setLoading(true);
    try {
      // Verify current password on an isolated client so the caller's
      // session (and any 2FA AAL) is not disturbed. signInWithPassword on
      // the main client would replace the session and, for 2FA users,
      // surface as a generic error.
      const verifier = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });
      const { error: reauthError } = await verifier.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      // Clean up the verifier session no matter what.
      try { await verifier.auth.signOut(); } catch { /* ignore */ }

      if (reauthError) {
        const m = reauthError.message?.toLowerCase() || '';
        if (m.includes('rate') || m.includes('too many')) {
          sonnerToast.error('Too many attempts. Please wait a minute and try again.');
        } else {
          sonnerToast.error('Current password is incorrect');
        }
        return false;
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        const msg = error.message?.toLowerCase() || '';
        const code = (error as any).code as string | undefined;
        if (code === 'weak_password' || msg.includes('weak') || msg.includes('breach') || msg.includes('pwned') || msg.includes('leaked')) {
          sonnerToast.error('This password has appeared in a data breach. Please choose a different one.');
        } else if (code === 'same_password' || msg.includes('should be different') || msg.includes('same as')) {
          sonnerToast.error('New password must be different from your current password.');
        } else if (msg.includes('rate') || msg.includes('too many')) {
          sonnerToast.error('Too many attempts. Please wait a minute and try again.');
        } else {
          sonnerToast.error(error.message || 'Failed to update password');
        }
        return false;
      }

      setNewPassword('');
      sonnerToast.success('Password updated successfully');
      return true;
    } catch (error: any) {
      sonnerToast.error(error?.message || 'Failed to update password');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    setProfile,
    newPassword,
    setNewPassword,
    loading,
    updateProfile,
    updatePassword
  };
};
