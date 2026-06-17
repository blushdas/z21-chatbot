import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAlignSession } from "@/hooks/useAlignSession";
import { SectionNav } from "@/components/align/SectionNav";
import { RatingRow } from "@/components/align/RatingRow";
import { RespondentsPanel } from "@/components/align/RespondentsPanel";
import { buildReport } from "@/lib/align/scoring";
import type { AlignFunction, AlignSection, OpportunityType } from "@/lib/align/types";
import { track } from "@/lib/analytics";
import { AlignShell } from "@/components/align/AlignShell";

const OPPORTUNITIES: { key: OpportunityType; label: string; hint: string }[] = [
  { key: "capacity", label: "Capacity", hint: "Are people stretched thin or delayed by routine work?" },
  { key: "knowledge", label: "Knowledge", hint: "Is important knowledge hard to find or inconsistently used?" },
  { key: "service", label: "Service", hint: "Do stakeholders need faster or more consistent support?" },
  { key: "consistency", label: "Consistency", hint: "Does quality, language, or process vary across teams?" },
  { key: "decision", label: "Decision support", hint: "Do leaders need faster synthesis before decisions?" },
  { key: "growth", label: "Growth", hint: "Is the organization scaling and at risk of losing mission or culture?" },
];

const HUMAN_ONLY = [
  "Hiring/firing",
  "Compensation",
  "Legal commitments",
  "Financial approvals",
  "Pastoral/relational care",
  "Clinical care",
  "Public statements",
  "Strategy/mission decisions",
];

type Step = "profile" | AlignSection | "review";

