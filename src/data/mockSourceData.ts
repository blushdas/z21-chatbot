// Mock data for source references
export interface SourceData {
  id: string;
  title: string;
  type: "Internal Memo" | "PDF Document" | "Email" | "Talk Transcript" | "Leadership Guide" | "Foundational Letter" | "Transcript";
  date: string;
  tags: string[];
  excerpt: string;
  mode?: string;
  url?: string; // Add optional url property
}

// Test source for UI testing
export const testSource: SourceData = {
  id: "test-source-7-habits",
  title: "The 7 Habits of Highly Effective People",
  type: "PDF Document",
  date: "1989",
  tags: [
    "The 7 Habits of Highly Effective People",
    "Assessments"
  ],
  url: "/documents/7-habits.pdf",
  excerpt: `"Seek first to understand, then to be understood." — Stephen Covey`
};

export const mockSources: Record<string, SourceData> = {
  "test-source-7-habits": testSource,
  "leadership-principles": {
    id: "leadership-principles",
    title: "Leadership Principles, 2018",
    type: "Leadership Guide",
    date: "March 15, 2018",
    tags: ["Leadership", "Coaching", "Development"],
    excerpt: `"Leadership is first about character before competence. When we approach development, we recognize that who a person is matters more than what they know. Effective leaders demonstrate a balance of confidence and humility, making decisions with conviction while remaining open to input and feedback from others."`
  },
  "project-smart": {
    id: "project-smart",
    title: "Project SMART Framework - Strategic Thinking",
    type: "Internal Memo",
    date: "January 24, 2024",
    tags: ["Strategy", "Decision-Making", "SMART"],
    excerpt: `"Strategic thinking begins with the end in mind, but not merely the end we want — the end that reflects a higher responsibility to truth and others. Stewardship, in this context, is not about control but about custodianship."`
  },
  "family-legacy": {
    id: "family-legacy",
    title: "Family Legacy Framework",
    type: "PDF Document", 
    date: "June 10, 2020",
    tags: ["Family", "Legacy", "Values"],
    excerpt: `"A family's greatest asset is not its financial portfolio but its shared values and vision. When we talk about legacy planning, we're really discussing the intentional transfer of wisdom, not just wealth."`
  },
  "investment-philosophy": {
    id: "investment-philosophy",
    title: "Investment Philosophy, 2022",
    type: "Internal Memo",
    date: "November 3, 2022", 
    tags: ["Investor", "Strategy", "Value"],
    excerpt: `"Our investment approach is guided by the fundamental belief that true returns are measured in more than financial metrics. We seek opportunities where we can provide relational, not just financial, capital."`
  },
  "ambassador-handbook": {
    id: "ambassador-handbook",
    title: "Ambassador Handbook, 2023",
    type: "Leadership Guide",
    date: "August 17, 2023",
    tags: ["Ambassador", "Representation", "Mission"],
    excerpt: `"Being an ambassador means embodying the values and mission you represent, not just communicating them. Your presence should make those values tangible and attractive to others."`
  },
  "learning-times": {
    id: "learning-times",
    title: "Learning Times – Conflict Resolution Session",
    type: "Transcript",
    date: "October 8, 2022",
    tags: ["Conflict", "Chemistry", "Communication"],
    excerpt: `"When tension rises, we pause and return to shared values. Chemistry is not about always agreeing — it's about mutual care even when perspectives differ. The most important skill in conflict resolution is not persuasion but listening."`
  },
  "legacy-letter": {
    id: "legacy-letter",
    title: "Daryle's Legacy Letter – Performance Philosophy",
    type: "Foundational Letter",
    date: "June 1, 2021",
    tags: ["Competency", "Faith", "Excellence"],
    excerpt: `"Competency is not the same as knowledge. It is the ability to deliver with integrity over time. That's legacy in action. We pursue excellence not to prove our worth but because excellence honors others and reflects our values."`
  }
};

// Function to get source data based on citation text
export const getSourceDataFromCitation = (citation: string): SourceData | null => {
  if (!citation) return null;
  
  // Extract key identifiers from citation string
  const lowerCitation = citation.toLowerCase();
  
  if (lowerCitation.includes("leadership principles")) {
    return mockSources["leadership-principles"];
  }
  
  if (lowerCitation.includes("project smart")) {
    return mockSources["project-smart"];
  }
  
  if (lowerCitation.includes("family legacy")) {
    return mockSources["family-legacy"];
  }
  
  if (lowerCitation.includes("investment philosophy")) {
    return mockSources["investment-philosophy"];
  }
  
  if (lowerCitation.includes("ambassador handbook")) {
    return mockSources["ambassador-handbook"];
  }
  
  if (lowerCitation.includes("learning times") || lowerCitation.includes("conflict resolution")) {
    return mockSources["learning-times"];
  }
  
  if (lowerCitation.includes("legacy letter") || lowerCitation.includes("performance philosophy")) {
    return mockSources["legacy-letter"];
  }
  
  // Default source if no match found
  const sourceId = Object.keys(mockSources)[Math.floor(Math.random() * Object.keys(mockSources).length)];
  return mockSources[sourceId];
};

// Function to get multiple random sources for testing
export const getMultipleRandomSources = (count: number = 2): SourceData[] => {
  const sourceIds = Object.keys(mockSources);
  const selectedSources: SourceData[] = [];
  
  // Get unique random sources
  while (selectedSources.length < count && selectedSources.length < sourceIds.length) {
    const randomIndex = Math.floor(Math.random() * sourceIds.length);
    const sourceId = sourceIds[randomIndex];
    const source = mockSources[sourceId];
    
    // Only add if not already selected
    if (!selectedSources.some(s => s.id === source.id)) {
      selectedSources.push(source);
    }
  }
  
  return selectedSources;
};

// Function to get sources by their ids
export const getSourcesById = (sourceIds: string[]): SourceData[] => {
  return sourceIds
    .map(id => mockSources[id])
    .filter((source): source is SourceData => source !== undefined);
};
