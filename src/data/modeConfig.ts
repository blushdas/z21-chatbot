
export interface Domain {
  id: string;
  label: string;
  subdomains?: string[];
}

export interface Pillar {
  id: string;
  label: string;
  domains: Domain[];
}

export interface Mode {
  id: string;
  label: string;
  tagline: string;
  description: string;
  tone: string;
  length?: string;
  useCases: string[];
  icon: string;
  pillars: Pillar[];
  available: boolean;
}

// Shared 3x3 pillar structure used across all modes
const sharedPillars: Pillar[] = [
  {
    id: "character",
    label: "Character",
    domains: [
      { id: "learning_growth", label: "Learning, Growth & Development" },
      { id: "strengths_styles", label: "Strengths, Styles & Stressors" },
      { id: "beliefs_biases", label: "Beliefs, Biases & Blind Spots" }
    ]
  },
  {
    id: "chemistry",
    label: "Chemistry",
    domains: [
      { id: "community_culture", label: "Community, Culture & Change" },
      { id: "trust_teamwork", label: "Trust, Transparency & Teamwork" },
      { id: "communication_conflict", label: "Communication, Collaboration & Conflict" }
    ]
  },
  {
    id: "competency",
    label: "Competency",
    domains: [
      { id: "discover_discern", label: "Discover, Discern & Decide" },
      { id: "time_talent", label: "Time, Talent & Treasure" },
      { id: "strategy_systems", label: "Strategy, Structure & Systems" }
    ]
  }
];

// Clean mode subdomains - simplified for single mode
const modeSubdomains = {
  coach: {}, // Single mode uses "coach" for backend compatibility
  advisor: {},
};

// Function to create mode with shared pillars and clean subdomains
const createMode = (modeData: Omit<Mode, 'pillars'>, modeId: keyof typeof modeSubdomains): Mode => {
  const pillarsWithSubdomains = sharedPillars.map(pillar => ({
    ...pillar,
    domains: pillar.domains.map(domain => ({
      ...domain,
      subdomains: [] // Clean - no predefined subdomains
    }))
  }));

  return {
    ...modeData,
    pillars: pillarsWithSubdomains
  };
};

// Single universal mode
export const modes: Mode[] = [
  createMode({
    id: "coach",
    label: "Daryle AI",
    tagline: "Learning from Daryle",
    description: "Daryle's wisdom, leadership insights, and authentic personality",
    tone: "wise_direct_insightful",
    length: "medium",
    useCases: ["Leadership development", "Strategic guidance", "Personal growth"],
    icon: "🌿",
    available: true
  }, "coach"),
  createMode({
    id: "advisor",
    label: "Advisor",
    tagline: "Bring a problem. Get practical guidance.",
    description: "A thinking partner for real problems, decisions, workplace challenges, and next steps. Diagnoses before recommending, surfaces tradeoffs honestly.",
    tone: "wise_direct_insightful",
    length: "medium",
    useCases: ["Decision support", "Leadership tradeoffs", "Conflict situations", "Strategic options"],
    icon: "🧭",
    available: true
  }, "advisor")
];

export const getModeById = (id: string): Mode | undefined => {
  return modes.find(mode => mode.id === id);
};

export const getSharedPillars = (): Pillar[] => {
  return sharedPillars;
};
