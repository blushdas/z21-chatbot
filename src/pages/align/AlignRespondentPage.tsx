import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAlignRespondent } from "@/hooks/useAlignRespondent";
import { RatingRow } from "@/components/align/RatingRow";
import { SectionNav } from "@/components/align/SectionNav";
import type { AlignFunction, AlignSection, OpportunityType, OrgProfile } from "@/lib/align/types";
import { track } from "@/lib/analytics";
import { AlignShell } from "@/components/align/AlignShell";

const OPPORTUNITIES: { key: OpportunityType; label: string; hint: string }[] = [
  { key: "capacity", label: "Capacity", hint: "Are people stretched thin or delayed by routine work?" },
  { key: "knowledge", label: "Knowledge", hint: "Is important knowledge hard to find or inconsistently used?" },
  { key: "service", label: "Service", hint: "Do stakeholders need faster or more consistent support?" },
  { key: "consistency", label: "Consistency", hint: "Does quality, language, or process vary across teams?" },
  { key: "decision", label: "Decision support", hint: "Do leaders need faster synthesis before decisions?" },
  { key: "growth", label: "Growth", hint: "Is the org scaling and at risk of losing mission or culture?" },
];

const HUMAN_ONLY = [
  "Hiring/firing", "Compensation", "Legal commitments", "Financial approvals",
  "Pastoral/relational care", "Clinical care", "Public statements", "Strategy/mission decisions",
];

export default function AlignRespondentPage() {
  const { token } = useParams<{ token: string }>();
  const { bundle, loading, error, upsertResponse, getAnswer } = useAlignRespondent(token);

  const assigned = bundle?.respondent.sections ?? [];
  const [step, setStep] = useState<AlignSection | null>(null);

  useEffect(() => {
    if (bundle) track({ event_name: "align_respondent_started", category: "align" });
  }, [bundle]);

  const current: AlignSection | null = useMemo(() => {
    if (!assigned.length) return null;
    if (step && assigned.includes(step)) return step;
    return assigned[0];
  }, [step, assigned]);

  if (loading && !bundle) {
    return <div className="min-h-screen grid place-items-center bg-brand-offwhite text-muted-foreground">Loading…</div>;
  }
  if (error || !bundle) {
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center bg-brand-offwhite">
        <p className="text-destructive">{error ?? "Invite not found"}</p>
      </div>
    );
  }

  const org = bundle.session.org_profile as OrgProfile;
  const orgName = org?.organization_name || "the organization";
  const functions = (org?.selected_functions ?? []) as AlignFunction[];

  const a = (k: string) => (getAnswer("A", k) as string) ?? "";
  const g = (k: string) => (getAnswer("G", k) as string) ?? "";
  const n = (k: string) => (getAnswer("N", k) as string) ?? "";

  return (
    <AlignShell
      compact
      eyebrow="ALIGN Discovery — Respondent"
      title={orgName}
      subtitle={`Welcome${bundle.respondent.name ? `, ${bundle.respondent.name}` : ""}. Your answers save automatically.`}
      maxWidth="3xl"
      heroExtra={
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-1 flex-wrap">
            {assigned.map((s) => (
              <Badge
                key={s}
                variant={s === current ? "default" : "outline"}
                className={`cursor-pointer ${s === current ? "bg-accent text-primary hover:bg-accent/90" : "border-white/40 text-white hover:bg-white/10"}`}
                onClick={() => setStep(s)}
              >
                Section {s}
              </Badge>
            ))}
          </div>
          {current && (
            <SectionNav
              current={current}
              onJump={(k) => { if (k !== "profile" && assigned.includes(k)) setStep(k); }}
            />
          )}
        </div>
      }
    >
        {!current && <p className="text-sm text-muted-foreground">No sections assigned to you.</p>}

        {current === "A" && (
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
                <Label>What would responsible AI adoption look like?</Label>
                <Textarea rows={3} defaultValue={a("responsible_adoption")} onBlur={(e) => upsertResponse("A", "responsible_adoption", e.target.value)} />
              </div>
            </CardContent>
          </Card>
        )}

        {current === "L" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Rate where AI could create the most value (1 = no need, 5 = urgent) for each function.</p>
            {functions.length === 0 && (
              <Card className="border-border/60 shadow-sm"><CardContent className="py-6 text-sm text-muted-foreground">No functions selected by the facilitator yet.</CardContent></Card>
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

        {current === "I" && (
          <Card className="border-border/60 shadow-sm">
            <CardHeader><CardTitle className="text-primary">I · Identify Readiness</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Rate the organization overall (1 = not at all, 5 = fully ready).</p>
              {[
                { k: "leadership_alignment", l: "Leadership alignment", h: "Is there executive alignment on why AI matters?" },
                { k: "workflow_clarity", l: "Workflow clarity", h: "Are processes clear enough for AI to support?" },
                { k: "data_readiness", l: "Data / knowledge readiness", h: "Are the right documents current and accessible?" },
                { k: "technology", l: "Technology readiness", h: "Can AI securely connect to your tools or content?" },
                { k: "governance", l: "Governance clarity", h: "Do you know what AI may access and not do?" },
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

        {current === "G" && (
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

        {current === "N" && (
          <Card className="border-border/60 shadow-sm">
            <CardHeader><CardTitle className="text-primary">N · Navigate the Roadmap</CardTitle></CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-2"><Label>Who would own the first pilot?</Label>
                <Textarea rows={2} defaultValue={n("pilot_owner")} onBlur={(e) => upsertResponse("N", "pilot_owner", e.target.value)} />
              </div>
              <div className="grid gap-2"><Label>What would success look like in 60–90 days?</Label>
                <Textarea rows={2} defaultValue={n("success_criteria")} onBlur={(e) => upsertResponse("N", "success_criteria", e.target.value)} />
              </div>
              <div className="grid gap-2"><Label>What risks would cause you to pause?</Label>
                <Textarea rows={2} defaultValue={n("pause_risks")} onBlur={(e) => upsertResponse("N", "pause_risks", e.target.value)} />
              </div>
              <div className="grid gap-2"><Label>What is the decision today?</Label>
                <RadioGroup value={n("decision")} onValueChange={(v) => upsertResponse("N", "decision", v)} className="grid gap-2">
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

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            disabled={!current || assigned.indexOf(current) === 0}
            onClick={() => { if (current) { const i = assigned.indexOf(current); if (i > 0) setStep(assigned[i - 1]); } }}
          >Back</Button>
          <Button
            disabled={!current || assigned.indexOf(current) === assigned.length - 1}
            onClick={() => { if (current) { const i = assigned.indexOf(current); if (i < assigned.length - 1) setStep(assigned[i + 1]); } }}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >Next</Button>
        </div>

        <p className="text-xs text-muted-foreground text-center pt-4">
          When you're done, the facilitator will generate the combined report. Your answers are already saved.
        </p>
    </AlignShell>
  );
}