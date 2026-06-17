import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALIGN_FUNCTIONS, type AlignFunction, type OrgProfile } from "@/lib/align/types";
import { useAlignSession } from "@/hooks/useAlignSession";
import { toast } from "@/hooks/use-toast";
import { AlignShell } from "@/components/align/AlignShell";
import { ArrowRight } from "lucide-react";

export default function AlignStartPage() {
  const navigate = useNavigate();
  const { create, loading } = useAlignSession();
  const [profile, setProfile] = useState<OrgProfile>({
    organization_name: "",
    organization_type: "",
    employee_count: "",
    mission: "",
    strategic_priorities: ["", "", ""],
    selected_functions: [],
    session_type: "self_guided",
  });

  const toggleFn = (fn: AlignFunction) => {
    setProfile((p) => {
      const set = new Set(p.selected_functions ?? []);
      if (set.has(fn)) set.delete(fn);
      else set.add(fn);
      return { ...p, selected_functions: Array.from(set) };
    });
  };

  const submit = async () => {
    if (!profile.organization_name?.trim()) {
      toast({ title: "Organization name required", variant: "destructive" });
      return;
    }
    if ((profile.selected_functions ?? []).length === 0) {
      toast({ title: "Select at least one function", variant: "destructive" });
      return;
    }
    const token = await create(profile);
    if (token) navigate(`/align/s/${token}`);
  };

  return (
    <AlignShell
      eyebrow="ALIGN Discovery · Step 1 of 6"
      title="Tell us about your organization."
      subtitle="A few facts so we can shape the right discovery questions. Takes about two minutes."
      maxWidth="3xl"
    >
        <Card className="border-border/60 shadow-sm">
          <CardHeader><CardTitle className="text-primary">About your organization</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="org">Organization name</Label>
              <Input id="org" value={profile.organization_name ?? ""} onChange={(e) => setProfile({ ...profile, organization_name: e.target.value })} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Organization type</Label>
                <Select value={profile.organization_type ?? ""} onValueChange={(v) => setProfile({ ...profile, organization_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="for_profit">For-profit company</SelectItem>
                    <SelectItem value="nonprofit">Nonprofit</SelectItem>
                    <SelectItem value="ministry">Ministry / Church</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="government">Government</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Number of employees</Label>
                <Select value={profile.employee_count ?? ""} onValueChange={(v) => setProfile({ ...profile, employee_count: v })}>
                  <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1–10</SelectItem>
                    <SelectItem value="11-50">11–50</SelectItem>
                    <SelectItem value="51-200">51–200</SelectItem>
                    <SelectItem value="201-1000">201–1,000</SelectItem>
                    <SelectItem value="1000+">1,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mission">Primary mission</Label>
              <Textarea id="mission" rows={3} value={profile.mission ?? ""} onChange={(e) => setProfile({ ...profile, mission: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Top 3 strategic priorities (next 12–24 months)</Label>
              {[0, 1, 2].map((i) => (
                <Input
                  key={i}
                  placeholder={`Priority ${i + 1}`}
                  value={profile.strategic_priorities?.[i] ?? ""}
                  onChange={(e) => {
                    const next = [...(profile.strategic_priorities ?? ["", "", ""])];
                    next[i] = e.target.value;
                    setProfile({ ...profile, strategic_priorities: next });
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-primary">Functions to assess</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-2">
            {ALIGN_FUNCTIONS.map((fn) => {
              const checked = (profile.selected_functions ?? []).includes(fn);
              return (
                <label
                  key={fn}
                  className={`flex items-center gap-2 text-sm rounded-md border border-border/60 px-3 py-2 cursor-pointer transition-colors ${checked ? "bg-accent/10 border-accent/60" : "hover:bg-muted/50"}`}
                >
                  <Checkbox checked={checked} onCheckedChange={() => toggleFn(fn)} />
                  {fn}
                </label>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            onClick={submit}
            disabled={loading}
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? "Creating…" : "Continue to survey"}
            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
    </AlignShell>
  );
}