
import React, { createContext, useContext, useState, useEffect, useLayoutEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import logger from '@/utils/logger';
import type { SignupClientData } from '@/utils/signupDataCollector';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { IdleTimeoutWarning } from '@/components/auth/IdleTimeoutWarning';
import { getRememberMePreference, clearRememberMePreference } from '@/utils/sessionStorageAdapter';

export interface UserProfile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin' | 'superadmin';
  created_at: string;
  updated_at: string;
  onboarding_completed: boolean;
  prompt_coaching_enabled?: boolean | null;
  commentary_preference?: 'inline' | 'sidebar' | 'off' | null;
  theme_preference?: 'light' | 'dark' | null;
  custom_instructions?: string | null;
}

interface TwoFactorResult {
  requires2FA: boolean;
  twoFactorMethod?: 'email' | 'totp';
  pendingUserId?: string;
  pendingEmail?: string;
}

const PENDING_2FA_KEY = 'daryle_pending_2fa';

interface PendingTwoFactorState {
  userId: string;
  method: 'email' | 'totp';
  email: string;
}

const isUserRole = (value: unknown): value is UserProfile['role'] =>
  value === 'user' || value === 'admin' || value === 'superadmin';

const roleFromAppMetadata = (authUser: User | null | undefined): UserProfile['role'] | null => {
  const role = authUser?.app_metadata?.role;
  return isUserRole(role) ? role : null;
};

const filterProfileUpdates = (updates: Partial<UserProfile>) => {
  const allowed: Partial<Pick<
    UserProfile,
    | 'name'
    | 'avatar_url'
    | 'onboarding_completed'
    | 'prompt_coaching_enabled'
    | 'commentary_preference'
    | 'theme_preference'
    | 'custom_instructions'
  >> = {};

  if (updates.name !== undefined) allowed.name = updates.name;
  if (updates.avatar_url !== undefined) allowed.avatar_url = updates.avatar_url;
  if (updates.onboarding_completed !== undefined) allowed.onboarding_completed = updates.onboarding_completed;
  if (updates.prompt_coaching_enabled !== undefined) allowed.prompt_coaching_enabled = updates.prompt_coaching_enabled;
  if (updates.commentary_preference !== undefined) allowed.commentary_preference = updates.commentary_preference;
  if (updates.theme_preference !== undefined) allowed.theme_preference = updates.theme_preference;
  if (updates.custom_instructions !== undefined) allowed.custom_instructions = updates.custom_instructions;

  return allowed;
};

const isTwoFactorMethod = (value: unknown): value is PendingTwoFactorState['method'] =>
  value === 'email' || value === 'totp';

const shouldHoldAuthTheme = (pathname: string) =>
  pathname === '/auth' || pathname === '/login' || pathname === '/auth/2fa-challenge';

const applyDocumentThemePreference = (theme: UserProfile['theme_preference']) => {
  if (theme !== 'light' && theme !== 'dark') return;

  localStorage.setItem('daryle-theme-v3', theme);
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
};

const readPendingTwoFactorFromSession = (session: Session | null): PendingTwoFactorState | null => {
  const pending = session?.user?.app_metadata?.pending_2fa;
  if (!pending || typeof pending !== 'object') return null;

  const pendingRecord = pending as Record<string, unknown>;
  if (pendingRecord.required !== true) return null;

  const method = pendingRecord.method;
  if (!isTwoFactorMethod(method)) return null;

  const userId = typeof pendingRecord.userId === 'string'
    ? pendingRecord.userId
    : session.user.id;
  if (userId !== session.user.id) return null;

  return {
    userId,
    method,
    email: typeof pendingRecord.email === 'string' && pendingRecord.email
      ? pendingRecord.email
      : session.user.email ?? '',
  };
};

