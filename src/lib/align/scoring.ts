import type {
  AlignFunction,
  AlignResponse,
  OpportunityType,
  OrgProfile,
  UseCase,
  UseCaseScores,
  AlignReport,
  GovernanceRow,
} from "./types";
import { OPPORTUNITY_TO_MODE } from "./types";

// ---------- helpers ----------
const clamp = (n: number, lo = 1, hi = 5) => Math.max(lo, Math.min(hi, n));
const num = (v: unknown, fallback = 3): number => {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) ? clamp(n) : fallback;
};
const str = (v: unknown): string => (typeof v === "string" ? v : "");
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

// ---------- multi-respondent aggregation ----------
/**
 * Merge multiple respondent rows with the same (section, key, function_name) into one
 * deterministic answer_value. Rules:
 *   - numbers           -> mean rounded to nearest integer (1..5 scale preserved)
 *   - arrays            -> set union
 *   - booleans          -> OR
 *   - strings / other   -> longest non-empty (deterministic, no timestamp needed)
 */
export function aggregateResponses(responses: AlignResponse[]): AlignResponse[] {
  const groups = new Map<string, AlignResponse[]>();
  for (const r of responses) {
    const key = `${r.section}|${r.question_key}|${r.function_name ?? ""}`;
    const bucket = groups.get(key) ?? [];
    bucket.push(r);
    groups.set(key, bucket);
  }
  const out: AlignResponse[] = [];
  for (const bucket of groups.values()) {
    if (bucket.length === 1) { out.push(bucket[0]); continue; }
    const values = bucket.map((b) => b.answer_value);
    let merged: unknown;
    if (values.every((v) => typeof v === "number")) {
      const nums = values as number[];
      merged = Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
    } else if (values.some((v) => Array.isArray(v))) {
      const set = new Set<string>();
      for (const v of values) if (Array.isArray(v)) for (const x of v) set.add(String(x));
      merged = Array.from(set);
    } else if (values.every((v) => typeof v === "boolean")) {
      merged = (values as boolean[]).some(Boolean);
    } else {
      const strs = values.map((v) => (typeof v === "string" ? v : v == null ? "" : String(v)));
      merged = strs.reduce((best, cur) => (cur.length > best.length ? cur : best), "");
    }
    const first = bucket[0];
    out.push({
      section: first.section,
      question_key: first.question_key,
      function_name: first.function_name,
      answer_value: merged,
    });
  }
  return out;
}

function getResponse(
  responses: AlignResponse[],
  section: string,
  key: string,
  fn: string | null = null,
): unknown {
  return responses.find(
    (r) =>
      r.section === section &&
      r.question_key === key &&
      (r.function_name ?? null) === fn,
  )?.answer_value;
}

// ---------- function × opportunity examples ----------
const FUNCTION_EXAMPLES: Record<
  AlignFunction,
  Partial<Record<OpportunityType, { title: string; example: string; risks: string[]; internal: "internal" | "external" }>>
