import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Copy, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import type { AlignReport, AlignSection } from "@/lib/align/types";

function rpc<T = unknown>(name: string, args: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).rpc(name, args) as Promise<{ data: T | null; error: { message: string } | null }>;
}

interface Bundle {
  session: {
    id: string; token: string; status: string; email: string | null;
    org_profile: Record<string, unknown>;
    created_at: string; updated_at: string;
  };
  respondents: Array<{
    id: string; name: string | null; email: string | null;
    sections: AlignSection[]; created_at: string; last_seen_at: string | null; revoked: boolean;
  }>;
  responses: Array<{
    id: string; respondent_id: string | null; section: AlignSection;
    question_key: string; function_name: string | null; answer_value: unknown; updated_at: string;
  }>;
  report: AlignReport | null;
}

const SECTIONS: AlignSection[] = ["A", "L", "I", "G", "N"];

export default function AdminAlignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resynth, setResynth] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await rpc<Bundle>("align_admin_get_session", { _session_id: id });
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (!data) { setError("Session not found"); return; }
    setError(null);
    setBundle(data);
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const respondentName = (rid: string | null) => {
    if (!rid) return "Facilitator";
    const r = bundle?.respondents.find((x) => x.id === rid);
    return r?.name || "Unnamed";
  };

  const copyPublic = async () => {
    if (!bundle) return;
    const link = `${window.location.origin}/align/p/${bundle.session.token}`;
    try { await navigator.clipboard.writeText(link); toast.success("Public report link copied"); } catch { toast.error("Copy failed"); }
  };

  const rerunSynth = async () => {
    if (!bundle) return;
    setResynth(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).functions.invoke("align-synthesize", { body: { token: bundle.session.token } });
      if (error) throw error;
      toast.success("Synthesis regenerated");
      await load();
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to regenerate");
    } finally {
      setResynth(false);
    }
  };

  if (loading && !bundle) {
    return <AdminLayout><div className="p-8 flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div></AdminLayout>;
  }
  if (error || !bundle) {
    return <AdminLayout><div className="p-8 text-destructive">{error ?? "Not found"}</div></AdminLayout>;
  }

  const org = bundle.session.org_profile as { organization_name?: string; organization_type?: string; mission?: string };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <Link to="/admin/align" className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
              <ArrowLeft className="w-3 h-3" /> All ALIGN sessions
            </Link>
            <h1 className="text-2xl md:text-3xl font-heading font-bold mt-1">{org.organization_name || "Untitled"}</h1>
            <p className="text-muted-foreground text-sm">{org.organization_type} · {bundle.session.status}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={copyPublic}><Copy className="w-4 h-4 mr-2" />Copy public link</Button>
            <Button asChild variant="outline" size="sm">
              <Link to={`/align/s/${bundle.session.token}/report`} target="_blank">
                <ExternalLink className="w-4 h-4 mr-2" /> Open report
              </Link>
            </Button>
            <Button size="sm" onClick={rerunSynth} disabled={resynth}>
              {resynth ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Re-run synthesis
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Organization</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <div><span className="text-muted-foreground">Name:</span> {org.organization_name || "—"}</div>
            <div><span className="text-muted-foreground">Type:</span> {org.organization_type || "—"}</div>
            <div><span className="text-muted-foreground">Mission:</span> {org.mission || "—"}</div>
            <div><span className="text-muted-foreground">Contact email:</span> {bundle.session.email || "—"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Respondents ({bundle.respondents.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {bundle.respondents.length === 0 && <p className="text-sm text-muted-foreground">Solo session — facilitator only.</p>}
            {bundle.respondents.map((r) => (
              <div key={r.id} className="flex items-center gap-3 text-sm flex-wrap">
                <span className="font-medium">{r.name || "Unnamed"}</span>
                {r.email && <span className="text-muted-foreground text-xs">{r.email}</span>}
                <div className="flex gap-1">{r.sections.map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}</div>
                {r.revoked && <Badge variant="secondary">revoked</Badge>}
                {r.last_seen_at && <span className="text-xs text-muted-foreground">last seen {new Date(r.last_seen_at).toLocaleString()}</span>}
              </div>
            ))}
          </CardContent>
        </Card>

        {SECTIONS.map((s) => {
          const rows = bundle.responses.filter((r) => r.section === s);
          if (rows.length === 0) return null;
          return (
            <Card key={s}>
              <CardHeader><CardTitle className="text-base">Section {s}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {rows
                  .sort((a, b) => a.question_key.localeCompare(b.question_key))
                  .map((r) => (
                    <div key={r.id} className="text-sm border-l-2 border-border pl-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{r.question_key}</code>
                        {r.function_name && <Badge variant="outline" className="text-xs">{r.function_name}</Badge>}
                        <Badge variant="secondary" className="text-xs">{respondentName(r.respondent_id)}</Badge>
                      </div>
                      <pre className="mt-1 text-xs whitespace-pre-wrap break-words text-foreground/90">
                        {typeof r.answer_value === "string" ? r.answer_value : JSON.stringify(r.answer_value, null, 2)}
                      </pre>
                    </div>
                  ))}
              </CardContent>
            </Card>
          );
        })}

        <Card>
          <CardHeader><CardTitle className="text-base">Report</CardTitle></CardHeader>
          <CardContent>
            {!bundle.report && <p className="text-sm text-muted-foreground">No report generated yet.</p>}
            {bundle.report && (
              <pre className="text-xs whitespace-pre-wrap break-words max-h-[480px] overflow-auto bg-muted/30 p-3 rounded">
                {JSON.stringify(bundle.report, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}