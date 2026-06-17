import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Loader2, Trash2, UserPlus } from "lucide-react";
import type { AlignSection } from "@/lib/align/types";
import { track } from "@/lib/analytics";

const ALL_SECTIONS: AlignSection[] = ["A", "L", "I", "G", "N"];

function rpc<T = unknown>(name: string, args: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).rpc(name, args) as Promise<{ data: T | null; error: { message: string } | null }>;
}

interface Respondent {
  id: string;
  token: string;
  name: string | null;
  email: string | null;
  sections: AlignSection[];
  created_at: string;
  last_seen_at: string | null;
  revoked: boolean;
  answer_counts: Record<string, number>;
}

// Questions per section used to compute progress denominator (matches AlignSessionPage).
const QUESTIONS_PER_SECTION: Record<AlignSection, number> = { A: 3, L: 6, I: 6, G: 6, N: 4 };

export function RespondentsPanel({ sessionToken }: { sessionToken: string }) {
  const [list, setList] = useState<Respondent[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sections, setSections] = useState<AlignSection[]>([...ALL_SECTIONS]);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await rpc<Respondent[]>("align_list_respondents", { _session_token: sessionToken });
    setLoading(false);
    if (error) { toast.error("Failed to load respondents"); return; }
    setList(Array.isArray(data) ? data : []);
  }, [sessionToken]);

  useEffect(() => {
    void refresh();
    const id = setInterval(refresh, 10_000);
    return () => clearInterval(id);
  }, [refresh]);

  const createInvite = async () => {
    if (sections.length === 0) { toast.error("Pick at least one section"); return; }
    setCreating(true);
    const { data, error } = await rpc<Array<{ id: string; token: string }>>("align_create_respondent", {
      _session_token: sessionToken,
      _name: name,
      _email: email,
      _sections: sections,
    });
    setCreating(false);
    if (error || !data || data.length === 0) { toast.error(error?.message ?? "Failed to create invite"); return; }
    setName(""); setEmail(""); setSections([...ALL_SECTIONS]);
    toast.success("Invite created");
    await refresh();
    const link = `${window.location.origin}/align/r/${data[0].token}`;
    track({ event_name: "align_invite_created", category: "align", properties: { sections } });
    try { await navigator.clipboard.writeText(link); toast.success("Link copied"); } catch { /* noop */ }
  };

  const revoke = async (id: string) => {
    const { error } = await rpc<boolean>("align_revoke_respondent", { _session_token: sessionToken, _respondent_id: id });
    if (error) { toast.error("Failed to revoke"); return; }
    toast.success("Invite revoked");
    await refresh();
  };

  const copyLink = async (token: string) => {
    const link = `${window.location.origin}/align/r/${token}`;
    try { await navigator.clipboard.writeText(link); toast.success("Link copied"); } catch { toast.error("Copy failed"); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Respondents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 p-4 rounded-lg border border-border bg-muted/30">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label className="text-xs">Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alice (Ops Lead)" />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs">Email (optional)</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="alice@org.com" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label className="text-xs">Sections this person fills</Label>
            <div className="flex flex-wrap gap-3">
              {ALL_SECTIONS.map((s) => {
                const checked = sections.includes(s);
                return (
                  <label key={s} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        setSections((prev) => (v ? Array.from(new Set([...prev, s])) : prev.filter((x) => x !== s)));
                      }}
                    />
                    Section {s}
                  </label>
                );
              })}
            </div>
          </div>
          <div>
            <Button onClick={createInvite} disabled={creating} size="sm">
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
              Create invite + copy link
            </Button>
          </div>
        </div>

        {loading && list.length === 0 && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!loading && list.length === 0 && (
          <p className="text-sm text-muted-foreground">No respondents yet. Your own answers are still saved against this session.</p>
        )}

        <div className="grid gap-3">
          {list.map((r) => {
            const denom = r.sections.reduce((sum, s) => sum + (QUESTIONS_PER_SECTION[s] ?? 0), 0);
            const answered = Object.entries(r.answer_counts ?? {}).reduce(
              (sum, [s, n]) => sum + (r.sections.includes(s as AlignSection) ? Number(n) : 0),
              0,
            );
            const pct = denom > 0 ? Math.min(100, Math.round((answered / denom) * 100)) : 0;
            return (
              <div key={r.id} className={`rounded-md border border-border p-3 ${r.revoked ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{r.name || "Unnamed respondent"}</span>
                      {r.email && <span className="text-xs text-muted-foreground">{r.email}</span>}
                      {r.revoked && <Badge variant="secondary">Revoked</Badge>}
                    </div>
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      {r.sections.map((s) => (
                        <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => copyLink(r.token)} aria-label="Copy link">
                      <Copy className="w-4 h-4" />
                    </Button>
                    {!r.revoked && (
                      <Button size="icon" variant="ghost" onClick={() => revoke(r.id)} aria-label="Revoke">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">{pct}%</span>
                </div>
                {r.last_seen_at && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Last active {new Date(r.last_seen_at).toLocaleString()}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default RespondentsPanel;