> = {
  "Executive Leadership": {
    decision: { title: "Executive briefing assistant", example: "Synthesize board briefs and decision memos from approved sources.", risks: ["Stale source documents"], internal: "internal" },
    knowledge: { title: "Strategy research copilot", example: "Surface internal strategy docs and prior decisions.", risks: ["Confidential data exposure"], internal: "internal" },
  },
  Operations: {
    consistency: { title: "Operations playbook assistant", example: "Standardize SOPs across sites.", risks: ["Operational drift if outdated"], internal: "internal" },
    capacity: { title: "Workflow summary assistant", example: "Summarize daily ops reports for leads.", risks: ["Over-reliance on summaries"], internal: "internal" },
  },
  Finance: {
    knowledge: { title: "Budget narrative drafter", example: "Draft variance explanations from approved figures.", risks: ["Material misstatement"], internal: "internal" },
    decision: { title: "Forecast support copilot", example: "Surface trend summaries for finance reviews.", risks: ["Regulated reporting"], internal: "internal" },
  },
  "HR / People": {
    knowledge: { title: "Policy & benefits Q&A assistant", example: "Answer staff questions from approved HR policies.", risks: ["Personnel decisions must stay human"], internal: "internal" },
    capacity: { title: "Onboarding companion", example: "Guide new hires through week-one tasks.", risks: ["PII handling"], internal: "internal" },
  },
  "Sales / Development": {
    capacity: { title: "Prospect research brief", example: "Compile background briefs for donor/customer meetings.", risks: ["Public-source accuracy"], internal: "internal" },
    knowledge: { title: "Proposal drafting assistant", example: "Draft proposals from approved templates.", risks: ["Brand voice drift"], internal: "internal" },
  },
  "Marketing / Communications": {
    capacity: { title: "Content repurposing assistant", example: "Reformat approved content across channels.", risks: ["Public-facing tone"], internal: "external" },
    consistency: { title: "Brand voice checker", example: "Flag deviations from brand guide on drafts.", risks: ["False positives"], internal: "internal" },
  },
  "Customer / Donor Service": {
    service: { title: "Suggested-response assistant", example: "Suggest reply drafts to common inquiries, human-sent.", risks: ["Sensitive cases"], internal: "internal" },
    knowledge: { title: "FAQ knowledge assistant", example: "Surface approved FAQ answers to agents.", risks: ["Out-of-date FAQs"], internal: "internal" },
  },
  "Legal / Compliance": {
    knowledge: { title: "Policy & contract search", example: "Search and summarize approved policy library.", risks: ["Legal interpretation must stay human"], internal: "internal" },
    consistency: { title: "Compliance checklist helper", example: "Walk teams through approval checklists.", risks: ["Regulated outputs"], internal: "internal" },
  },
  "IT / Data": {
    capacity: { title: "Ticket triage assistant", example: "Summarize and route inbound IT tickets.", risks: ["Access control"], internal: "internal" },
    knowledge: { title: "Internal docs assistant", example: "Answer system/access questions from runbooks.", risks: ["Stale docs"], internal: "internal" },
  },
  "Programs / Ministry Delivery": {
    knowledge: { title: "Program playbook assistant", example: "Surface approved program resources for field teams.", risks: ["Pastoral/clinical judgment must stay human"], internal: "internal" },
    consistency: { title: "Curriculum support assistant", example: "Help adapt approved curriculum across locations.", risks: ["Mission drift"], internal: "internal" },
  },
  Other: {
    knowledge: { title: "Internal knowledge assistant", example: "Make approved internal knowledge searchable.", risks: ["Source quality"], internal: "internal" },
  },
};

// ---------- core scoring ----------
const SENSITIVE_FUNCTIONS: AlignFunction[] = [
  "HR / People",
  "Legal / Compliance",
  "Finance",
  "Customer / Donor Service",
];

function computeScores(
  uc: Omit<UseCase, "scores">,
  opportunityAvg: number,
  responses: AlignResponse[],
): UseCaseScores {
  // pull readiness signals from G + I sections if present, else heuristic defaults
  const mission_value = num(getResponse(responses, "I", `mission_value:${uc.id}`), 4);
  const opportunity_value = num(getResponse(responses, "I", `opportunity_value:${uc.id}`), Math.round(clamp(opportunityAvg)));
  const frequency = num(getResponse(responses, "I", `frequency:${uc.id}`), 4);
  const data_readiness = num(getResponse(responses, "I", `data_readiness:${uc.id}`), 3);
  const workflow_clarity = num(getResponse(responses, "I", `workflow_clarity:${uc.id}`), 3);
  const risk_manageability = num(getResponse(responses, "I", `risk_manageability:${uc.id}`), uc.internal_external === "internal" ? 4 : 2);
  const pilot_feasibility = num(getResponse(responses, "I", `pilot_feasibility:${uc.id}`), 4);
  const adoption_likelihood = num(getResponse(responses, "I", `adoption_likelihood:${uc.id}`), 4);

  const readiness_score =
    mission_value +
    opportunity_value +
    frequency +
    data_readiness +
    workflow_clarity +
    risk_manageability +
    pilot_feasibility +
    adoption_likelihood;

  const opportunity_signal = Math.round(opportunityAvg * 4);

  let risk_penalty = 0;
  const externalFacing = uc.internal_external === "external";
  const sensitive = SENSITIVE_FUNCTIONS.includes(uc.function_name);
  if (externalFacing && sensitive) risk_penalty = 10;
  else if (externalFacing || sensitive) risk_penalty = 5;

  const priority_score = readiness_score + opportunity_signal - risk_penalty;

  let recommendation_label: UseCaseScores["recommendation_label"];
  if (readiness_score >= 34) recommendation_label = "Strong first pilot";
  else if (readiness_score >= 27) recommendation_label = "Address gaps before launch";
  else if (readiness_score >= 20) recommendation_label = "Track for later";
  else recommendation_label = "Do not prioritize now";

  return {
    mission_value,
    opportunity_value,
    frequency,
    data_readiness,
    workflow_clarity,
    risk_manageability,
    pilot_feasibility,
    adoption_likelihood,
    readiness_score,
    opportunity_signal,
    risk_penalty,
    priority_score,
    recommendation_label,
  };
}

