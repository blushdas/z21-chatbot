export type AlignSection = "A" | "L" | "I" | "G" | "N";

export type AlignFunction =
  | "Executive Leadership"
  | "Operations"
  | "Finance"
  | "HR / People"
  | "Sales / Development"
  | "Marketing / Communications"
  | "Customer / Donor Service"
  | "Legal / Compliance"
  | "IT / Data"
  | "Programs / Ministry Delivery"
  | "Other";

export type OpportunityType =
  | "capacity"
  | "knowledge"
  | "service"
  | "consistency"
  | "decision"
  | "growth";

export type AIMode =
  | "Execution Mode"
  | "Knowledge Mode"
  | "Service Mode"
  | "Standards Mode"
  | "Advisory Mode"
  | "Mission Mode";

export const OPPORTUNITY_TO_MODE: Record<OpportunityType, AIMode> = {
  capacity: "Execution Mode",
  knowledge: "Knowledge Mode",
  service: "Service Mode",
  consistency: "Standards Mode",
  decision: "Advisory Mode",
  growth: "Mission Mode",
};

export const ALIGN_FUNCTIONS: AlignFunction[] = [
  "Executive Leadership",
  "Operations",
  "Finance",
  "HR / People",
  "Sales / Development",
  "Marketing / Communications",
  "Customer / Donor Service",
  "Legal / Compliance",
  "IT / Data",
  "Programs / Ministry Delivery",
  "Other",
];

export interface OrgProfile {
  organization_name?: string;
  organization_type?: string;
  employee_count?: string;
  mission?: string;
  strategic_priorities?: string[];
  selected_functions?: AlignFunction[];
  session_type?: "self_guided" | "facilitated";
}

export interface AlignResponse {
  section: AlignSection;
  question_key: string;
  function_name: string | null;
  answer_value: unknown;
}

export interface AlignSession {
  id: string;
  token: string;
  status: "draft" | "submitted" | "reported";
  org_profile: OrgProfile;
  email: string | null;
  responses: AlignResponse[];
  report: AlignReport | null;
}

export interface UseCaseScores {
  mission_value: number;
  opportunity_value: number;
  frequency: number;
  data_readiness: number;
  workflow_clarity: number;
  risk_manageability: number;
  pilot_feasibility: number;
  adoption_likelihood: number;
  readiness_score: number;
  opportunity_signal: number;
  risk_penalty: number;
  priority_score: number;
  recommendation_label:
    | "Strong first pilot"
    | "Address gaps before launch"
    | "Track for later"
    | "Do not prioritize now";
}

export interface UseCase {
  id: string;
  title: string;
  function_name: AlignFunction;
  opportunity_type: OpportunityType;
  ai_mode: AIMode;
  problem_statement: string;
  beneficiary: string;
  internal_external: "internal" | "external";
  required_documents: string[];
  risks: string[];
  scores: UseCaseScores;
}

export interface GovernanceRow {
  domain: string;
  ai_may_assist_with: string;
  human_must_decide: string;
}

export interface AlignReport {
  purpose_statement: string;
  opportunity_map: Array<{
    function_name: AlignFunction;
    top_opportunity: OpportunityType;
    ai_mode: AIMode;
    beneficiary: string;
    example: string;
  }>;
  top_use_cases: UseCase[];
  recommended_pilot: UseCase | null;
  pilot_blocked_reason: string | null;
  governance_map: GovernanceRow[];
  roadmap: Array<{ window: string; focus: string; actions: string[] }>;
  decision: "move_to_pilot" | "address_gaps" | "track_later" | "do_not_prioritize";
  generated_at: string;
  synthesis?: AlignSynthesis;
}

export interface AlignSynthesis {
  purpose_statement: string;
  executive_narrative: string;
  pilot_brief: string;
  governance_notes: string[];
  risks_and_watchouts: string[];
  next_questions: string[];
  model: string;
  generated_at: string;
}