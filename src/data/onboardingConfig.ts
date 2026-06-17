import { ChatMode } from "@/components/ChatInterface";
import { modes } from "./modeConfig";

export interface ModeConfig {
  id: ChatMode;
  name: string;
  description: string;
  icon: string;
  available: boolean;
}

export interface ToneConfig {
  id: string;
  name: string;
  description: string;
}

export interface LengthConfig {
  id: string;
  name: string;
  description: string;
}

export const onboardingConfig = {
  welcome: {
    title: "Welcome to Daryle AI",
    description: "A mentorship experience shaped by decades of wisdom, values, and vision.",
  },
  
  modeSelection: {
    title: "How can Daryle help today?",
    description: "Select the mode that matches your goal.",
  },
  
  toneSelection: {
    title: "Choose Daryle's Voice",
    description: "How would you like responses to sound?",
  },
  
  lengthSelection: {
    title: "Response Length Preference",
    description: "How detailed would you like Daryle's responses to be?",
  },
  
  consent: {
    title: "A Quick Word Before You Begin",
    description: "Daryle AI responses are drawn from the writings, talks, and values of Daryle Doden. While every answer aims to reflect his voice and wisdom, this tool is meant to guide, not replace, human discernment. Are you ready to begin?",
    checkboxes: {
      understand: "I understand that responses are synthesized from archived content.",
      respectful: "I agree to use this tool respectfully and thoughtfully.",
    },
  },
  
  // Convert modes from modeConfig to onboarding format with availability
  modes: modes.map(mode => ({
    id: mode.id,
    name: mode.label,
    description: mode.description,
    icon: mode.icon,
    available: mode.available,
  })),
  
  tones: [
    {
      id: "wise_direct",
      name: "Wise & Direct",
      description: "Clear guidance with straightforward wisdom",
    },
    {
      id: "warm_reflective",
      name: "Warm & Reflective", 
      description: "Thoughtful insights with personal connection",
    },
    {
      id: "visionary_strategic",
      name: "Visionary & Strategic",
      description: "Forward-looking with big-picture perspective",
    },
    {
      id: "anchored_mission",
      name: "Anchored & Mission-Driven",
      description: "Principled guidance focused on core values",
    },
    {
      id: "insightful_direct_encouraging",
      name: "Insightful & Encouraging",
      description: "Direct wisdom with encouraging support",
    },
    {
      id: "visionary_concise", 
      name: "Visionary & Concise",
      description: "Big-picture insights in focused responses",
    },
    {
      id: "warm_clear_purposeful",
      name: "Warm & Purposeful",
      description: "Clear guidance with warm intention",
    },
    {
      id: "humble_devotional_meditative",
      name: "Humble & Meditative", 
      description: "Thoughtful spiritual reflection and guidance",
    },
    {
      id: "warm_reflective_conversational",
      name: "Warm & Conversational",
      description: "Personal, story-driven insights",
    },
  ],
  
  lengths: [
    {
      id: "short",
      name: "Short",
      description: "1-2 sentence summary responses",
    },
    {
      id: "medium", 
      name: "Medium",
      description: "2-3 paragraph balanced responses",
    },
    {
      id: "long",
      name: "Long",
      description: "In-depth responses with examples",
    },
    {
      id: "detailed",
      name: "Daryle Long",
      description: "Multi-paragraph, story-driven insights",
    },
  ],
  
  // Map default tones for each mode based on the mode configuration
  toneMappings: {
    coach: [
      {
        id: "insightful_direct_encouraging",
        name: "Insightful & Encouraging",
        description: "Direct wisdom with encouraging support",
      },
      {
        id: "anchored_mission",
        name: "Anchored & Mission-Driven",
        description: "Principled guidance focused on core values",
      },
    ],
    advisor: [
      {
        id: "wise_direct",
        name: "Wise & Direct",
        description: "Clear guidance with straightforward wisdom",
      },
      {
        id: "anchored_mission",
        name: "Anchored & Mission-Driven",
        description: "Principled guidance focused on core values",
      },
    ],
    family: [
      {
        id: "warm_reflective_conversational",
        name: "Warm & Conversational", 
        description: "Personal, story-driven insights",
      },
      {
        id: "warm_reflective",
        name: "Warm & Reflective",
        description: "Thoughtful insights with personal connection",
      },
    ],
    investor: [
      {
        id: "visionary_concise",
        name: "Visionary & Concise",
        description: "Big-picture insights in focused responses",
      },
      {
        id: "visionary_strategic",
        name: "Visionary & Strategic", 
        description: "Forward-looking with big-picture perspective",
      },
    ],
    ambassador: [
      {
        id: "warm_clear_purposeful",
        name: "Warm & Purposeful",
        description: "Clear guidance with warm intention",
      },
      {
        id: "anchored_mission",
        name: "Anchored & Mission-Driven",
        description: "Principled guidance focused on core values",
      },
    ],
    faith: [
      {
        id: "humble_devotional_meditative",
        name: "Humble & Meditative",
        description: "Thoughtful spiritual reflection and guidance",
      },
      {
        id: "warm_reflective",
        name: "Warm & Reflective",
        description: "Thoughtful insights with personal connection",
      },
    ],
  },
};
