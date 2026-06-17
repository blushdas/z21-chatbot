

// src/types/user.ts
export type UserRole = "user" | "admin" | "superadmin";

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
  suspended?: boolean;
  email_verified?: boolean;
  email_confirmed_at?: string | null;
}

