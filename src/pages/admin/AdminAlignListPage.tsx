import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, FileCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function rpc<T = unknown>(name: string, args: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).rpc(name, args) as Promise<{ data: T | null; error: { message: string } | null }>;
}

interface SessionRow {
  id: string;
  token: string;
  status: string;
  email: string | null;
  org_name: string | null;
  org_type: string | null;
  created_at: string;
  updated_at: string;
  respondent_count: number;
  response_count: number;
  has_report: boolean;
}

export default function AdminAlignListPage() {
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      const { data, error } = await rpc<SessionRow[]>("align_admin_list_sessions", {
        _search: search || null, _limit: 200, _offset: 0,
      });
      if (cancelled) return;
      setLoading(false);
      if (error) { setError(error.message); return; }
      setError(null);
      setRows(Array.isArray(data) ? data : []);
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [search]);

  const sorted = useMemo(() => [...rows].sort((a, b) => b.updated_at.localeCompare(a.updated_at)), [rows]);

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">ALIGN Sessions</h1>
          <p className="text-muted-foreground mt-1">Browse every ALIGN discovery session, with respondents and reports.</p>
        </div>

        <div className="mb-4 relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by org name or email" className="pl-9" />
        </div>

        {loading && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>}
        {error && <p className="text-destructive text-sm">{error}</p>}

        {!loading && !error && sorted.length === 0 && (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No sessions yet.</CardContent></Card>
        )}

        <div className="grid gap-3">
          {sorted.map((r) => (
            <Link key={r.id} to={`/admin/align/${r.id}`}>
              <Card className="hover:border-primary/40 transition">
                <CardContent className="p-4 flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">{r.org_name || "Untitled organization"}</h3>
                      <Badge variant="outline">{r.status}</Badge>
                      {r.has_report && <Badge variant="secondary" className="gap-1"><FileCheck className="w-3 h-3" /> report</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-3">
                      {r.org_type && <span>{r.org_type}</span>}
                      {r.email && <span>{r.email}</span>}
                      <span>{r.respondent_count} respondent{r.respondent_count === 1 ? "" : "s"}</span>
                      <span>{r.response_count} answer{r.response_count === 1 ? "" : "s"}</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">
                    Updated {formatDistanceToNow(new Date(r.updated_at), { addSuffix: true })}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}