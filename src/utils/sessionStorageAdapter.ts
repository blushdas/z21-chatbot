/**
 * Custom session storage adapter for Supabase auth
 * Routes session data to localStorage (persistent) or sessionStorage (temporary)
 * based on user's "Remember Me" preference
 */

export const REMEMBER_ME_KEY = 'daryle_remember_me';

/**
 * Get the current "Remember Me" preference
 */
export const getRememberMePreference = (): boolean => {
  return localStorage.getItem(REMEMBER_ME_KEY) !== 'false';
};

/**
 * Set the "Remember Me" preference
 * This should be called BEFORE signIn to ensure the storage adapter uses the correct storage
 */
export const setRememberMePreference = (remember: boolean): void => {
  if (remember) {
    localStorage.removeItem(REMEMBER_ME_KEY); // default = remembered, no key needed
  } else {
    localStorage.setItem(REMEMBER_ME_KEY, 'false'); // explicit opt-out
  }
};

/**
 * Clear session from both storage types (used on sign out)
 */
export const clearRememberMePreference = (): void => {
  localStorage.removeItem(REMEMBER_ME_KEY);
};

/**
 * Create a custom storage adapter for Supabase auth
 * This adapter routes session data based on the "Remember Me" preference
 */
export const createSessionStorage = () => ({
  getItem: (key: string): string | null => {
    // Always check localStorage first (for remembered sessions or migrated sessions)
    const localValue = localStorage.getItem(key);
    if (localValue) return localValue;
    
    // Fall back to sessionStorage (for temporary sessions)
    return sessionStorage.getItem(key);
  },
  
  setItem: (key: string, value: string): void => {
    const rememberMe = getRememberMePreference();
    
    if (rememberMe) {
      // Persist to localStorage and clean up sessionStorage
      localStorage.setItem(key, value);
      sessionStorage.removeItem(key);
    } else {
      // Store in sessionStorage (temporary) and clean up localStorage auth keys
      sessionStorage.setItem(key, value);
      // Only remove auth-related keys from localStorage, not the preference key
      if (key.includes('supabase') || key.includes('auth')) {
        localStorage.removeItem(key);
      }
    }
  },
  
  removeItem: (key: string): void => {
    // Clean up from both storage types
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
});
