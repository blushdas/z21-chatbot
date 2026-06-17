import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAlignSession } from "@/hooks/useAlignSession";
import { buildReport } from "@/lib/align/scoring";
import type { AlignReport, AlignSynthesis } from "@/lib/align/types";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2, Download } from "lucide-react";
import { AlignShell } from "@/components/align/AlignShell";

const DECISION_LABEL: Record<AlignReport["decision"], string> = {
  move_to_pilot: "Move to pilot design",
  address_gaps: "Address gaps first",
  track_later: "Track for later",
  do_not_prioritize: "Do not prioritize now",
};

export default function AlignReportPage() {
  const { token } = useParams<{ token: string }>();
  const { session, loading, error, setEmail, saveReport, reload } = useAlignSession(token);
  const [email, setEmailLocal] = useState("");
  const [emailSaved, setEmailSaved] = useState(false);
  const [synthLoading, setSynthLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const report: AlignReport | null = useMemo(() => {
    if (!session) return null;
    return session.report ?? buildReport(session.org_profile, session.responses);
  }, [session]);

  // persist a freshly-computed report if missing
  useEffect(() => {
    if (session && !session.report && report) {
      void saveReport(report);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  if (loading && !session) return <div className="min-h-screen grid place-items-center bg-brand-offwhite text-muted-foreground">Loading…</div>;
  if (error || !session || !report) {
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center bg-brand-offwhite">
        <div>
          <p className="text-destructive">{error ?? "Report not available"}</p>
          <Link to="/align" className="underline mt-3 inline-block">Back to ALIGN</Link>
        </div>
      </div>
    );
  }

  const submitEmail = async () => {
    if (!email.trim()) return;
    const ok = await setEmail(email.trim());
    if (ok) {
      setEmailSaved(true);
      toast({ title: "Email saved" });
    } else {
      toast({ title: "Could not save email", variant: "destructive" });
    }
  };

  const org = session.org_profile.organization_name || "Your organization";
  const synthesis: AlignSynthesis | undefined = report.synthesis;

  const generateSynthesis = async () => {
    if (!token) return;
    setSynthLoading(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("align-synthesize", {
        body: { token },
      });
      if (fnErr) throw fnErr;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      await reload();
      toast({ title: "AI synthesis ready" });
    } catch (e) {
      toast({ title: "Synthesis failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSynthLoading(false);
    }
  };

  const downloadPdf = async () => {
    setPdfLoading(true);
    try {
      const el = document.getElementById("align-report-printable");
      if (!el) throw new Error("Report not found");
      const html2pdf = (await import("html2pdf.js")).default;
      const filename = `ALIGN-Report-${(org || "report").replace(/[^a-z0-9]+/gi, "-")}.pdf`;
      await html2pdf()
        .set({
          margin: [12, 12, 14, 12],
          filename,
          image: { type: "jpeg", quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        } as any)
        .from(el)
        .save();
    } catch (e) {
      toast({ title: "PDF export failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <AlignShell
      eyebrow="ALIGN Discovery Report"
      title={org}
      subtitle="Strategic AI purpose, prioritized use cases, governance, and your 30-60-90 roadmap."
      maxWidth="4xl"
      cta={
        <>
          <Button
            size="lg"
            onClick={downloadPdf}
            disabled={pdfLoading}
            className="bg-accent text-primary hover:bg-accent/90 font-semibold"
          >
            {pdfLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Preparing</> : <><Download className="h-4 w-4 mr-2" /> Download PDF</>}
          </Button>
          <Link to="/align" className="self-center text-sm text-white/80 hover:text-white underline">Start new</Link>
        </>
      }
    >
      <div id="align-report-printable" className="space-y-6 [&_.pdf-hide]:print:hidden">
        {/* Executive Summary */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Executive summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={report.decision === "move_to_pilot" ? "default" : "secondary"}>
                Decision: {DECISION_LABEL[report.decision]}
              </Badge>
              {report.recommended_pilot && (
                <Badge variant="outline">Pilot: {report.recommended_pilot.title}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {report.recommended_pilot
                ? `A first pilot has passed the readiness and risk gates. Top readiness score: ${report.recommended_pilot.scores.readiness_score}/40.`
                : report.pilot_blocked_reason}
            </p>
          </CardContent>
        </Card>

        {/* Purpose */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader><CardTitle>Strategic AI purpose statement</CardTitle></CardHeader>
          <CardContent>
            <p className="text-base leading-relaxed">{report.purpose_statement}</p>
          </CardContent>
        </Card>

        {/* Opportunity Map */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader><CardTitle>Opportunity map</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4">Function</th>
                  <th className="py-2 pr-4">Top opportunity</th>
                  <th className="py-2 pr-4">AI mode</th>
                  <th className="py-2">Example</th>
                </tr>
              </thead>
              <tbody>
                {report.opportunity_map.map((row) => (
                  <tr key={row.function_name} className="border-t border-border">
                    <td className="py-2 pr-4 font-medium">{row.function_name}</td>
                    <td className="py-2 pr-4 capitalize">{row.top_opportunity}</td>
                    <td className="py-2 pr-4">{row.ai_mode}</td>
                    <td className="py-2 text-muted-foreground">{row.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Top Use Cases */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader><CardTitle>Prioritized use cases</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {report.top_use_cases.map((uc) => (
              <div key={uc.id} className="border border-border rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium">{uc.title}</h3>
                    <p className="text-xs text-muted-foreground">{uc.function_name} · {uc.ai_mode} · {uc.internal_external}-facing</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-semibold leading-none">{uc.scores.readiness_score}<span className="text-sm text-muted-foreground">/40</span></div>
                    <div className="text-xs text-muted-foreground mt-1">{uc.scores.recommendation_label}</div>
                  </div>
                </div>
                <p className="text-sm mt-2">{uc.problem_statement}</p>
                {uc.risks.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">Risks: {uc.risks.join("; ")}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recommended Pilot */}
        <Card className="border-accent/40 bg-accent/5 shadow-sm">
          <CardHeader><CardTitle>Recommended first pilot</CardTitle></CardHeader>
          <CardContent>
            {report.recommended_pilot ? (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{report.recommended_pilot.title}</h3>
                <p className="text-sm">{report.recommended_pilot.problem_statement}</p>
                <div className="text-sm">
                  <span className="text-muted-foreground">Audience: </span>{report.recommended_pilot.function_name}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Required: </span>{report.recommended_pilot.required_documents.join(", ")}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Human review: </span>Every output reviewed before action or release.
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{report.pilot_blocked_reason}</p>
            )}
          </CardContent>
        </Card>

        {/* Governance */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader><CardTitle>Governance and trust boundaries</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4">Domain</th>
                  <th className="py-2 pr-4">AI may assist with</th>
                  <th className="py-2">Human must decide</th>
                </tr>
              </thead>
              <tbody>
                {report.governance_map.map((row) => (
                  <tr key={row.domain} className="border-t border-border align-top">
                    <td className="py-2 pr-4 font-medium">{row.domain}</td>
                    <td className="py-2 pr-4">{row.ai_may_assist_with}</td>
                    <td className="py-2">{row.human_must_decide}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Roadmap */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader><CardTitle>30-60-90 day roadmap</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4">
            {report.roadmap.map((p) => (
              <div key={p.window} className="border border-border rounded-lg p-4">
                <div className="text-xs text-muted-foreground">{p.window}</div>
                <div className="font-medium mt-1">{p.focus}</div>
                <ul className="text-sm mt-2 list-disc pl-4 space-y-1 text-muted-foreground">
                  {p.actions.map((a) => <li key={a}>{a}</li>)}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* AI synthesis */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> AI synthesis</CardTitle>
            <Button size="sm" variant={synthesis ? "outline" : "default"} onClick={generateSynthesis} disabled={synthLoading}>
              {synthLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating</> : synthesis ? "Regenerate" : "Generate AI synthesis"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {!synthesis ? (
              <p className="text-sm text-muted-foreground">
                Generate a leadership-ready narrative: purpose statement, executive summary, pilot brief, governance notes, and discussion questions — grounded in your responses.
              </p>
            ) : (
              <div className="space-y-5">
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Purpose</h3>
                  <p className="mt-1 text-base leading-relaxed">{synthesis.purpose_statement}</p>
                </section>
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Executive narrative</h3>
                  <p className="mt-1 text-sm leading-relaxed whitespace-pre-line">{synthesis.executive_narrative}</p>
                </section>
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pilot brief</h3>
                  <p className="mt-1 text-sm leading-relaxed whitespace-pre-line">{synthesis.pilot_brief}</p>
                </section>
                {synthesis.governance_notes.length > 0 && (
                  <section>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Governance notes</h3>
                    <ul className="mt-1 text-sm list-disc pl-5 space-y-1">
                      {synthesis.governance_notes.map((n, i) => <li key={i}>{n}</li>)}
                    </ul>
                  </section>
                )}
                {synthesis.risks_and_watchouts.length > 0 && (
                  <section>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Risks & watch-outs</h3>
                    <ul className="mt-1 text-sm list-disc pl-5 space-y-1">
                      {synthesis.risks_and_watchouts.map((n, i) => <li key={i}>{n}</li>)}
                    </ul>
                  </section>
                )}
                {synthesis.next_questions.length > 0 && (
                  <section>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Leadership questions to discuss</h3>
                    <ul className="mt-1 text-sm list-disc pl-5 space-y-1">
                      {synthesis.next_questions.map((n, i) => <li key={i}>{n}</li>)}
                    </ul>
                  </section>
                )}
                <p className="text-xs text-muted-foreground">Generated {new Date(synthesis.generated_at).toLocaleString()} · {synthesis.model}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email capture */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader><CardTitle>Bookmark your report</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Optional: leave an email so you can come back to this report. We won't spam you.
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmailLocal(e.target.value)}
                disabled={emailSaved || !!session.email}
              />
              <Button onClick={submitEmail} disabled={emailSaved || !!session.email || !email.trim()}>
                {emailSaved || session.email ? "Saved" : "Save"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Resume link: <span className="font-mono">{window.location.origin}/align/s/{token}</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </AlignShell>
  );
}