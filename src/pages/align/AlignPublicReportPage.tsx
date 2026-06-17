import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { AlignReport, AlignSynthesis } from "@/lib/align/types";
import { AlignShell } from "@/components/align/AlignShell";

const DECISION_LABEL: Record<AlignReport["decision"], string> = {
  move_to_pilot: "Move to pilot design",
  address_gaps: "Address gaps first",
  track_later: "Track for later",
  do_not_prioritize: "Do not prioritize now",
};

interface PublicPayload {
  org: { organization_name: string | null; organization_type: string | null; mission: string | null };
  report: AlignReport;
  generated_at: string;
}

export default function AlignPublicReportPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PublicPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: res, error: err } = await (supabase as any).rpc("align_get_public_report", { _token: token });
      if (cancelled) return;
      if (err || !res) {
        setError(err?.message ?? "Report not found");
      } else {
        setData(res as PublicPayload);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [token]);

  if (loading) return <div className="min-h-screen grid place-items-center bg-brand-offwhite text-muted-foreground">Loading…</div>;
  if (error || !data) {
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center bg-brand-offwhite">
        <div>
          <p className="text-destructive">{error ?? "Report not available"}</p>
          <Link to="/align" className="underline mt-3 inline-block">Learn about ALIGN</Link>
        </div>
      </div>
    );
  }

  const { org, report } = data;
  const synthesis: AlignSynthesis | undefined = report.synthesis;
  const orgName = org.organization_name || "An organization";

  return (
    <AlignShell
      eyebrow="ALIGN Discovery Report"
      title={orgName}
      subtitle="Read-only public view of the strategic AI alignment report."
      maxWidth="4xl"
      cta={<Badge className="bg-accent text-primary self-center">Read-only public view</Badge>}
    >
        {synthesis?.purpose_statement && (
          <Card className="border-border/60 shadow-sm">
            <CardHeader><CardTitle>Strategic AI purpose</CardTitle></CardHeader>
            <CardContent><p className="text-sm leading-relaxed">{synthesis.purpose_statement}</p></CardContent>
          </Card>
        )}

        <Card className="border-border/60 shadow-sm">
          <CardHeader><CardTitle>Decision</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Badge>{DECISION_LABEL[report.decision]}</Badge>
            {report.recommended_pilot && (
              <p className="text-sm mt-2">
                <span className="text-muted-foreground">Recommended pilot: </span>
                <span className="font-medium">{report.recommended_pilot.title}</span>
              </p>
            )}
            {synthesis?.executive_narrative && (
              <p className="text-sm leading-relaxed mt-3">{synthesis.executive_narrative}</p>
            )}
          </CardContent>
        </Card>

        {synthesis?.pilot_brief && (
          <Card className="border-accent/40 bg-accent/5 shadow-sm">
            <CardHeader><CardTitle>Pilot brief</CardTitle></CardHeader>
            <CardContent><p className="text-sm leading-relaxed whitespace-pre-line">{synthesis.pilot_brief}</p></CardContent>
          </Card>
        )}

        {report.top_use_cases?.length > 0 && (
          <Card className="border-border/60 shadow-sm">
            <CardHeader><CardTitle>Prioritized use cases</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {report.top_use_cases.slice(0, 5).map((uc, i) => (
                <div key={i} className="border-l-2 border-accent pl-3">
                  <p className="font-medium text-sm">{uc.title}</p>
                  <p className="text-xs text-muted-foreground">{uc.function_name} · {uc.ai_mode}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {synthesis?.governance_notes && synthesis.governance_notes.length > 0 && (
          <Card className="border-border/60 shadow-sm">
            <CardHeader><CardTitle>Governance notes</CardTitle></CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {synthesis.governance_notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            </CardContent>
          </Card>
        )}

        {synthesis?.risks_and_watchouts && synthesis.risks_and_watchouts.length > 0 && (
          <Card className="border-border/60 shadow-sm">
            <CardHeader><CardTitle>Risks &amp; watch-outs</CardTitle></CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {synthesis.risks_and_watchouts.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-muted-foreground text-center pt-4">
          Generated {new Date(data.generated_at).toLocaleDateString()} · <Link to="/align" className="underline">Run your own ALIGN</Link>
        </p>
    </AlignShell>
  );
}