import React, { useState } from 'react';
import { Calendar, Rocket, Sparkles, Brain, Users, Shield, Globe, Search, Layers, BookOpen, UserCheck, Heart } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown } from 'lucide-react';

type ReleaseStage = 'beta' | 'release' | 'upcoming';

interface RoadmapVersion {
  version: string;
  theme: string;
  glance: string;
  milestone: string;
  title: string;
  description: string;
  highlights: string[];
  closing: string;
  icon: React.ElementType;
  stage: ReleaseStage;
}

const roadmapData: RoadmapVersion[] = [
  {
    version: 'Beta V2.0',
    theme: 'Internal Beta',
    glance: 'A faster, cleaner, more useful Daryle.AI experience with improved projects, prompts, model selection, and knowledge controls.',
    milestone: 'June 2026',
    title: 'A Better Everyday AI Experience',
    description: 'Daryle.AI is getting faster, cleaner, and easier to use. This release focuses on the foundational experience: a better interface, stronger project organization, smarter prompting, and more control over which AI models and knowledge sources are used.',
    highlights: [
      'A refreshed UI / UX',
      'Projects and folders to organize work',
      'Prompt sharpening to improve results',
      'Multi-model selection across leading AI models',
      'Knowledge base controls for more flexible use',
    ],
    closing: 'Beta V2.0 lays the groundwork for Daryle.AI to become a serious daily-use AI platform.',
    icon: Rocket,
    stage: 'beta',
  },
  {
    version: 'Beta V2.5',
    theme: 'Pilot Beta',
    glance: 'Stronger knowledge, project memory, source visibility, and permission controls for pilot-ready use.',
    milestone: 'July 2026',
    title: 'Smarter Knowledge and Pilot Readiness',
    description: 'Daryle.AI becomes more context-aware and pilot-ready. This release strengthens the knowledge layer behind the platform, adds project memory, improves visibility into sources, and introduces permission controls for teams and organizations.',
    highlights: [
      "Daryle's selected emails added to strengthen founder voice",
      'Project Memory to preserve context across workstreams',
      'Knowledge Base Viewer for greater source transparency',
      'Permissions and visibility controls for teams',
    ],
    closing: 'Beta V2.5 moves Daryle.AI closer to broader pilot use with teams, affiliates, and aligned organizations.',
    icon: Brain,
    stage: 'beta',
  },
  {
    version: 'V3.0',
    theme: 'Market Release',
    glance: 'Personalized learning, user profiles, and advanced multi-model workflows.',
    milestone: 'August 2026',
    title: 'The First Market Release',
    description: 'Daryle.AI enters its first regular product release with stronger personalization, learning, and intelligence. This version introduces guided learning through Project SMART, user profiles that help tailor responses, and advanced multi-model workflows that allow Daryle.AI to use different models for different strengths.',
    highlights: [
      'Project SMART Learning Layer',
      'User Profiles',
      'Multi-model use in a single prompt',
    ],
    closing: 'V3.0 is where Daryle.AI becomes more than an assistant. It becomes a personalized learning and decision-support tool.',
    icon: Sparkles,
    stage: 'release',
  },
  {
    version: 'V3.5',
    theme: 'Expansion Release',
    glance: 'Coaching, consulting, dashboards, and user memory for a more tailored AI experience.',
    milestone: 'September 2026',
    title: 'A More Personalized AI Partner',
    description: 'Daryle.AI expands into coaching, consulting, dashboards, and memory. This release is designed to help users move from simple answers to better thinking, better decisions, and more personalized guidance.',
    highlights: [
      'Coaching and Consulting Modes',
      'Project Dashboard',
      'User Memory',
    ],
    closing: 'V3.5 makes Daryle.AI more useful as a daily partner for leaders, teams, and organizations.',
    icon: Users,
    stage: 'release',
  },
  {
    version: 'V4.0',
    theme: 'Intelligence Release',
    glance: 'Third-party verification and model comparison for greater trust and confidence.',
    milestone: 'Q4 2026',
    title: 'More Trust, More Confidence',
    description: 'Daryle.AI adds stronger verification and model-comparison capabilities. This release is focused on trust. Users will be able to compare perspectives, review answers more critically, and gain confidence before acting on AI-generated outputs.',
    highlights: [
      'Daryle Third-Party Verification',
      'Model Council',
    ],
    closing: 'V4.0 helps users move from "What did the AI say?" to "How confident should I be?"',
    icon: Shield,
    stage: 'upcoming',
  },
  {
    version: 'V4.5',
    theme: 'Research Release',
    glance: 'Deeper research capabilities for complex questions and source-heavy work.',
    milestone: 'Q4 2026',
    title: 'Deeper Research',
    description: 'Daryle.AI adds advanced research capability for more complex work. This release is designed for questions that require deeper investigation, stronger source handling, and more thorough synthesis.',
    highlights: ['Deep Research'],
    closing: 'V4.5 makes Daryle.AI more powerful for strategy, analysis, planning, and complex decision-making.',
    icon: Search,
    stage: 'upcoming',
  },
  {
    version: 'V5.0',
    theme: 'Platform Release',
    glance: 'Voice AI and API capabilities that expand Daryle.AI beyond chat.',
    milestone: 'Q4 2026',
    title: 'Beyond Chat',
    description: 'Daryle.AI expands into voice and platform capabilities. This release moves Daryle.AI beyond the chat window and toward a broader ecosystem where users, teams, apps, and agents can connect with Daryle.AI in new ways.',
    highlights: ['Voice AI', 'API and Ecosystem Model'],
    closing: 'V5.0 positions Daryle.AI as a broader AI platform, not just a single tool.',
    icon: Globe,
    stage: 'upcoming',
  },
];

