import { useState } from "react";
import { Link } from "react-router-dom";

// ─── Section label ───────────────────────────────────────────────────────────
function SectionLabel({ num, label }: { num: string; label: string }) {
  return (
    <div className="mb-8 flex items-center gap-3">
      <span className="text-xs uppercase tracking-widest text-gold font-medium">
        {num}
      </span>
      <span className="text-xs uppercase tracking-widest text-muted-foreground">
        &mdash;&nbsp;&nbsp;{label}
      </span>
    </div>
  );
}

// ─── Gold divider line ──────────────────────────────────────────────────────
function GoldLine() {
  return <div className="h-px w-12 bg-gold" />;
}

// ─── FAQ Accordion ─────────────────────────────────────────────────────────
const faqs = [
  {
    q: "Is the community free?",
    a: "The community is free to join. The Cohort program is a paid 6-week sprint with live sessions, templates, and accountability built in.",
  },
  {
    q: "How much time do I need?",
    a: "Plan for 4–6 hours per week. Live demos are 90 minutes/week. The rest is implementation at your own pace.",
  },
  {
    q: "What if I'm brand new to AI?",
    a: "The Cohort starts from zero. We focus on workflow redesign — not prompt engineering theory.",
  },
  {
    q: "Refunds or guarantee?",
    a: "If you complete the first two weeks and aren't seeing value, we'll work with you. We're serious about outcomes.",
  },
  {
    q: "Do I keep access after the Cohort ends?",
    a: "Yes. The lifetime library, replays, and templates are yours to keep long after the sprint is over.",
  },
];