export default function AlignSessionPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { session, loading, error, upsertResponse, saveReport, getAnswer } = useAlignSession(token);
  const [step, setStep] = useState<Step>("A");
  const [submitting, setSubmitting] = useState(false);

  const functions = (session?.org_profile.selected_functions ?? []) as AlignFunction[];

  const stepOrder: Step[] = useMemo(() => ["A", "L", "I", "G", "N", "review"], []);
  const next = () => {
    const idx = stepOrder.indexOf(step);
    if (idx >= 0 && idx < stepOrder.length - 1) setStep(stepOrder[idx + 1]);
  };
  const prev = () => {
    const idx = stepOrder.indexOf(step);
    if (idx > 0) setStep(stepOrder[idx - 1]);
  };

  const finish = async () => {
    if (!session) return;
    setSubmitting(true);
    const report = buildReport(session.org_profile, session.responses);
    await saveReport(report);
    track({ event_name: "align_report_generated", category: "align", properties: { token } });
    setSubmitting(false);
    navigate(`/align/s/${token}/report`);
  };

  if (loading && !session) {
    return <div className="min-h-screen grid place-items-center bg-brand-offwhite text-muted-foreground">Loading…</div>;
  }
  if (error || !session) {
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center bg-brand-offwhite">
        <div>
          <p className="text-destructive">{error ?? "Session not found"}</p>
          <Button className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => navigate("/align")}>Back to ALIGN</Button>
        </div>
      </div>
    );
  }

  const a = (k: string) => (getAnswer("A", k) as string) ?? "";
  const g = (k: string) => (getAnswer("G", k) as string) ?? "";
  const n = (k: string) => (getAnswer("N", k) as string) ?? "";

  const orgName = (session.org_profile as { organization_name?: string })?.organization_name;

  return (
    <AlignShell
      compact
      eyebrow="ALIGN Discovery"
      title={orgName || "Discovery Session"}
      subtitle="Your responses save automatically as you go."
      maxWidth="3xl"
      heroExtra={<SectionNav current={step === "review" ? "N" : step} onJump={(k) => setStep(k as Step)} />}
    >
        {step === "A" && (
          <Card className="border-border/60 shadow-sm">
            <CardHeader><CardTitle className="text-primary">A · Anchor in Purpose</CardTitle></CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-2">
                <Label>What should AI help your organization do faster, better, or more consistently?</Label>
                <Textarea rows={4} defaultValue={a("ai_helps_with")} onBlur={(e) => upsertResponse("A", "ai_helps_with", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Which decisions must always remain human?</Label>
                <div className="grid md:grid-cols-2 gap-2">
                  {HUMAN_ONLY.map((d) => {
                    const list = (getAnswer("A", "human_only") as string[]) ?? [];
                    const checked = list.includes(d);
                    return (
                      <label key={d} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => {
                            const set = new Set(list);
                            if (v) set.add(d); else set.delete(d);
                            upsertResponse("A", "human_only", Array.from(set));
                          }}
                        />
                        {d}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>What would responsible AI adoption look like in your organization?</Label>
                <Textarea rows={3} defaultValue={a("responsible_adoption")} onBlur={(e) => upsertResponse("A", "responsible_adoption", e.target.value)} />
              </div>
            </CardContent>
          </Card>
        )}

        {step === "L" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              For each function you selected, rate where AI could create the most value (1 = no need, 5 = urgent).
            </p>
            {functions.length === 0 && (
              <Card className="border-border/60 shadow-sm"><CardContent className="py-6 text-sm text-muted-foreground">No functions selected. Go back to the start screen to add some.</CardContent></Card>
            )}
            {functions.map((fn) => (
              <Card key={fn} className="border-border/60 shadow-sm">
                <CardHeader><CardTitle className="text-lg text-primary">{fn}</CardTitle></CardHeader>
                <CardContent>
                  {OPPORTUNITIES.map((o) => (
                    <RatingRow
                      key={o.key}
                      label={o.label}
                      hint={o.hint}
                      value={getAnswer("L", o.key, fn) as number | undefined}
                      onChange={(v) => upsertResponse("L", o.key, v, fn)}
                    />
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {step === "I" && (
          <Card className="border-border/60 shadow-sm">
            <CardHeader><CardTitle className="text-primary">I · Identify Readiness</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Rate your organization overall on each readiness dimension (1 = not at all, 5 = fully ready).
              </p>
              {[
                { k: "leadership_alignment", l: "Leadership alignment", h: "Is there executive alignment on why AI matters?" },
                { k: "workflow_clarity", l: "Workflow clarity", h: "Are processes clear enough for AI to support?" },
                { k: "data_readiness", l: "Data / knowledge readiness", h: "Are the right documents current, approved, accessible?" },
                { k: "technology", l: "Technology readiness", h: "Can AI securely connect to your tools or content?" },
                { k: "governance", l: "Governance clarity", h: "Do you know what AI may access, say, recommend, and not do?" },
                { k: "adoption", l: "Adoption likelihood", h: "Will intended users trust and actually use it?" },
              ].map((r) => (
                <RatingRow
                  key={r.k}
                  label={r.l}
                  hint={r.h}
                  value={getAnswer("I", r.k) as number | undefined}
                  onChange={(v) => upsertResponse("I", r.k, v)}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {step === "G" && (
          <Card className="border-border/60 shadow-sm">
            <CardHeader><CardTitle className="text-primary">G · Guard Trust</CardTitle></CardHeader>
            <CardContent className="grid gap-5">
              {[
                { k: "never_access", l: "What information should AI never access or process?" },
                { k: "never_decide", l: "What decisions should AI never make, even with good data?" },
                { k: "approval_required", l: "What outputs require human review before action or distribution?" },
                { k: "accountability", l: "Who is accountable for AI-assisted decisions?" },
                { k: "transparency", l: "How will users know when AI is being used?" },
                { k: "kill_switch", l: "Under what conditions should the system be paused or disabled?" },
              ].map((q) => (
                <div key={q.k} className="grid gap-2">
                  <Label>{q.l}</Label>
                  <Textarea rows={2} defaultValue={g(q.k)} onBlur={(e) => upsertResponse("G", q.k, e.target.value)} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {step === "N" && (
          <Card className="border-border/60 shadow-sm">
            <CardHeader><CardTitle className="text-primary">N · Navigate the Roadmap</CardTitle></CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-2">
                <Label>Who would own the first pilot?</Label>
                <Textarea rows={2} defaultValue={n("pilot_owner")} onBlur={(e) => upsertResponse("N", "pilot_owner", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>What would success look like in 60–90 days?</Label>
                <Textarea rows={2} defaultValue={n("success_criteria")} onBlur={(e) => upsertResponse("N", "success_criteria", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>What risks would cause you to pause?</Label>
                <Textarea rows={2} defaultValue={n("pause_risks")} onBlur={(e) => upsertResponse("N", "pause_risks", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>What is the decision today?</Label>
                <RadioGroup
                  value={n("decision")}
                  onValueChange={(v) => upsertResponse("N", "decision", v)}
                  className="grid gap-2"
                >
                  {[
                    ["move_to_pilot", "Move to pilot design"],
                    ["address_gaps", "Address gaps first"],
                    ["track_later", "Track for later"],
                    ["do_not_prioritize", "Do not prioritize now"],
                  ].map(([v, l]) => (
                    <label key={v} className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value={v} id={`dec-${v}`} />
                      <span>{l}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "review" && (
          <Card className="border-accent/40 bg-accent/5 shadow-sm">
            <CardHeader><CardTitle className="text-primary">Ready to generate report</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The report combines your responses with deterministic readiness scoring, applies risk gates, and recommends
                a first pilot only if it passes the criteria.
              </p>
              <Button size="lg" onClick={finish} disabled={submitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {submitting ? "Generating…" : "Generate report"}
              </Button>
            </CardContent>
          </Card>
        )}

        {token && <RespondentsPanel sessionToken={token} />}

        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" onClick={prev} disabled={stepOrder.indexOf(step) === 0}>Back</Button>
          {step === "review" ? null : (
            <Button
              onClick={step === "N" ? () => setStep("review") : next}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {step === "N" ? "Review" : "Next"}
            </Button>
          )}
        </div>
    </AlignShell>
  );
}