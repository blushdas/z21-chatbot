import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlignShell } from "@/components/align/AlignShell";
import { ArrowRight } from "lucide-react";

const STEPS = [
  { letter: "A", name: "Anchor in Purpose", q: "What must AI serve?", out: "Strategic AI purpose statement" },
  { letter: "L", name: "Locate Opportunities", q: "Where can AI create value?", out: "Opportunity map by function" },
  { letter: "I", name: "Identify Readiness", q: "Which opportunities are ready?", out: "Prioritized use cases and readiness score" },
  { letter: "G", name: "Guard Trust", q: "What must be protected?", out: "Governance boundaries and approval map" },
  { letter: "N", name: "Navigate the Roadmap", q: "What happens next?", out: "30-60-90 day action plan" },
];

export default function AlignLandingPage() {
  const navigate = useNavigate();
  return (
    <AlignShell
      eyebrow="ALIGN Discovery"
      title="Discover where AI should serve, where humans must lead, and what's responsible next."
      subtitle="Most organizations begin AI adoption in the wrong place — with tools and platforms, before clarifying purpose, readiness, governance, or trust. ALIGN reverses that order."
      maxWidth="4xl"
      cta={
        <>
          <Button
            size="lg"
            onClick={() => navigate("/align/start")}
            className="bg-accent text-primary hover:bg-accent/90 font-semibold"
          >
            Start a discovery session
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <span className="text-xs text-white/70 self-center">No account required · ~15 minutes</span>
        </>
      }
    >
        <section>
          <h2 className="text-2xl font-semibold tracking-tight text-primary">The five steps</h2>
          <div className="mt-4 grid gap-3">
            {STEPS.map((s) => (
              <Card key={s.letter} className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className="h-11 w-11 rounded-full bg-accent text-primary grid place-items-center text-lg font-bold shadow-sm">
                    {s.letter}
                  </div>
                  <CardTitle className="text-lg text-primary">{s.name}</CardTitle>
                </CardHeader>
                <CardContent className="pl-[5rem] pb-4">
                  <p className="text-sm text-muted-foreground">{s.q}</p>
                  <p className="text-sm mt-1"><span className="text-muted-foreground">Output: </span>{s.out}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
            <h3 className="font-semibold text-primary">AI is best suited for</h3>
            <ul className="mt-2 text-sm text-muted-foreground space-y-1 list-disc pl-5">
              <li>Finding knowledge faster</li>
              <li>Reducing repetitive work</li>
              <li>Improving service consistency</li>
              <li>Supporting better decisions</li>
              <li>Accelerating training and onboarding</li>
              <li>Scaling communication</li>
              <li>Strengthening reporting</li>
            </ul>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
            <h3 className="font-semibold text-primary">AI should never replace</h3>
            <ul className="mt-2 text-sm text-muted-foreground space-y-1 list-disc pl-5">
              <li>Human responsibility and accountability</li>
              <li>Moral and legal judgment</li>
              <li>Sensitive personnel decisions</li>
              <li>Pastoral, relational, or clinical care</li>
              <li>Trust-building relationships</li>
              <li>Mission definition</li>
            </ul>
          </div>
        </section>

        <section className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">Ready to map AI to your mission?</p>
          <Button
            size="lg"
            onClick={() => navigate("/align/start")}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Begin survey
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </section>
    </AlignShell>
  );
}