function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="mx-auto max-w-2xl space-y-0 divide-y divide-border/50">
      {faqs.map((faq, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between py-6 text-left transition-colors hover:text-gold"
          >
            <span className="text-sm uppercase tracking-wide">{faq.q}</span>
            <span className="ml-4 text-gold text-xs">{open === i ? "−" : "+"}</span>
          </button>
          {open === i && (
            <p className="pb-6 text-sm leading-relaxed text-muted-foreground">
              {faq.a}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Feature card ────────────────────────────────────────────────────────────
function FeatureCard({
  num,
  title,
  desc,
}: {
  num: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="space-y-3">
      <span className="text-xs uppercase tracking-widest text-gold">{num}</span>
      <h3 className="text-sm font-semibold uppercase tracking-wide">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

// ─── Proof stat ─────────────────────────────────────────────────────────────
function ProofStat({
  value,
  label,
  author,
}: {
  value: string;
  label: string;
  author?: string;
}) {
  return (
    <div className="space-y-1 text-center">
      <div className="text-5xl font-bold tracking-tight text-white">{value}</div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      {author && (
        <div className="text-xs text-gold mt-1">{author}</div>
      )}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="bg-black text-white">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1600&q=80')",
          }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/70" />

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          {/* Gold logo mark */}
          <div className="mx-auto mb-10 flex h-12 w-12 items-center justify-center rounded bg-gold text-black font-bold text-lg">
            Z21
          </div>

          {/* Headline */}
          <h1 className="mb-6 text-6xl font-extrabold uppercase tracking-tight leading-none sm:text-7xl md:text-8xl lg:text-9xl">
            <span className="block text-white">Build AI Workflows</span>
            <span className="block text-gold">From Zero to One</span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed text-gray-300 sm:text-lg">
            Leverage AI to 10x your workflows, ship a full-stack AI product,
            and build in public with accountability.
          </p>

          {/* CTA */}
          <Link
            to="/chat"
            className="inline-block rounded bg-gold px-8 py-3 text-sm font-medium uppercase tracking-wider text-black transition-colors hover:bg-gold-light"
          >
            For Teams
          </Link>
        </div>
      </section>

      {/* ── 01 — ABOUT ─────────────────────────────────────────────────── */}
      <section className="py-32 px-6">
        <div className="mx-auto max-w-4xl">
          <SectionLabel num="01" label="About" />
          <GoldLine />
          <div className="mt-12 grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="mb-6 text-3xl font-bold leading-tight sm:text-4xl">
                What Z21 Is
              </h2>
              <div className="space-y-4 text-sm leading-relaxed text-gray-400">
                <p>
                  <strong className="text-white">Community = Platform. Cohort = Product.</strong>
                </p>
                <p>
                  Z21 is a founders' community that ships in public. The product is a
                  6-week Cohort that gets you live, then the community keeps you compounding.
                </p>
              </div>
            </div>
            <div className="space-y-6 pt-4">
              {[
                "AI tool access, templates, and a living library",
                "Zero-to-one live demos: we build workflows on screen",
                "Weekly Ship Rooms for feedback and accountability",
                "IRL workshops and wellness pop-ups",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm">
                  <span className="mt-1 text-gold">—</span>
                  <span className="text-gray-400">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 02 — WHY NOW ───────────────────────────────────────────────── */}
      <section className="py-32 px-6 border-t border-border/10">
        <div className="mx-auto max-w-4xl">
          <SectionLabel num="02" label="Why Now" />
          <GoldLine />
          <div className="mt-12 space-y-16">
            {[
              {
                num: "01",
                title: "AI usage is high; ROI is uneven.",
                body: "Most teams stall at pilots. Speed to a working, production workflow is the advantage right now.",
              },
              {
                num: "02",
                title: "Value follows workflow redesign and agentic systems.",
                body: "Not one-off prompts. We aim your first workflow where adoption already pays — marketing, sales, service ops, or IT.",
              },
            ].map((item) => (
              <div key={item.num} className="grid gap-4 md:grid-cols-12">
                <div className="md:col-span-2">
                  <span className="text-xs uppercase tracking-widest text-gold">
                    {item.num}
                  </span>
                </div>
                <div className="md:col-span-10">
                  <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-400">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 03 — WHAT YOU GET ──────────────────────────────────────────── */}
      <section className="py-32 px-6 border-t border-border/10">
        <div className="mx-auto max-w-5xl">
          <SectionLabel num="03" label="Features" />
          <GoldLine />
          <h2 className="mb-16 mt-8 text-4xl font-bold sm:text-5xl">
            What You Get
          </h2>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              num="01"
              title="AI Tools & Templates"
              desc="Install the exact workflows we use — no fluff."
            />
            <FeatureCard
              num="02"
              title="Live Demo Builds"
              desc="We build on screen so you can copy-ship."
            />
            <FeatureCard
              num="03"
              title="Accountability"
              desc="Ship Rooms, public proof wall, and a shared scoreboard."
            />
            <FeatureCard
              num="04"
              title="Lifetime Library"
              desc="Replays and playbooks you keep after the sprint."
            />
            <FeatureCard
              num="05"
              title="Production Workflows"
              desc="Deploy 1 production AI workflow that runs every week."
            />
            <FeatureCard
              num="06"
              title="Qualified Calls"
              desc="Book 2+ qualified calls within the first 6 weeks."
            />
          </div>
        </div>
      </section>

      {/* ── 04 — FIT CHECK ─────────────────────────────────────────────── */}
      <section className="py-32 px-6 border-t border-border/10">
        <div className="mx-auto max-w-4xl">
          <SectionLabel num="04" label="Fit Check" />
          <GoldLine />
          <h2 className="mb-16 mt-8 text-4xl font-bold sm:text-5xl">
            Is Z21 For You?
          </h2>
          <div className="grid gap-12 md:grid-cols-2">
            {/* For you */}
            <div className="space-y-6">
              <h3 className="text-xs uppercase tracking-widest text-gold">
                This Is For You If&hellip;
              </h3>
              {[
                "You're a founder or creator ready to ship",
                "You want real workflows, not theory",
                "You have 4–6 hours/week to dedicate",
                "You want accountability and community",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm text-gray-400">
                  <span className="text-gold mt-0.5">+</span>
                  {item}
                </div>
              ))}
            </div>
            {/* Not for you */}
            <div className="space-y-6">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground">
                This Isn&rsquo;t For You If&hellip;
              </h3>
              {[
                "You want someone to do it all for you",
                "You're looking for get-rich-quick shortcuts",
                "You can't commit 4–6 hours per week",
                "You're not ready to build in public",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm text-gray-500">
                  <span className="mt-0.5">−</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 05 — OFFERS ────────────────────────────────────────────────── */}
      <section className="py-32 px-6 border-t border-border/10">
        <div className="mx-auto max-w-5xl">
          <SectionLabel num="05" label="Offers" />
          <GoldLine />
          <h2 className="mb-4 mt-8 text-4xl font-bold sm:text-5xl">
            Offer Stack
          </h2>
          <p className="mb-16 text-sm text-gray-400">
            Pick the path that fits your build. Each option installs real assets and a
            working workflow.
          </p>
          <div className="grid gap-8 md:grid-cols-2">
            {/* Teams */}
            <div className="space-y-6 rounded border border-border/50 p-8">
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-widest text-gold">
                  For Teams
                </span>
                <h3 className="text-2xl font-bold">Teams</h3>
                <p className="text-sm text-gray-400">
                  For startup SMB and lean teams.
                </p>
              </div>
              <div className="h-px bg-border/50" />
              <ul className="space-y-3 text-sm text-gray-400">
                {[
                  "Full team access to the library",
                  "Monthly live demo sessions",
                  "Private Slack channel",
                  "Workflow audit & implementation",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-gold">—</span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">
                Variable by scope and demand.
              </p>
              <Link
                to="/chat"
                className="inline-block w-full rounded border border-gold px-6 py-3 text-center text-xs uppercase tracking-wider text-gold transition-colors hover:bg-gold hover:text-black"
              >
                Learn More
              </Link>
            </div>

            {/* Cohort */}
            <div className="space-y-6 rounded border border-border/50 p-8">
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-widest text-gold">
                  Group Sprint
                </span>
                <h3 className="text-2xl font-bold">Cohort</h3>
                <p className="text-sm text-gray-400">
                  Group session with live sprint in 6 weeks.
                </p>
              </div>
              <div className="h-px bg-border/50" />
              <ul className="space-y-3 text-sm text-gray-400">
                {[
                  "Everything in Teams",
                  "6 weekly live build sessions",
                  "Private cohort Slack",
                  "Certificate of completion",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-gold">—</span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">
                Cost per seat. Seasonal price increase.
              </p>
              <button
                disabled
                className="inline-block w-full cursor-not-allowed rounded border border-border/50 px-6 py-3 text-center text-xs uppercase tracking-wider text-muted-foreground"
              >
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 06 — PROOF ──────────────────────────────────────────────────── */}
      <section className="py-32 px-6 border-t border-border/10">
        <div className="mx-auto max-w-4xl">
          <SectionLabel num="06" label="Proof" />
          <GoldLine />
          <h2 className="mb-16 mt-8 text-4xl font-bold sm:text-5xl">
            Receipts, Not Promises
          </h2>

          {/* Stats */}
          <div className="mb-16 grid grid-cols-3 gap-8">
            <ProofStat value="48h" label="First qualified call" author="A. Santos — B2B Founder" />
            <ProofStat value="x7" label="Clips/week from 1 video" author="M. Lee — Creator" />
            <ProofStat value="90%" label="Completion rate" />
          </div>

          {/* Why believe us */}
          <h3 className="mb-8 text-xs uppercase tracking-widest text-muted-foreground">
            Why Believe Us
          </h3>
          <div className="space-y-4">
            {[
              "Founder has onboarded growth, sales, product, and marketing teams into AI since early GPT.",
              "We track boring, real metrics: assets shipped, calls booked, hours saved, workflows active @ 30/60/90 days.",
              "Human-in-the-loop by design: you approve; we provide the leverage.",
              "Privacy-safe defaults and simple governance patterns.",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 text-sm text-gray-400">
                <span className="text-gold mt-0.5">—</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 07 — IN ACTION ─────────────────────────────────────────────── */}
      <section className="py-32 px-6 border-t border-border/10 bg-neutral-950">
        <div className="mx-auto max-w-5xl">
          <SectionLabel num="07" label="In Action" />
          <GoldLine />
          <h2 className="mb-4 mt-8 text-4xl font-bold sm:text-5xl">
            AI Training In Action
          </h2>
          <p className="mb-16 text-sm text-gray-400">
            Real workshops. Real results. See teams transform from AI-confused to
            AI operators.
          </p>
          {/* Image grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square w-full overflow-hidden rounded bg-neutral-800"
              >
                <img
                  src={`https://images.unsplash.com/photo-${[
                    "1517245386807-bb43f82c33c4",
                    "1522071820081-009f0129c71c",
                    "1552664730-d307ca884978",
                    "1600880292203-757bb62b4baf",
                    "1542744173-8e7e53415bb0",
                    "1558403194-611308249627",
                    "1531487611138-aa5e2c83ee55",
                    "1497366216548-37526070297c",
                  ][i]}?w=400&q=70`}
                  alt={`Workshop ${i + 1}`}
                  className="h-full w-full object-cover opacity-80 hover:opacity-100 transition-opacity duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 08 — MEET YOUR COACH ───────────────────────────────────────── */}
      <section className="py-32 px-6 border-t border-border/10">
        <div className="mx-auto max-w-4xl">
          <SectionLabel num="08" label="Meet Your Coach" />
          <GoldLine />
          <div className="mt-12 grid gap-12 md:grid-cols-2">
            <div className="space-y-6">
              <div className="h-64 w-64 rounded bg-neutral-800" />
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-widest text-gold">
                  Troy Pastoral
                </span>
                <p className="text-sm text-gray-400">
                  Not a prompt engineer — a builder who ships.
                </p>
              </div>
            </div>
            <div className="space-y-6 pt-8">
              <h3 className="text-2xl font-bold">What I&rsquo;ve Built &darr;</h3>
              <div className="space-y-4">
                {[
                  "8+ years building and shipping digital products",
                  "Growth, sales, product, and marketing AI adoption since GPT-3",
                  "Hypetrain.vip — community-led creator platform",
                  "Z21 — zero to one builder community and Cohort program",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-gray-400">
                    <span className="text-gold">—</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 09 — FAQ ────────────────────────────────────────────────────── */}
      <section className="py-32 px-6 border-t border-border/10">
        <div className="mx-auto max-w-3xl">
          <SectionLabel num="09" label="FAQ" />
          <GoldLine />
          <h2 className="mb-12 mt-8 text-4xl font-bold sm:text-5xl">
            Frequently Asked
          </h2>
          <FAQAccordion />
        </div>
      </section>

      {/* ── 10 — CTA ────────────────────────────────────────────────────── */}
      <section className="py-40 px-6 border-t border-border/10 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-6 text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">
            Ready to Build<br />
            <span className="text-gold">Your Business?</span>
          </h2>
          <p className="mb-10 text-sm text-gray-400">
            The Cohort is filling up. Reserve your spot before the next cycle closes.
          </p>
          <Link
            to="/chat"
            className="inline-block rounded bg-gold px-10 py-4 text-sm font-medium uppercase tracking-wider text-black transition-colors hover:bg-gold-light"
          >
            For Teams
          </Link>
        </div>
      </section>
    </div>
  );
}