const principles = [
  {
    icon: Layers,
    title: 'Model-Agnostic Intelligence',
    body: 'Daryle.AI is designed to work across leading AI models rather than lock users into one provider.',
  },
  {
    icon: BookOpen,
    title: 'Trusted Knowledge',
    body: 'The platform is built around approved knowledge bases, source visibility, and organization-specific context.',
  },
  {
    icon: UserCheck,
    title: 'Personalized Guidance',
    body: 'Future releases will tailor responses around users, projects, learning needs, and work patterns.',
  },
  {
    icon: Heart,
    title: 'Values-Aligned AI',
    body: 'Daryle.AI is built to support organizations that care about culture, trust, stewardship, leadership, and long-term impact.',
  },
];

const stageBadgeClass = (stage: ReleaseStage) => {
  switch (stage) {
    case 'beta':
      return 'bg-brand-yellow/20 text-brand-blue border-brand-yellow/40 font-semibold';
    case 'release':
      return 'bg-brand-blue text-brand-offwhite border-brand-blue';
    case 'upcoming':
      return 'bg-brand-blue/10 text-brand-blue border-brand-blue/20';
  }
};

const stageLabel = (stage: ReleaseStage) => {
  switch (stage) {
    case 'beta':
      return 'Beta';
    case 'release':
      return 'Release';
    case 'upcoming':
      return 'Upcoming';
  }
};