export const clearPendingTwoFactor = () => {
  try {
    sessionStorage.removeItem(PENDING_2FA_KEY);
  } catch {
    // ignore storage failures
  }
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  pending2FA: boolean;
  pendingTwoFactor: PendingTwoFactorState | null;
  signUp: (email: string, password: string, name?: string, phone?: string, privacyTermsAgreed?: boolean, signupContext?: SignupClientData) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any; twoFactor?: TwoFactorResult }>;
  completeTwoFactor: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>;
  setThemePreference: (theme: 'light' | 'dark') => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending2FA, setPending2FA] = useState(false);
  const [pendingTwoFactor, setPendingTwoFactor] = useState<PendingTwoFactorState | null>(null);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [sessionTimeoutMs, setSessionTimeoutMs] = useState(15 * 60 * 1000);
  // Ref to track if we're in the middle of a 2FA check (prevents onAuthStateChange from setting user)
  const pending2FACheckRef = useRef(false);
  // Ref to track if we redirected to /reset-password (for cleanup on nav away — R4)
  const recoveryRedirectRef = useRef(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  // Stable refs so the mount-once auth effect can call latest navigate/location without re-subscribing
  const navigateRef = useRef(navigate);
  const locationRef = useRef(location);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);
  useEffect(() => { locationRef.current = location; }, [location]);

  useLayoutEffect(() => {
    if (!profile?.theme_preference || shouldHoldAuthTheme(location.pathname)) return;

    try {
      applyDocumentThemePreference(profile.theme_preference);
    } catch (e) {
      logger.warn('Failed to apply theme preference', e);
    }
  }, [profile?.theme_preference, location.pathname]);

  // Load admin-configured session timeout from platform_settings
  useEffect(() => {
    supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'session_timeout_minutes')
      .single()
      .then(({ data }) => {
        const minutes = (data?.value as { minutes?: number } | null)?.minutes;
        if (minutes && minutes > 0) setSessionTimeoutMs(minutes * 60 * 1000);
      });
  }, []);

  // Handle session timeout for non-"Remember Me" sessions
  const handleSessionTimeout = () => {
    setShowTimeoutWarning(false);
    signOutInternal();
    toast({
      title: 'Session Expired',
      description: 'You have been signed out due to inactivity.',
    });
  };

  const { isWarningShown, remainingTime, extendSession } = useIdleTimeout({
    timeout: sessionTimeoutMs,
    warningTime: 60 * 1000,  // 1 minute warning
    onWarning: () => setShowTimeoutWarning(true),
    onTimeout: handleSessionTimeout,
    enabled: !!user && !getRememberMePreference()
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.info('Auth state change:', event, session ? 'has session' : 'no session');

        // Always clear pending2FA flags on a real SIGNED_OUT so UI doesn't stick on a spinner
        if (event === 'SIGNED_OUT') {
          pending2FACheckRef.current = false;
          clearPendingTwoFactor();
          setPending2FA(false);
          setPendingTwoFactor(null);
        }

        // SECURITY: Block user state propagation during 2FA check
        if (pending2FACheckRef.current) {
          logger.debug('Blocking auth state change during 2FA check');
          return;
        }

        const currentPath = locationRef.current.pathname;

        // T1: PASSWORD_RECOVERY event — redirect to /reset-password, do NOT treat as login
        if (event === 'PASSWORD_RECOVERY') {
          logger.info('PASSWORD_RECOVERY event detected — redirecting to /reset-password');
          recoveryRedirectRef.current = true;
          sessionStorage.setItem('daryle_recovery_active', 'true');
          if (currentPath !== '/reset-password') {
            navigateRef.current('/reset-password', { replace: true });
          }
          // Do NOT set user/session — let ResetPasswordPage handle it
          setLoading(false);
          return;
        }

        // T2: SIGNED_IN on /reset-password — skip user state propagation, let the page handle it
        if (event === 'SIGNED_IN' && currentPath === '/reset-password') {
          logger.debug('SIGNED_IN on /reset-password — skipping user state propagation');
          setLoading(false);
          return;
        }

        const serverPending2FA = readPendingTwoFactorFromSession(session);
        const hasPending2FA = !!serverPending2FA;

        if (hasPending2FA) {
          setPending2FA(true);
          setPendingTwoFactor(serverPending2FA);
          setSession(session);
          setUser(session?.user ?? null);
          setProfile(null);
          setLoading(false);
          if (currentPath !== '/auth/2fa-challenge') {
            navigateRef.current('/auth/2fa-challenge', { replace: true });
          }
          return;
        }

        // Reset pending2FA if we have a valid session and are not actively checking
        if (session?.user) {
          setPending2FA(false);
          setPendingTwoFactor(null);
          clearPendingTwoFactor();
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          if (!session.user.email_confirmed_at) {
            logger.debug('Email not verified, blocking access');
            setProfile(null);
            setLoading(false);
            return;
          }

          fetchUserProfile(session.user.id, session.user);
          // Route-aware redirect handled by the separate redirect effect
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        logger.error('Error getting session:', error);
      }

      logger.debug('Initial session check:', session ? 'Found session' : 'No session');

      const currentPath = locationRef.current.pathname;

      // R2: Do NOT set user state when on /reset-password — let the page handle its own session
      if (currentPath === '/reset-password') {
        logger.debug('On /reset-password — skipping user state propagation from getSession');
        setLoading(false);
        return;
      }

      const serverPending2FA = readPendingTwoFactorFromSession(session);
      const hasPending2FA = !!serverPending2FA;

      setSession(session);
      setUser(session?.user ?? null);

      if (hasPending2FA) {
        setPending2FA(true);
        setPendingTwoFactor(serverPending2FA);
        setProfile(null);
        setLoading(false);
        if (currentPath !== '/auth/2fa-challenge') {
          navigateRef.current('/auth/2fa-challenge', { replace: true });
        }
        return;
      }

      if (session?.user) {
        if (!session.user.email_confirmed_at) {
          logger.debug('Initial session: Email not verified');
          setLoading(false);
          return;
        }

        fetchUserProfile(session.user.id, session.user);
        // Route-aware redirect handled by the separate redirect effect
      } else {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount once — uses refs for navigate/location

  // Route-aware redirect: when a verified user is on /auth or /login, push them to chat
  useEffect(() => {
    if (loading) return;
    if (pending2FA) return;
    if (!user) return;
    if (!user.email_confirmed_at) return;
    if (location.pathname === '/auth' || location.pathname === '/login') {
      logger.debug('Redirecting authenticated user away from auth page');
      navigate('/chat', { replace: true });
    }
  }, [user, loading, pending2FA, location.pathname, navigate]);

  // R4: Clean up recovery session when user navigates away from /reset-password without completing reset
  useEffect(() => {
    if (recoveryRedirectRef.current && location.pathname !== '/reset-password') {
      logger.info('User navigated away from /reset-password without completing reset — signing out locally');
      recoveryRedirectRef.current = false;
      supabase.auth.signOut({ scope: 'local' }).then(() => {
        setUser(null);
        setSession(null);
        setProfile(null);
      });
    }
  }, [location.pathname]);

  const fetchUserProfile = async (userId: string, authUser?: User | null) => {
    try {
      logger.debug('Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        logger.error('Error fetching profile:', error);
        if (error.code !== 'PGRST116') {
          toast({
            title: "Profile Error",
            description: "Could not load user profile",
            variant: "destructive"
          });
        }
        setLoading(false);
        return;
      }

      let resolvedRole = roleFromAppMetadata(authUser);
      if (!resolvedRole) {
        const { data: roleData } = await supabase
          .rpc('get_user_role', { _user_id: userId });
        resolvedRole = isUserRole(roleData) ? roleData : 'user';
      }

      logger.info('Profile loaded:', data, 'Role:', resolvedRole);
      
      setProfile({
        ...data,
        role: resolvedRole,
        commentary_preference: (data.commentary_preference as 'inline' | 'sidebar' | 'off') || null,
        theme_preference: ((data as any).theme_preference as 'light' | 'dark') || 'light',
      });

      // Apply user's saved theme preference across devices
      const savedTheme = (data as any).theme_preference as 'light' | 'dark' | undefined;
      if (savedTheme === 'light' || savedTheme === 'dark') {
        try {
          if (shouldHoldAuthTheme(locationRef.current.pathname)) {
            localStorage.setItem('daryle-theme-v3', savedTheme);
          } else {
            applyDocumentThemePreference(savedTheme);
          }
        } catch (e) {
          logger.warn('Failed to apply theme preference', e);
        }
      }

      setLoading(false);
    } catch (error) {
      logger.error('Error fetching profile:', error);
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name?: string, phone?: string, privacyTermsAgreed?: boolean, signupContext?: SignupClientData) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { 
          name: name || '',
          phone: phone || '',
          privacy_terms_agreed: privacyTermsAgreed || false,
          signup_context: signupContext || null
        }
      }
    });

    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      if (data.user && phone) {
        await supabase
          .from('profiles')
          .update({ phone })
          .eq('id', data.user.id);
      }
      
      toast({
        title: "Check your email",
        description: "We've sent you a confirmation link to complete your registration."
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // Block auth-state propagation until we know if 2FA is required
    pending2FACheckRef.current = true;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      pending2FACheckRef.current = false;
      setPending2FA(false);
      setPendingTwoFactor(null);
      const friendly = error.message?.toLowerCase().includes('invalid login')
        ? 'Incorrect email or password'
        : error.message;
      toast({
        title: 'Sign in failed',
        description: friendly,
        variant: 'destructive'
      });
      return { error };
    }

    // Ask the server whether this fresh session still needs a 2FA challenge.
    try {
      const { data: twoFactorCheck, error: twoFactorError } = await supabase.functions.invoke('pre-auth-check', {
        body: { action: 'check_2fa' },
      });

      if (twoFactorError || twoFactorCheck?.allowed === false) {
        logger.error('2FA session check failed:', twoFactorError || twoFactorCheck);
        pending2FACheckRef.current = false;
        setPending2FA(false);
        setPendingTwoFactor(null);
        await supabase.auth.signOut({ scope: 'local' });
        return { error: new Error('Two-factor authentication check failed') };
      }

      if (twoFactorCheck?.requires2FA) {
        const pendingState: PendingTwoFactorState = {
          userId: twoFactorCheck.pendingUserId || data.user!.id,
          method: (twoFactorCheck.method as 'email' | 'totp') || 'email',
          email: twoFactorCheck.email || email,
        };
        try {
          sessionStorage.setItem(PENDING_2FA_KEY, JSON.stringify(pendingState));
        } catch (storageError) {
          logger.warn('Unable to persist 2FA challenge state:', storageError);
        }
        const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
        const challengedSession = refreshed.session;
        const serverPendingState = readPendingTwoFactorFromSession(challengedSession);
        if (refreshError || !challengedSession || !serverPendingState) {
          logger.error('2FA pending metadata refresh failed:', refreshError);
          pending2FACheckRef.current = false;
          setPending2FA(false);
          setPendingTwoFactor(null);
          await supabase.auth.signOut({ scope: 'local' });
          return { error: new Error('Two-factor authentication challenge initialization failed') };
        }
        // Hydrate session/user so the challenge page has auth context.
        // The SIGNED_IN event was swallowed while pending2FACheckRef was true.
        setSession(challengedSession);
        setUser(challengedSession?.user ?? data.user);
        setProfile(null);
        setLoading(false);
        pending2FACheckRef.current = false;
        setPending2FA(true);
        setPendingTwoFactor(serverPendingState);
        return {
          error: null,
          twoFactor: {
            requires2FA: true,
            twoFactorMethod: serverPendingState.method,
            pendingUserId: serverPendingState.userId,
            pendingEmail: serverPendingState.email,
          },
        };
      }
    } catch (e) {
      logger.error('2FA check threw:', e);
      pending2FACheckRef.current = false;
      setPending2FA(false);
      setPendingTwoFactor(null);
      await supabase.auth.signOut({ scope: 'local' });
      return { error: new Error('Two-factor authentication check failed') };
    }

    // No 2FA required. The SIGNED_IN listener bailed because the ref was
    // true while signInWithPassword ran, so manually hydrate state here.
    pending2FACheckRef.current = false;
    setPending2FA(false);
    setPendingTwoFactor(null);
    clearPendingTwoFactor();
    setSession(data.session);
    setUser(data.user);
    if (data.user?.email_confirmed_at) {
      await fetchUserProfile(data.user.id, data.user);
    } else {
      setProfile(null);
      setLoading(false);
    }

    toast({
      title: 'Welcome back!',
      description: "You've been signed in successfully."
    });

    return { error: null };
  };

  const completeTwoFactor = async () => {
    clearPendingTwoFactor();
    pending2FACheckRef.current = false;

    const { data: { session: currentSession } } = await supabase.auth.refreshSession();
    const serverPending2FA = readPendingTwoFactorFromSession(currentSession);
    setSession(currentSession);
    setUser(currentSession?.user ?? null);
    if (serverPending2FA) {
      setPending2FA(true);
      setPendingTwoFactor(serverPending2FA);
      setProfile(null);
      setLoading(false);
      return;
    }

    setPending2FA(false);
    setPendingTwoFactor(null);
    if (currentSession?.user?.email_confirmed_at) {
      await fetchUserProfile(currentSession.user.id, currentSession.user);
    } else {
      setLoading(false);
    }
  };

  // Internal signOut that doesn't navigate (for timeout)
  const signOutInternal = async () => {
    setPending2FA(false);
    setPendingTwoFactor(null);
    pending2FACheckRef.current = false;
    clearPendingTwoFactor();
    clearRememberMePreference();
    const { error } = await supabase.auth.signOut();
    if (error) {
      // Server session already gone — force clear local token
      await supabase.auth.signOut({ scope: 'local' });
    }
    navigate('/login');
  };

  const signOut = async () => {
    // Reset pending2FA state on sign out
    setPending2FA(false);
    setPendingTwoFactor(null);
    pending2FACheckRef.current = false;
    clearPendingTwoFactor();
    clearRememberMePreference();
    
    let { error } = await supabase.auth.signOut();
    
    if (error) {
      // Server session already gone — force clear local token
      await supabase.auth.signOut({ scope: 'local' });
      error = null;
    }
    
    if (!error) {
      navigate('/');
      toast({
        title: "Signed out",
        description: "You've been signed out successfully.",
        action: (
          <a href="/auth" className="text-sm font-medium underline underline-offset-4 hover:text-primary">
            Sign back in
          </a>
        )
      });
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('No user logged in') };

    const safeUpdates = filterProfileUpdates(updates);
    if (Object.keys(safeUpdates).length === 0) {
      const error = new Error('No permitted profile fields to update');
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }

    const { error } = await supabase
      .from('profiles')
      .update(safeUpdates)
      .eq('id', user.id);

    if (error) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      await fetchUserProfile(user.id, user);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully."
      });
    }

    return { error };
  };

  const setThemePreference = (theme: 'light' | 'dark') => {
    // 1. Apply DOM immediately
    applyDocumentThemePreference(theme);
    // 2. Optimistic local profile update so navigation effects don't snap back
    setProfile((prev) => (prev ? { ...prev, theme_preference: theme } : prev));
    // 3. Fire-and-forget persistence
    if (user) {
      void supabase
        .from('profiles')
        .update({ theme_preference: theme } as any)
        .eq('id', user.id)
        .then(({ error }) => {
          if (error) logger.warn('Failed to persist theme preference', error);
        });
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    pending2FA,
    pendingTwoFactor,
    signUp,
    signIn,
    completeTwoFactor,
    signOut,
    updateProfile,
    setThemePreference,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* Idle timeout warning modal - only shown for non-"Remember Me" sessions */}
      <IdleTimeoutWarning
        isOpen={showTimeoutWarning && isWarningShown}
        remainingTime={remainingTime}
        onExtend={() => {
          extendSession();
          setShowTimeoutWarning(false);
        }}
        onLogout={signOut}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
