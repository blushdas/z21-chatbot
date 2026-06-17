
import { ChatMode } from "@/types/chat";

export interface MockUserProfile {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatarUrl?: string;
  role: MockUserRole;
  joinedDate: Date;
  preferences: {
    defaultMode: ChatMode;
    defaultTone: string;
  };
  accessLevels: {
    [key in ChatMode]?: boolean;
  };
}

export type MockUserRole = "Team Member" | "Executive" | "Family" | "Public Guest" | "Admin";

// Mock user profile data
export const mockUserProfile: MockUserProfile = {
  id: "usr_123456789",
  name: "Alex Johnson",
  email: "alex@example.com",
  initials: "AJ",
  role: "Team Member",
  joinedDate: new Date(2023, 9, 15),
  preferences: {
    defaultMode: "coach",
    defaultTone: "warm_reflective",
  },
  accessLevels: {
    "coach": true
  }
};

// Map tones to readable names
export const toneDisplayNames: Record<string, string> = {
  "wise_direct": "Wise & Direct",
  "warm_reflective": "Warm & Reflective",
  "visionary_strategic": "Visionary & Strategic",
  "anchored_mission": "Anchored & Mission-Driven"
};

// Map modes to readable names and icons
export const modeDisplayInfo: Record<ChatMode, {name: string, icon: string}> = {
  "coach": {name: "Daryle AI", icon: "🌿"},
  "advisor": {name: "Advisor", icon: "🧭"}
};