const RoadmapPage: React.FC = () => {
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  return (
    <>
      <SEOHead
        title="Daryle.AI Roadmap | The Future of Values-Aligned AI"
        description="See where Daryle.AI is headed: smarter projects, deeper knowledge, model comparison, research, voice, and API. From Beta V2.0 through V5.0 across 2026."
        keywords="Daryle AI roadmap, values-aligned AI, organizational intelligence, multi-model AI, AI knowledge base, voice AI, AI API, Project SMART"
        canonicalUrl="/roadmap"
      />
      <div className="min-h-screen bg-background">
        <LandingNav />

        {/* Hero */}
        <section className="relative pt-40 md:pt-52 pb-24 md:pb-32 px-4 overflow-hidden bg-gradient-to-br from-brand-blue via-[#0a2f52] to-brand-blue -mt-[5.5rem] md:-mt-28">
          {/* Dot pattern */}
          <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: '40px 40px' }} />
          {/* Glow blobs */}
          <div className="absolute -top-32 -left-20 w-[28rem] h-[28rem] rounded-full bg-brand-yellow/20 blur-3xl" />
          <div className="absolute -bottom-40 -right-20 w-[32rem] h-[32rem] rounded-full bg-brand-blue/40 blur-3xl" />
          {/* Diagonal accent line */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-yellow/40 to-transparent" />

          <div className="max-w-6xl mx-auto relative z-10">
            <div className="grid lg:grid-cols-12 gap-10 items-center">
              {/* Left: copy */}
              <div className="lg:col-span-7 text-center lg:text-left">
                <Badge className="mb-6 bg-brand-yellow/15 text-brand-yellow border border-brand-yellow/40 hover:bg-brand-yellow/15 backdrop-blur-sm">
                  <Sparkles className="w-3 h-3 mr-1.5" />
                  Product Roadmap · 2026
                </Badge>

                <h1 className="font-heading font-bold text-brand-offwhite leading-[1.05] mb-6 text-4xl md:text-5xl lg:text-6xl">
                  The Future of{' '}
                  <span className="relative inline-block">
                    <span className="relative z-10 text-brand-yellow">Values-Aligned AI</span>
                    <span className="absolute left-0 right-0 bottom-1 h-3 bg-brand-yellow/20 -z-0 rounded-sm" />
                  </span>
                  <br className="hidden md:block" />
                  Is Coming
                </h1>

                <p className="text-lg md:text-xl text-brand-offwhite/90 mb-5 max-w-2xl mx-auto lg:mx-0">
                  Daryle.AI is evolving from a powerful AI assistant into a full organizational intelligence platform — built around trusted knowledge, leading AI models, and the voice, values, and context that make each organization unique.
                </p>
                <p className="text-base md:text-lg text-brand-offwhite/70 max-w-2xl mx-auto lg:mx-0">
                  This roadmap shows where Daryle.AI is headed next — practical, secure, contextual, and aligned.
                </p>

                <div className="mt-8 flex flex-wrap gap-3 justify-center lg:justify-start">
                  <Button
                    size="lg"
                    onClick={() => {
                      document.getElementById('roadmap-glance')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-brand-yellow text-brand-blue hover:bg-brand-yellow/90 font-semibold"
                  >
                    Explore the Roadmap
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => (window.location.href = '/landing#beta')}
                    className="bg-transparent border-brand-offwhite/40 text-brand-offwhite hover:bg-brand-offwhite/10 hover:text-brand-offwhite"
                  >
                    Get Beta Access
                  </Button>
                </div>

                {/* Quick stats */}
                <div className="mt-10 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0">
                  {[
                    { n: '7', l: 'Releases' },
                    { n: '4', l: 'Principles' },
                    { n: '2026', l: 'Timeline' },
                  ].map((s) => (
                    <div key={s.l} className="text-center lg:text-left">
                      <div className="font-heading text-2xl md:text-3xl font-bold text-brand-yellow">{s.n}</div>
                      <div className="text-xs uppercase tracking-wider text-brand-offwhite/60 mt-1">{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: visual roadmap preview */}
              <div className="lg:col-span-5">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-br from-brand-yellow/20 to-brand-blue/30 rounded-3xl blur-2xl" />
                  <Card className="relative bg-brand-offwhite/5 backdrop-blur-md border-brand-offwhite/15 overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-5">
                        <span className="text-xs uppercase tracking-widest text-brand-yellow font-semibold">Release Path</span>
                        <span className="text-xs text-brand-offwhite/60">2026</span>
                      </div>
                      <div className="space-y-3">
                        {roadmapData.slice(0, 5).map((item) => (
                          <div key={item.version} className="flex items-center gap-3 group">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${item.stage === 'beta' ? 'bg-brand-yellow text-brand-blue' : item.stage === 'release' ? 'bg-brand-blue text-brand-yellow border border-brand-yellow/30' : 'bg-brand-offwhite/10 text-brand-offwhite border border-brand-offwhite/20'}`}>
                              <item.icon className="w-5 h-5" strokeWidth={1.75} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="font-heading font-bold text-brand-offwhite text-sm">{item.version}</span>
                                <span className="text-xs text-brand-offwhite/50 whitespace-nowrap">{item.milestone}</span>
                              </div>
                              <div className="text-xs text-brand-offwhite/70 truncate">{item.theme}</div>
                            </div>
                          </div>
                        ))}
                        <div className="flex items-center gap-3 opacity-70">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-brand-offwhite/5 border border-dashed border-brand-offwhite/20 text-brand-offwhite/60 text-xs font-bold">
                            +2
                          </div>
                          <div className="text-xs text-brand-offwhite/60">More releases through Q4 2026</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Roadmap at a Glance */}
        <section id="roadmap-glance" className="py-20 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="t-h2 mb-4">Roadmap at a Glance</h2>
              <p className="t-body text-muted-foreground max-w-2xl mx-auto">
                Seven releases across 2026, each adding new capability, depth, and trust to the Daryle.AI platform.
              </p>
            </div>

            {/* Desktop: clean horizontal journey */}
            <div className="hidden lg:block relative">
              <div className="absolute left-8 right-8 top-7 h-px bg-border" />
              <TooltipProvider delayDuration={150}>
                <div className="grid grid-cols-7 gap-6 relative">
                  {roadmapData.map((item, i) => (
                    <Tooltip key={item.version}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label={`${item.version} — ${item.theme} — ${item.milestone}`}
                          className="flex flex-col items-center text-center group focus:outline-none"
                        >
                          <div
                            className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center border-2 border-background ring-1 ring-border transition-all duration-200 group-hover:ring-brand-yellow group-hover:scale-110 group-focus-visible:ring-brand-yellow ${
                              item.stage === 'beta'
                                ? 'bg-brand-yellow text-brand-blue'
                                : item.stage === 'release'
                                ? 'bg-brand-blue text-brand-yellow'
                                : 'bg-background text-brand-blue/70'
                            }`}
                          >
                            <item.icon className="w-5 h-5" strokeWidth={1.75} />
                          </div>
                          <div className="mt-4 font-heading font-bold text-brand-blue text-base leading-tight">
                            {item.version}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">{item.theme}</div>
                          <div className="mt-2 text-xs font-medium text-brand-blue/70">{item.milestone}</div>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        align="center"
                        sideOffset={12}
                        showArrow
                        arrowClassName="fill-brand-blue"
                        className="w-[300px] max-w-[300px] bg-brand-blue text-brand-offwhite border-brand-blue/80 p-0 shadow-2xl ring-1 ring-brand-yellow/20 rounded-lg"
                      >
                        {/* Header strip */}
                        <div className="flex items-center justify-between gap-2 px-3.5 py-2 bg-brand-blue/60 border-b border-brand-offwhite/10">
                          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] font-semibold text-brand-yellow">
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-brand-yellow text-brand-blue text-[9px] font-bold">
                              {i + 1}
                            </span>
                            Step {i + 1} of {roadmapData.length}
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-[10px] tracking-wide ${stageBadgeClass(item.stage)}`}
                          >
                            {stageLabel(item.stage)}
                          </Badge>
                        </div>

                        {/* Body */}
                        <div className="p-3.5">
                          <div className="flex items-baseline justify-between gap-3 mb-1">
                            <span className="font-heading font-bold text-base text-brand-offwhite leading-tight">
                              {item.version}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] text-brand-yellow font-semibold whitespace-nowrap">
                              <Calendar className="w-3 h-3" />
                              {item.milestone}
                            </span>
                          </div>
                          <div className="text-[11px] uppercase tracking-wider text-brand-offwhite/60 font-medium mb-2">
                            {item.theme}
                          </div>
                          <p className="text-xs text-brand-offwhite/90 leading-relaxed">
                            {item.glance}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </TooltipProvider>
            </div>

            {/* Mobile/Tablet: vertical timeline with tap-to-expand */}
            <div className="lg:hidden relative">
              <div className="absolute left-7 top-2 bottom-2 w-0.5 bg-gradient-to-b from-brand-yellow/50 via-brand-blue/40 to-brand-blue/10 rounded-full" />
              <p className="text-xs text-center text-muted-foreground mb-5 italic">
                Tap any release for details
              </p>
              <ol className="space-y-4">
                {roadmapData.map((item, i) => {
                  const isOpen = expandedVersion === item.version;
                  return (
                    <li key={item.version} className="relative pl-20">
                      <div
                        className={`absolute left-0 top-1 w-14 h-14 rounded-full flex items-center justify-center shadow-md border-4 border-background z-10 ${
                          item.stage === 'beta'
                            ? 'bg-brand-yellow text-brand-blue'
                            : item.stage === 'release'
                            ? 'bg-brand-blue text-brand-yellow'
                            : 'bg-brand-offwhite text-brand-blue border-brand-blue/20'
                        }`}
                      >
                        <item.icon className="w-6 h-6" strokeWidth={1.75} />
                        <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-background border-2 border-brand-blue text-brand-blue text-[11px] font-bold flex items-center justify-center shadow">
                          {i + 1}
                        </div>
                      </div>

                      <Card
                        className={`border-primary/20 shadow-sm transition-all duration-200 ${
                          isOpen ? 'border-brand-yellow/60 shadow-md' : ''
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedVersion(isOpen ? null : item.version)
                          }
                          aria-expanded={isOpen}
                          aria-controls={`roadmap-panel-${item.version}`}
                          className="w-full text-left p-4 flex items-center justify-between gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow rounded-lg"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-heading font-bold text-brand-blue text-base leading-tight">
                                {item.version}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] tracking-wide ${stageBadgeClass(item.stage)}`}
                              >
                                {item.theme}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-brand-blue/70">
                              <Calendar className="w-3 h-3" />
                              {item.milestone}
                            </div>
                          </div>
                          <ChevronDown
                            className={`w-5 h-5 text-brand-blue/60 flex-shrink-0 transition-transform duration-200 ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {isOpen && (
                          <div
                            id={`roadmap-panel-${item.version}`}
                            className="px-4 pb-4 pt-1 border-t border-border/60 animate-fade-in"
                          >
                            <h4 className="font-heading font-semibold text-brand-blue mb-2 mt-2">
                              {item.title}
                            </h4>
                            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                              {item.glance}
                            </p>

                            <div className="text-[11px] uppercase tracking-wider font-semibold text-brand-blue mb-2">
                              {item.highlights.length > 1 ? 'Highlights' : 'Highlight'}
                            </div>
                            <ul className="space-y-1.5 mb-3">
                              {item.highlights.map((h, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm">
                                  <Sparkles className="w-3.5 h-3.5 text-brand-yellow flex-shrink-0 mt-0.5" />
                                  <span className="text-muted-foreground leading-snug">{h}</span>
                                </li>
                              ))}
                            </ul>

                            <p className="text-xs italic text-foreground/80 border-l-2 border-brand-yellow pl-3">
                              {item.closing}
                            </p>
                          </div>
                        )}
                      </Card>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Legend */}
            <div className="relative">
              <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-brand-yellow border border-brand-yellow/60" />
                  <span className="text-muted-foreground">Beta</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-brand-blue" />
                  <span className="text-muted-foreground">Release</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-brand-offwhite border border-brand-blue/30" />
                  <span className="text-muted-foreground">Upcoming</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Roadmap Timeline */}
        <section className="py-20 px-4 bg-background">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="t-h2 mb-4">What's Coming</h2>
              <p className="t-body text-muted-foreground max-w-2xl mx-auto">
                A closer look at each release — what it delivers and why it matters.
              </p>
            </div>

            <div className="relative">
              <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-brand-blue via-brand-yellow to-brand-blue opacity-20" />

              <div className="space-y-12">
                {roadmapData.map((item, index) => (
                  <div
                    key={item.version}
                    className={`relative flex flex-col md:flex-row gap-8 items-center ${
                      index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                    }`}
                  >
                    <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 z-10">
                      <div className="bg-brand-yellow text-brand-blue font-heading font-bold px-6 py-3 rounded-full shadow-lg border-4 border-background whitespace-nowrap">
                        {item.version}
                      </div>
                    </div>

                    <div className="w-full md:w-[calc(50%-4rem)]">
                      <Card className="border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-xl group">
                        <CardContent className="p-8">
                          <div className="flex items-start justify-between mb-4">
                            <div className="p-3 rounded-lg bg-brand-blue/10 group-hover:bg-brand-blue/20 transition-colors">
                              <item.icon className="w-6 h-6 text-brand-blue" />
                            </div>
                            <Badge variant="outline" className={stageBadgeClass(item.stage)}>
                              {stageLabel(item.stage)}
                            </Badge>
                          </div>

                          <div className="md:hidden mb-4">
                            <Badge className="bg-brand-yellow text-brand-blue hover:bg-brand-yellow">
                              {item.version}
                            </Badge>
                          </div>

                          <div className="text-sm font-medium text-brand-blue/70 mb-1">
                            Target Milestone: {item.milestone}
                          </div>
                          <h3 className="t-h3 mb-2 group-hover:text-primary transition-colors">
                            {item.title}
                          </h3>

                          <p className="t-body text-muted-foreground mb-6">
                            {item.description}
                          </p>

                          <div className="text-xs uppercase tracking-wider font-semibold text-brand-blue mb-2">
                            {item.highlights.length > 1 ? 'Highlights' : 'Highlight'}
                          </div>
                          <ul className="space-y-2 mb-5">
                            {item.highlights.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <Sparkles className="w-4 h-4 text-brand-yellow flex-shrink-0 mt-0.5" />
                                <span className="text-muted-foreground">{feature}</span>
                              </li>
                            ))}
                          </ul>

                          <p className="text-sm italic text-foreground/80 border-l-2 border-brand-yellow pl-4">
                            {item.closing}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="hidden md:block w-[calc(50%-4rem)]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Why This Roadmap Matters */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 max-w-3xl mx-auto">
              <h2 className="t-h2 mb-4">Why This Roadmap Matters</h2>
              <p className="t-body text-muted-foreground mb-4">
                Most AI tools are generic. They answer questions, summarize documents, and generate content.
              </p>
              <p className="t-body text-muted-foreground mb-4">
                Daryle.AI is being built for something deeper.
              </p>
              <p className="t-body text-muted-foreground">
                It is designed to understand an organization's knowledge, values, voice, projects, people, and decision-making context. It brings together leading AI models with a trusted knowledge layer so teams can work faster without losing what makes their organization distinct.
              </p>
            </div>

            <div className="text-center mb-8">
              <h3 className="t-h3">Built Around Four Principles</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {principles.map((p, i) => (
                <Card key={p.title} className="border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg group">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-brand-blue/10 group-hover:bg-brand-blue/20 transition-colors flex-shrink-0">
                        <p.icon className="w-6 h-6 text-brand-blue" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-brand-blue/70 mb-1">
                          {String(i + 1).padStart(2, '0')}
                        </div>
                        <h4 className="font-heading text-xl font-bold mb-2">{p.title}</h4>
                        <p className="text-muted-foreground">{p.body}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Closing Statement */}
        <section className="py-20 px-4 bg-brand-blue text-brand-offwhite relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          />
          <div className="max-w-4xl mx-auto relative z-10 text-center space-y-6">
            <h2 className="font-heading text-3xl md:text-4xl font-bold">
              From AI Assistant to Organizational Intelligence Platform
            </h2>
            <p className="text-lg text-brand-offwhite/90">Daryle.AI is not just another chatbot.</p>
            <p className="text-lg text-brand-offwhite/90">
              It is a roadmap toward a smarter, more trusted AI platform that helps organizations learn, decide, lead, and grow with greater clarity.
            </p>
            <p className="text-lg text-brand-offwhite/90">The future of AI will not be one-size-fits-all.</p>
            <p className="text-lg text-brand-offwhite/90">
              It will be contextual. It will be values-aligned. It will be built around the knowledge and voice of the organizations it serves.
            </p>
            <p className="text-xl font-heading font-semibold text-brand-yellow">
              That is where Daryle.AI is going.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 bg-gradient-to-br from-brand-blue/5 to-brand-yellow/5">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="t-h2 mb-4">Want to Influence Our Roadmap?</h2>
            <p className="t-body text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join our beta program to experience these features early and help shape Daryle.AI. Your feedback drives our innovation.
            </p>
            <Button
              size="lg"
              onClick={() => (window.location.href = '/landing#beta')}
              className="min-w-[200px]"
            >
              Get Beta Access
            </Button>
            <p className="mt-10 text-xs text-muted-foreground italic max-w-2xl mx-auto">
              Roadmap Note: Target milestones are subject to refinement as Daryle.AI is tested with real users and expanded into broader use cases. Features may be released incrementally as they are ready.
            </p>
          </div>
        </section>

        <LandingFooter />
      </div>
    </>
  );
};

export default RoadmapPage;