// ---------- use-case generation ----------
export function generateUseCases(
  org: OrgProfile,
  responses: AlignResponse[],
): UseCase[] {
  responses = aggregateResponses(responses);
  const functions = (org.selected_functions ?? []) as AlignFunction[];
  if (functions.length === 0) return [];

  const candidates: UseCase[] = [];

  for (const fn of functions) {
    // pull L-section scores for this function, default 3
    const scores: Record<OpportunityType, number> = {
      capacity: num(getResponse(responses, "L", "capacity", fn)),
      knowledge: num(getResponse(responses, "L", "knowledge", fn)),
      service: num(getResponse(responses, "L", "service", fn)),
      consistency: num(getResponse(responses, "L", "consistency", fn)),
      decision: num(getResponse(responses, "L", "decision", fn)),
      growth: num(getResponse(responses, "L", "growth", fn)),
    };
    const avg =
      Object.values(scores).reduce((a, b) => a + b, 0) / 6;

    // pick top 2 opportunities for this function
    const ranked = (Object.entries(scores) as [OpportunityType, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);

    for (const [opp] of ranked) {
      const example = FUNCTION_EXAMPLES[fn]?.[opp];
      if (!example) continue;
      const id = `${fn}__${opp}`.replace(/[^a-zA-Z0-9_]/g, "_");
      const base: Omit<UseCase, "scores"> = {
        id,
        title: example.title,
        function_name: fn,
        opportunity_type: opp,
        ai_mode: OPPORTUNITY_TO_MODE[opp],
        problem_statement: example.example,
        beneficiary: fn,
        internal_external: example.internal,
        required_documents: ["Approved internal documents", "Current SOPs / policies"],
        risks: example.risks,
      };
      candidates.push({ ...base, scores: computeScores(base, avg, responses) });
    }
  }

  // de-dup by id, keep highest priority
  const byId = new Map<string, UseCase>();
  for (const c of candidates) {
    const prev = byId.get(c.id);
    if (!prev || c.scores.priority_score > prev.scores.priority_score) byId.set(c.id, c);
  }

  // ensure at least 5 by padding with knowledge-mode defaults if needed
  let result = Array.from(byId.values()).sort(
    (a, b) => b.scores.priority_score - a.scores.priority_score,
  );
  if (result.length < 5) {
    const padFns: AlignFunction[] = ["Other", "Operations", "Executive Leadership", "IT / Data"];
    for (const fn of padFns) {
      if (result.length >= 5) break;
      const ex = FUNCTION_EXAMPLES[fn]?.knowledge;
      if (!ex) continue;
      const id = `pad_${fn}_knowledge`.replace(/[^a-zA-Z0-9_]/g, "_");
      if (byId.has(id)) continue;
      const base: Omit<UseCase, "scores"> = {
        id,
        title: ex.title,
        function_name: fn,
        opportunity_type: "knowledge",
        ai_mode: "Knowledge Mode",
        problem_statement: ex.example,
        beneficiary: fn,
        internal_external: ex.internal,
        required_documents: ["Approved internal documents"],
        risks: ex.risks,
      };
      const uc: UseCase = { ...base, scores: computeScores(base, 3, responses) };
      byId.set(id, uc);
      result = Array.from(byId.values()).sort(
        (a, b) => b.scores.priority_score - a.scores.priority_score,
      );
    }
  }

  return result;
}

// ---------- pilot picker w/ risk gates ----------
export function pickPilot(useCases: UseCase[]): { pilot: UseCase | null; blocked_reason: string | null } {
  if (useCases.length === 0) return { pilot: null, blocked_reason: "No candidate use cases generated." };
  const eligible = useCases.filter(
    (u) =>
      u.internal_external === "internal" &&
      u.scores.risk_penalty === 0 &&
      u.scores.data_readiness >= 3 &&
      u.scores.workflow_clarity >= 3 &&
      u.scores.readiness_score >= 27,
  );
  if (eligible.length === 0) {
    return {
      pilot: null,
      blocked_reason:
        "No candidate passes the first-pilot risk gates (internal-facing, low-risk, ready data and workflow, readiness ≥ 27). Address gaps before launching.",
    };
  }
  eligible.sort((a, b) => b.scores.priority_score - a.scores.priority_score);
  return { pilot: eligible[0], blocked_reason: null };
}

// ---------- purpose statement ----------
export function buildPurposeStatement(org: OrgProfile): string {
  const name = org.organization_name?.trim() || "your organization";
  const goals = (org.strategic_priorities ?? []).filter(Boolean);
  const goalText = goals.length
    ? goals.slice(0, 3).join(", ")
    : "improving access to trusted knowledge, increasing staff capacity, and strengthening decision-making";
  return `AI should serve ${name} by ${goalText}, while protecting the human responsibility and relationships central to its mission.`;
}

// ---------- governance map ----------
export function buildGovernanceMap(_responses: AlignResponse[]): GovernanceRow[] {
  return [
    { domain: "Legal", ai_may_assist_with: "Summaries, clause identification, question organization", human_must_decide: "Legal interpretation, commitments, rights" },
    { domain: "Finance", ai_may_assist_with: "Analysis, trend summaries, draft explanations", human_must_decide: "Material financial decisions or approvals" },
    { domain: "HR", ai_may_assist_with: "Drafting, summarizing, explaining policies", human_must_decide: "Hiring, firing, promotion, discipline, compensation" },
    { domain: "Customer / Service", ai_may_assist_with: "Suggested responses, routing, basic answers", human_must_decide: "Sensitive, high-impact, relationship-critical cases" },
    { domain: "Operations", ai_may_assist_with: "Next-step recommendations, procedure summaries", human_must_decide: "Safety-critical or major operational decisions" },
    { domain: "Communications", ai_may_assist_with: "Drafting content, adapting tone, summarizing stories", human_must_decide: "Public release or official statements" },
    { domain: "Programs / Ministry", ai_may_assist_with: "Approved resources and guidance", human_must_decide: "Pastoral, moral, clinical, or relational judgment" },
  ];
}

// ---------- roadmap ----------
export const ROADMAP: AlignReport["roadmap"] = [
  { window: "Days 1–30", focus: "Discover and Decide", actions: ["Interview leaders", "Identify opportunities", "Inventory use cases", "Assess readiness", "Select first pilot"] },
  { window: "Days 31–60", focus: "Design the Pilot", actions: ["Define users", "Gather approved content", "Map workflow", "Set restrictions", "Train users"] },
  { window: "Days 61–90", focus: "Launch and Evaluate", actions: ["Launch with limited users", "Collect feedback", "Test accuracy", "Review risks", "Measure value", "Decide next step"] },
];

// ---------- full report ----------
export function buildReport(org: OrgProfile, responses: AlignResponse[]): AlignReport {
  responses = aggregateResponses(responses);
  const useCases = generateUseCases(org, responses);
  const top = useCases.slice(0, 5);
  const { pilot, blocked_reason } = pickPilot(useCases);

  const opportunity_map = (org.selected_functions ?? []).map((fn) => {
    const scores: Record<OpportunityType, number> = {
      capacity: num(getResponse(responses, "L", "capacity", fn)),
      knowledge: num(getResponse(responses, "L", "knowledge", fn)),
      service: num(getResponse(responses, "L", "service", fn)),
      consistency: num(getResponse(responses, "L", "consistency", fn)),
      decision: num(getResponse(responses, "L", "decision", fn)),
      growth: num(getResponse(responses, "L", "growth", fn)),
    };
    const [topOpp] = (Object.entries(scores) as [OpportunityType, number][]).sort(
      (a, b) => b[1] - a[1],
    );
    const ex = FUNCTION_EXAMPLES[fn]?.[topOpp[0]] ?? FUNCTION_EXAMPLES[fn]?.knowledge;
    return {
      function_name: fn,
      top_opportunity: topOpp[0],
      ai_mode: OPPORTUNITY_TO_MODE[topOpp[0]],
      beneficiary: fn,
      example: ex?.example ?? "Approved internal knowledge support.",
    };
  });

  let decision: AlignReport["decision"];
  if (pilot) decision = "move_to_pilot";
  else if (top[0]?.scores.recommendation_label === "Address gaps before launch") decision = "address_gaps";
  else if (top[0]?.scores.recommendation_label === "Track for later") decision = "track_later";
  else decision = "do_not_prioritize";

  return {
    purpose_statement: buildPurposeStatement(org),
    opportunity_map,
    top_use_cases: top,
    recommended_pilot: pilot,
    pilot_blocked_reason: blocked_reason,
    governance_map: buildGovernanceMap(responses),
    roadmap: ROADMAP,
    decision,
    generated_at: new Date().toISOString(),
  };
}