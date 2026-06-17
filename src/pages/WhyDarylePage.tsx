import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Brain,
  Database,
  Layers,
  Shield,
  Workflow,
  Sparkles,
  Check,
  X,
  Users,
  Compass,
  Lock,
  Repeat,
  Zap,
  AlertTriangle,
  ShieldCheck,
  GitBranch,
  Rocket,
  ArrowDown,
  MessageSquare,
  FileText,
  User,
} from 'lucide-react';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';

const WhyDarylePage: React.FC = () => {
  const comparisonRows = [
    { capability: 'General intelligence', traditional: 'Yes', daryle: 'Yes — through leading frontier models' },
    { capability: 'Company-specific knowledge', traditional: 'Limited unless manually uploaded', daryle: 'Built around approved internal sources' },
    { capability: 'Persistent business context', traditional: 'Inconsistent across chats', daryle: 'Organized around teams, projects, workflows' },
    { capability: 'Company voice and tone', traditional: 'User must prompt for it each time', daryle: 'Built into the experience' },
    { capability: 'Approved source control', traditional: 'Limited', daryle: 'Designed around trusted sources' },
    { capability: 'Project workspaces', traditional: 'Basic, not business-specific', daryle: 'Folders, sources, persistent context' },
    { capability: 'Institutional memory', traditional: 'Lost across scattered chats', daryle: 'Preserves decisions, history, lessons' },
    { capability: 'Role-specific guidance', traditional: 'Mostly manual', daryle: 'Shaped for leaders, teams, departments' },
    { capability: 'Workflow support', traditional: 'Generic chat interface', daryle: 'Designed for repeatable workflows' },
    { capability: 'Prompt quality', traditional: 'Depends on user skill', daryle: 'Guided prompts, templates, sharpening' },
    { capability: 'Governance', traditional: 'Limited at the org level', daryle: 'Standards, permissions, approved use' },
    { capability: 'Model flexibility', traditional: 'Tied to one model family', daryle: 'Model agnostic — routes across providers' },
    { capability: 'Cost control', traditional: 'Spread across many tools', daryle: 'Centralized model usage strategy' },
    { capability: 'Consistency across employees', traditional: 'Varies by user', daryle: 'Shared standards and behavior' },
    { capability: 'Onboarding value', traditional: 'Generic explanations', daryle: 'Teaches new users how the company works' },
    { capability: 'Verification', traditional: 'User must check manually', daryle: 'Review, comparison, second-opinion flows' },
    { capability: 'Long-term durability', traditional: 'Depends on vendor changes', daryle: 'Stable layer even as models change' },
    { capability: 'Strategic ownership', traditional: 'Vendor owns the platform', daryle: 'You own the layer, knowledge, workflows' },
    { capability: "Daryle's wisdom & AE knowledge", traditional: 'Not available', daryle: "Decades of Daryle Doden's teachings and Ambassador Enterprises principles built in" },
  ];

  const layerCards = [
    { icon: Database, title: 'Your knowledge', body: 'Approved company materials, documents, meeting notes, policies — searchable and grounded.' },
    { icon: Compass, title: 'Your context', body: 'Organized around your departments, teams, initiatives, clients, and projects.' },
    { icon: Shield, title: 'Your standards', body: 'Tone, quality expectations, decision-making approach, and internal guidelines — built in.' },
    { icon: Workflow, title: 'Your workflows', body: 'Meeting prep, summaries, leadership guidance, drafting, onboarding, policy lookup.' },
    { icon: Brain, title: 'Your memory', body: 'Project context, prior decisions, recurring questions, and lessons learned — preserved.' },
    { icon: Layers, title: 'Your AI control layer', body: 'Best model for the task. Compare outputs. Manage cost. Adapt as the market changes.' },
  ];

  const advantages = [
    { icon: Repeat, title: 'Model agnostic', body: 'Not tied to one provider. Adapts as models improve.' },
    { icon: Database, title: 'Knowledge aware', body: 'Answers from approved company knowledge, not generic training data.' },
    { icon: Compass, title: 'Context rich', body: 'Understands the project, team, audience, history, and goal.' },
    { icon: Workflow, title: 'Workflow driven', body: 'Built around repeatable tasks your team performs every day.' },
    { icon: Lock, title: 'Governed', body: 'Controls sources, standards, access, and how AI is applied.' },
    { icon: Users, title: 'Consistent', body: 'Closes the gap between power users and casual users.' },
  ];

  const fadeUp = {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' },
    transition: { duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] as [number, number, number, number] },
  };

  return (
    <div className="min-h-screen bg-brand-offwhite text-brand-blue overflow-x-hidden">
      <LandingNav variant="light" />

      {/* HERO — editorial split */}
      <section className="relative">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-10 -left-40 w-[520px] h-[520px] rounded-full bg-brand-yellow/30 blur-3xl" />
          <div className="absolute top-32 -right-40 w-[600px] h-[600px] rounded-full bg-brand-blue/15 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, hsl(var(--brand-blue)) 1px, transparent 0)',
              backgroundSize: '36px 36px',
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-20">
          <div className="text-center max-w-5xl mx-auto">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 backdrop-blur border border-brand-blue/10 text-[11px] font-semibold tracking-[0.18em] uppercase shadow-sm mb-8"
            >
              <Sparkles className="h-3.5 w-3.5 text-brand-yellow" />
              Organizational Intelligence Layer
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05 }}
              className="font-heading font-extrabold tracking-tight text-5xl md:text-7xl lg:text-[5.5rem] leading-[1.02] mb-8"
            >
              AI that knows
              <span className="block">your business,</span>
              <span className="block text-brand-yellow italic font-medium mt-2">not just the internet.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-brand-blue/70 max-w-2xl mx-auto leading-relaxed"
            >
              ChatGPT, Claude, Gemini and Grok are powerful general-purpose tools. Daryle.AI is the layer that wraps them in your knowledge, your standards, your workflows.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-semibold tracking-[0.2em] uppercase text-brand-blue/45"
            >
              <span>Routes across</span>
              <span className="h-3 w-px bg-brand-blue/15" />
              <span>GPT</span>
              <span className="h-1 w-1 rounded-full bg-brand-yellow" />
              <span>Claude</span>
              <span className="h-1 w-1 rounded-full bg-brand-yellow" />
              <span>Gemini</span>
              <span className="h-1 w-1 rounded-full bg-brand-yellow" />
              <span>Grok</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <a href="#vs" className="group inline-flex items-center gap-2 bg-brand-blue text-brand-offwhite px-8 py-4 rounded-full font-semibold hover:bg-brand-blue/90 transition-all hover:shadow-2xl hover:shadow-brand-blue/30 hover:-translate-y-0.5">
                See the comparison
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </a>
              <Link to="/contact" className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-brand-blue/70 hover:text-brand-blue transition-colors">
                Talk to us →
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* VS section header */}
      <section id="vs" className="py-20 md:py-28 bg-white border-y border-brand-blue/10 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/3 w-[400px] h-[400px] rounded-full bg-brand-yellow/15 blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-10"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-offwhite border border-brand-blue/10 text-[11px] font-semibold tracking-[0.18em] uppercase">
              <Sparkles className="h-3.5 w-3.5 text-brand-yellow" />
              The Comparison
            </span>
          </motion.div>

          <div className="grid md:grid-cols-[1fr_auto_1fr] items-center gap-6 md:gap-10 max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-center md:text-right"
            >
              <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-brand-blue/40 mb-3">Generic</div>
              <h2 className="font-heading font-extrabold text-4xl md:text-6xl lg:text-7xl leading-[0.95] text-brand-blue/35 line-through decoration-[3px] decoration-brand-blue/20">
                Traditional<br />AI
              </h2>
              <div className="mt-5 flex flex-wrap justify-center md:justify-end gap-1.5">
                {['ChatGPT', 'Claude', 'Gemini', 'Grok'].map((m) => (
                  <span
                    key={m}
                    className="px-3 py-1 rounded-full bg-white border border-brand-blue/10 text-[11px] font-semibold text-brand-blue/45"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: 0.25, type: 'spring' }}
              className="flex items-center justify-center"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-brand-yellow blur-2xl opacity-50 rounded-full" />
                <div className="relative h-20 w-20 md:h-24 md:w-24 rounded-full bg-brand-yellow flex items-center justify-center shadow-2xl shadow-brand-yellow/40">
                  <span className="font-heading font-extrabold text-2xl md:text-3xl text-brand-blue italic">vs</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-center md:text-left"
            >
              <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-brand-yellow mb-3">Organizational</div>
              <h2 className="font-heading font-extrabold text-4xl md:text-6xl lg:text-7xl leading-[0.95] text-brand-blue">
                Daryle<span className="text-brand-yellow">.</span>AI
              </h2>
            </motion.div>
          </div>

          {/* Analogy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-20 max-w-4xl mx-auto text-center"
          >
            <Zap className="h-7 w-7 text-brand-yellow mx-auto mb-6" />
            <blockquote className="font-heading text-2xl md:text-4xl leading-[1.15] font-semibold tracking-tight">
              Traditional AI is a brilliant consultant
              <span className="text-brand-blue/40"> who knows nothing about your company.</span>
            </blockquote>
            <p className="mt-8 text-base md:text-lg text-brand-blue/65 leading-relaxed max-w-2xl mx-auto">
              Daryle.AI is the same level of intelligence — inside a system that already understands your company. It knows where to look, what standards to follow, and how your team works.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Score strip */}
      <section className="border-y border-brand-blue/10 bg-white/60 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
          {[
            { k: '18', v: 'Capabilities compared' },
            { k: '4+', v: 'Frontier models routed' },
            { k: '1', v: 'Source of truth' },
            { k: '0', v: 'Re-explaining context' },
          ].map((s, i) => (
            <motion.div
              key={s.k}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="flex flex-col"
            >
              <span className="font-heading font-extrabold text-4xl md:text-5xl text-brand-blue tracking-tight">{s.k}</span>
              <span className="text-xs uppercase tracking-wider text-brand-blue/50 mt-1 font-semibold">{s.v}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Side-by-side cards (visual VS) */}
      <section className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto mb-16">
            <p className="t-overline text-brand-yellow mb-4 font-semibold tracking-[0.2em] uppercase text-xs">At a glance</p>
            <h2 className="font-heading font-bold text-4xl md:text-5xl leading-[1.05] tracking-tight">
              Two fundamentally different things.
            </h2>
            <p className="mt-5 text-lg md:text-xl text-brand-blue/65 leading-relaxed">
              Traditional AI starts every conversation as a stranger. Daryle.AI starts every conversation already knowing your business.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {/* Traditional */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6 }}
              className="relative p-8 md:p-10 rounded-3xl bg-white border border-brand-blue/10"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-10 rounded-xl bg-brand-blue/5 flex items-center justify-center">
                  <X className="h-5 w-5 text-brand-blue/40" />
                </div>
                <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-brand-blue/40">Traditional AI</span>
              </div>
              <h3 className="font-heading font-bold text-2xl md:text-3xl mb-6 leading-tight text-brand-blue/60">
                Every employee re-explains the company. Every time.
              </h3>
              <p className="text-sm font-semibold uppercase tracking-wider text-brand-blue/40 mb-3">What the model doesn't know</p>
              <ul className="space-y-2.5">
                {[
                  'What the company does',
                  'What the goal is',
                  'What tone to use',
                  'What background matters',
                  'What documents to trust',
                  'What standards to follow',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-brand-blue/55">
                    <X className="h-4 w-4 text-brand-blue/25 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 pt-5 border-t border-brand-blue/10 text-sm text-brand-blue/55 italic leading-relaxed">
                Result: generic answers, inconsistent voice, hours lost re-explaining context.
              </p>
            </motion.div>

            {/* Daryle */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative p-8 md:p-10 rounded-3xl bg-brand-blue text-brand-offwhite overflow-hidden shadow-2xl shadow-brand-blue/20"
            >
              <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-brand-yellow/20 blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-10 w-10 rounded-xl bg-brand-yellow/20 flex items-center justify-center">
                    <Check className="h-5 w-5 text-brand-yellow" />
                  </div>
                  <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-brand-yellow">Daryle.AI</span>
                </div>
                <h3 className="font-heading font-bold text-2xl md:text-3xl mb-6 leading-tight">
                  The organization shows up first. Every time.
                </h3>
                <p className="text-sm font-semibold uppercase tracking-wider text-brand-yellow/80 mb-3">What's already in the system</p>
                <ul className="space-y-2.5">
                  {[
                    'Knows the business',
                    'Knows the goal',
                    'Knows the voice',
                    'Knows the context',
                    'Knows the trusted sources',
                    'Knows the standards',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-brand-offwhite/85">
                      <Check className="h-4 w-4 text-brand-yellow flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 pt-5 border-t border-brand-offwhite/15 text-sm text-brand-offwhite/75 italic leading-relaxed">
                  Result: aligned answers, on-brand voice, decision-ready output from the first message.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* PROMPT → YOURS → ANSWER — Visual flow */}
      {/* ARCHITECTURE DIAGRAM — How it comes together */}
      {/* THE COMPARISON TABLE */}
      <section id="comparison" className="py-24 md:py-32 bg-brand-blue text-brand-offwhite relative overflow-hidden">
        <div className="absolute inset-0 -z-0 opacity-40">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-brand-yellow/15 blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto mb-16">
            <p className="t-overline text-brand-yellow mb-4 font-semibold tracking-[0.2em] uppercase text-xs">The full comparison</p>
            <h2 className="font-heading font-bold text-4xl md:text-6xl leading-[1.02] tracking-tight">
              19 capabilities.<br />
              <span className="text-brand-yellow italic font-medium">Side by side.</span>
            </h2>
          </motion.div>

          <div className="relative rounded-3xl border border-brand-offwhite/10 overflow-hidden">
            {/* Daryle column highlight (desktop only) */}
            <div className="hidden md:block absolute top-0 bottom-0 right-0 w-1/3 bg-gradient-to-b from-brand-yellow/15 via-brand-yellow/10 to-brand-yellow/5 border-l-2 border-brand-yellow/40 pointer-events-none" />

            {/* Header */}
            <div className="relative hidden md:grid grid-cols-12 px-8 py-6 bg-brand-offwhite/[0.04] text-[11px] font-bold uppercase tracking-[0.15em] border-b border-brand-offwhite/10">
              <div className="col-span-4 text-brand-offwhite/50">Capability</div>
              <div className="col-span-4 flex items-center gap-2 text-red-400/80">
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500/15 ring-1 ring-red-500/40 text-red-400">
                  <X className="h-3 w-3" strokeWidth={3} />
                </span>
                Traditional AI
              </div>
              <div className="col-span-4 flex items-center gap-2 text-brand-yellow text-[12px]">
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-brand-yellow text-brand-blue shadow-md shadow-brand-yellow/40">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                Daryle.AI
              </div>
            </div>

            {comparisonRows.map((row, i) => (
              <motion.div
                key={row.capability}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.02, 0.3) }}
                className="relative group grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-0 px-6 md:px-8 py-6 md:py-5 text-sm border-t border-brand-offwhite/10 md:border-brand-offwhite/5 hover:bg-brand-offwhite/[0.03] transition-colors"
              >
                <div className="md:col-span-4 font-semibold text-brand-offwhite flex items-center gap-2.5 md:gap-2">
                  <span className="text-[11px] md:text-[10px] font-bold text-brand-yellow md:text-brand-offwhite/30 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-base md:text-sm">{row.capability}</span>
                </div>

                {/* Traditional — dim, muted, struck */}
                <div className="md:col-span-4 md:pr-6">
                  <div className="md:hidden text-[10px] font-bold tracking-[0.18em] uppercase text-red-400 mb-1.5 flex items-center gap-1.5">
                    <span className="inline-flex items-center justify-center h-3.5 w-3.5 rounded-full bg-red-500/15 ring-1 ring-red-500/40 text-red-400">
                      <X className="h-2.5 w-2.5" strokeWidth={3} />
                    </span>
                    Traditional AI
                  </div>
                  <div className="flex items-start gap-2.5 text-brand-offwhite/55">
                    <span className="hidden md:inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500/15 ring-1 ring-red-500/40 text-red-400 mt-0.5 flex-shrink-0">
                      <X className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span className="line-through decoration-red-400/30">{row.traditional}</span>
                  </div>
                </div>

                {/* Daryle — bright, bold, accented */}
                <div className="md:col-span-4 md:pl-2 relative">
                  <div className="md:hidden text-[10px] font-bold tracking-[0.18em] uppercase text-brand-yellow mb-1.5 flex items-center gap-1.5">
                    <span className="inline-flex items-center justify-center h-3.5 w-3.5 rounded-full bg-brand-yellow text-brand-blue">
                      <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    </span>
                    Daryle.AI
                  </div>
                  <div className="flex items-start gap-2.5 text-brand-offwhite font-medium">
                    <span className="hidden md:inline-flex items-center justify-center h-5 w-5 rounded-full bg-brand-yellow text-brand-blue mt-0.5 flex-shrink-0 shadow-md shadow-brand-yellow/30">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span>{row.daryle}</span>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Mobile column labels per row group */}
          </div>
        </div>
      </section>
      <section id="architecture" className="relative py-24 md:py-32 bg-white border-y border-brand-blue/10 overflow-hidden">
        <div className="absolute inset-0 -z-0">
          <div className="absolute top-1/3 -left-40 w-[480px] h-[480px] rounded-full bg-brand-yellow/15 blur-3xl" />
          <div className="absolute bottom-0 -right-40 w-[520px] h-[520px] rounded-full bg-brand-blue/10 blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto mb-16">
            <p className="t-overline text-brand-yellow mb-4 font-semibold tracking-[0.2em] uppercase text-xs">How it comes together</p>
            <h2 className="font-heading font-bold text-4xl md:text-5xl leading-[1.05] tracking-tight">
              The layers between your team and the model.
            </h2>
            <p className="mt-5 text-lg text-brand-blue/65 leading-relaxed">
              Traditional AI sends questions straight to a single model. Daryle.AI wraps every prompt in your knowledge, context, standards, workflows, and memory — then routes it to the best frontier model.
            </p>
          </motion.div>

          {/* Shared sample prompt */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto mb-10 px-5 py-4 rounded-2xl bg-white border border-brand-blue/10 shadow-sm flex items-start gap-3"
          >
            <div className="h-9 w-9 rounded-lg bg-brand-blue/5 flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 text-brand-blue/60" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-brand-blue/40 mb-1">Same prompt · same employee</div>
              <div className="font-heading text-base md:text-lg text-brand-blue leading-snug">
                <span className="text-brand-blue/40">"</span>Draft an update for the leadership team about the Q3 product launch.<span className="text-brand-blue/40">"</span>
              </div>
            </div>
            <ArrowDown className="hidden md:block h-5 w-5 text-brand-yellow/70 mt-1 flex-shrink-0 animate-bounce" />
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
            {/* ───── TRADITIONAL ───── */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6 }}
              className="relative rounded-3xl bg-brand-offwhite/70 border border-brand-blue/10 p-7 md:p-9"
            >
              <div className="flex items-center justify-between mb-7">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-brand-blue/5 flex items-center justify-center">
                    <X className="h-5 w-5 text-brand-blue/40" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-brand-blue/40">Traditional AI</div>
                    <div className="text-[10px] tracking-[0.15em] uppercase text-brand-blue/30 mt-0.5">3 steps · direct</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full border border-brand-blue/15 text-[9px] font-bold tracking-[0.2em] uppercase text-brand-blue/40">Flat path</span>
              </div>

              <div className="flex flex-col items-stretch gap-0">
                {/* Step 1: bare prompt */}
                <div className="relative px-5 py-4 rounded-xl bg-white border border-brand-blue/10">
                  <div className="absolute -left-2 top-3 text-[9px] font-bold tracking-[0.2em] uppercase text-brand-blue/30 -rotate-90 origin-top-left translate-y-6">01</div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-brand-blue/40" />
                    <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-brand-blue/40">Bare prompt sent</span>
                  </div>
                  <div className="text-sm text-brand-blue/55 italic">"Draft an update for the leadership team…"</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {['no knowledge', 'no context', 'no voice', 'no memory'].map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded-full border border-dashed border-brand-blue/25 text-[10px] font-medium text-brand-blue/35 line-through decoration-brand-blue/20">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center my-3">
                  <ArrowDown className="h-4 w-4 text-brand-blue/25" />
                </div>

                {/* Step 2: one model */}
                <div className="px-5 py-4 rounded-xl bg-white border border-brand-blue/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="h-3.5 w-3.5 text-brand-blue/40" />
                    <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-brand-blue/40">Locked into one model</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['ChatGPT', 'Claude', 'Gemini', 'Grok'].map((m, i) => (
                      <span
                        key={m}
                        className={
                          i === 0
                            ? 'px-3 py-1 rounded-full bg-brand-blue/10 border border-brand-blue/15 text-[11px] font-bold text-brand-blue/65'
                            : 'px-3 py-1 rounded-full border border-brand-blue/10 text-[11px] font-medium text-brand-blue/30 line-through decoration-brand-blue/15'
                        }
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center my-3">
                  <ArrowDown className="h-4 w-4 text-brand-blue/25" />
                </div>

                {/* Step 3: generic output */}
                <div className="px-5 py-4 rounded-xl bg-white border border-brand-blue/10">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-3.5 w-3.5 text-brand-blue/40" />
                    <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-brand-blue/40">Generic answer</span>
                  </div>
                  <div className="text-sm text-brand-blue/55 leading-relaxed italic">
                    "Here is a generic leadership update template you can adapt…"
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="px-2 py-1.5 rounded-lg bg-brand-blue/5 border border-brand-blue/10">
                      <div className="text-[9px] tracking-[0.15em] uppercase text-brand-blue/40">Sources</div>
                      <div className="font-heading font-bold text-brand-blue/55">0</div>
                    </div>
                    <div className="px-2 py-1.5 rounded-lg bg-brand-blue/5 border border-brand-blue/10">
                      <div className="text-[9px] tracking-[0.15em] uppercase text-brand-blue/40">Voice</div>
                      <div className="font-heading font-bold text-brand-blue/55">Generic</div>
                    </div>
                    <div className="px-2 py-1.5 rounded-lg bg-brand-blue/5 border border-brand-blue/10">
                      <div className="text-[9px] tracking-[0.15em] uppercase text-brand-blue/40">Memory</div>
                      <div className="font-heading font-bold text-brand-blue/55">None</div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-7 text-center text-xs text-brand-blue/45 italic">
                Every employee re-explains the company. Every time.
              </p>
            </motion.div>

            {/* ───── DARYLE.AI ───── */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative rounded-3xl bg-brand-blue text-brand-offwhite p-7 md:p-9 overflow-hidden shadow-2xl shadow-brand-blue/25"
            >
              {/* Blueprint grid */}
              <div
                className="absolute inset-0 opacity-[0.05] pointer-events-none"
                style={{
                  backgroundImage:
                    'linear-gradient(hsl(var(--brand-yellow)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--brand-yellow)) 1px, transparent 1px)',
                  backgroundSize: '32px 32px',
                }}
              />
              <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-brand-yellow/20 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-brand-yellow/10 blur-3xl" />

              <div className="relative">
                <div className="flex items-center justify-between mb-7">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-brand-yellow/20 flex items-center justify-center">
                      <Check className="h-5 w-5 text-brand-yellow" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-brand-yellow">Daryle.AI</div>
                      <div className="text-[10px] tracking-[0.15em] uppercase text-brand-yellow/60 mt-0.5">5 layers · best model · grounded</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full border border-brand-yellow/40 text-[9px] font-bold tracking-[0.2em] uppercase text-brand-yellow">Intelligence layer</span>
                </div>

                {/* Step 1: prompt enriched */}
                <div className="relative px-5 py-4 rounded-xl bg-brand-offwhite/[0.07] border border-brand-offwhite/15 backdrop-blur">
                  <div className="flex items-center gap-2 mb-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-brand-yellow" />
                    <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-brand-yellow">Prompt enriched in real time</span>
                  </div>
                  <div className="text-sm text-brand-offwhite/90 italic">"Draft an update for the leadership team…"</div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {[
                      { l: 'company voice', icon: Shield },
                      { l: 'Q3 launch docs', icon: Database },
                      { l: 'leadership tone', icon: Compass },
                      { l: 'past updates', icon: Brain },
                    ].map(({ l, icon: I }, i) => (
                      <motion.span
                        key={l}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ duration: 0.3, delay: 0.2 + i * 0.07 }}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand-yellow/15 border border-brand-yellow/30 text-[10px] font-semibold text-brand-yellow"
                      >
                        <I className="h-2.5 w-2.5" />
                        +{l}
                      </motion.span>
                    ))}
                  </div>
                </div>

                {/* Connector with label */}
                <div className="relative flex items-center justify-center my-3">
                  <div className="absolute h-full w-px bg-gradient-to-b from-brand-yellow/40 to-brand-yellow/20" />
                  <span className="relative px-2 bg-brand-blue text-[9px] font-bold tracking-[0.22em] uppercase text-brand-yellow/70">Wrapped by</span>
                </div>

                {/* Layer stack */}
                <div className="space-y-1.5">
                  {[
                    { icon: Database, title: 'Knowledge', sub: 'Approved company sources', n: '23 sources' },
                    { icon: Compass, title: 'Context', sub: 'Team · project · audience', n: 'Q3 launch' },
                    { icon: Shield, title: 'Standards', sub: 'Voice · tone · guardrails', n: 'On-brand' },
                    { icon: Workflow, title: 'Workflows', sub: 'Repeatable team tasks', n: 'Leadership update' },
                    { icon: Brain, title: 'Memory', sub: 'Decisions · history · lessons', n: '12 prior' },
                  ].map(({ icon: Icon, title, sub, n }, i) => (
                    <motion.div
                      key={title}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={{ duration: 0.4, delay: 0.15 + i * 0.06 }}
                      className="group relative flex items-center gap-3 rounded-xl bg-brand-offwhite/[0.05] border border-brand-offwhite/10 hover:border-brand-yellow/40 hover:bg-brand-offwhite/[0.09] transition-all px-3.5 py-2.5"
                    >
                      <span className="text-[9px] font-bold tabular-nums text-brand-yellow/50 tracking-[0.15em] w-6">L{i + 1}</span>
                      <div className="h-8 w-8 rounded-lg bg-brand-yellow/15 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-4 w-4 text-brand-yellow" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold tracking-tight leading-tight">{title}</div>
                        <div className="text-[10.5px] text-brand-offwhite/55 leading-tight">{sub}</div>
                      </div>
                      <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-brand-yellow/10 border border-brand-yellow/20 text-[9.5px] font-semibold text-brand-yellow/85 whitespace-nowrap">
                        {n}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Connector */}
                <div className="relative flex items-center justify-center my-3">
                  <div className="absolute h-full w-px bg-gradient-to-b from-brand-yellow/20 via-brand-yellow/40 to-brand-yellow/40" />
                  <span className="relative px-2 bg-brand-blue text-[9px] font-bold tracking-[0.22em] uppercase text-brand-yellow/70">Routed to best model</span>
                </div>

                {/* Model router with active highlight */}
                <div className="rounded-xl bg-brand-offwhite/[0.06] border border-brand-offwhite/15 px-4 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-brand-yellow">Model router</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-yellow/70">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-brand-yellow opacity-60 animate-ping" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-yellow" />
                      </span>
                      live
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { m: 'GPT', active: false },
                      { m: 'Claude', active: true },
                      { m: 'Gemini', active: false },
                      { m: 'Grok', active: false },
                    ].map(({ m, active }) => (
                      <div
                        key={m}
                        className={
                          active
                            ? 'relative px-2 py-2 rounded-lg bg-brand-yellow text-brand-blue text-center text-[11px] font-extrabold shadow-lg shadow-brand-yellow/30'
                            : 'px-2 py-2 rounded-lg bg-brand-offwhite/8 border border-brand-offwhite/15 text-center text-[11px] font-bold text-brand-offwhite/60'
                        }
                      >
                        {m}
                        {active && (
                          <span className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-brand-yellow ring-2 ring-brand-blue" />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2.5 text-[10px] text-brand-offwhite/55 text-center">
                    Daryle picked <span className="text-brand-yellow font-semibold">Claude</span> — best for long-form leadership writing today.
                  </div>
                </div>

                <div className="flex justify-center my-3">
                  <ArrowDown className="h-4 w-4 text-brand-yellow/60" />
                </div>

                {/* Output */}
                <div className="px-5 py-4 rounded-xl bg-brand-yellow text-brand-blue shadow-xl shadow-brand-yellow/30">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold tracking-[0.18em] uppercase">Aligned output</span>
                  </div>
                  <div className="text-sm font-medium leading-relaxed">
                    "Team — here's the Q3 launch update, structured the way leadership prefers, citing the rollout brief and the playbook from Q2…"
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="px-2 py-1.5 rounded-lg bg-brand-blue/10">
                      <div className="text-[9px] tracking-[0.15em] uppercase opacity-70">Sources</div>
                      <div className="font-heading font-extrabold">23</div>
                    </div>
                    <div className="px-2 py-1.5 rounded-lg bg-brand-blue/10">
                      <div className="text-[9px] tracking-[0.15em] uppercase opacity-70">Voice</div>
                      <div className="font-heading font-extrabold">On-brand</div>
                    </div>
                    <div className="px-2 py-1.5 rounded-lg bg-brand-blue/10">
                      <div className="text-[9px] tracking-[0.15em] uppercase opacity-70">Memory</div>
                      <div className="font-heading font-extrabold">12 prior</div>
                    </div>
                  </div>
                </div>

                <p className="mt-7 text-center text-xs text-brand-yellow/80 italic">
                  The organization shows up first. Every time.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* The layer */}
      <section className="pt-24 md:pt-32 pb-12 md:pb-16">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...fadeUp} className="max-w-3xl mb-16">
            <p className="t-overline text-brand-yellow mb-4 font-semibold tracking-[0.2em] uppercase text-xs">What Daryle.AI adds</p>
            <h2 className="font-heading font-bold text-4xl md:text-5xl leading-[1.05] tracking-tight">
              The missing business layer between your people and the best AI models.
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {layerCards.map(({ icon: Icon, title, body }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="group relative p-7 rounded-2xl bg-white border border-brand-blue/10 hover:border-brand-yellow/50 hover:shadow-[0_20px_60px_-20px_hsl(var(--brand-blue)/0.25)] hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-brand-yellow/0 group-hover:bg-brand-yellow/10 blur-2xl transition-colors duration-500" />
                <div className="relative">
                  <div className="h-11 w-11 rounded-xl bg-brand-yellow/15 flex items-center justify-center mb-5 group-hover:bg-brand-yellow group-hover:scale-110 transition-all duration-300">
                    <Icon className="h-5 w-5 text-brand-yellow group-hover:text-brand-blue transition-colors" />
                  </div>
                  <h3 className="font-heading font-bold text-xl mb-2.5 tracking-tight">{title}</h3>
                  <p className="text-sm text-brand-blue/65 leading-relaxed">{body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PROMPT → YOURS → ANSWER — Visual flow */}
      <section className="relative pt-6 md:pt-8 pb-20 md:pb-24 bg-brand-offwhite overflow-hidden">
        <div className="absolute inset-0 -z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-brand-yellow/10 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, hsl(var(--brand-blue)) 1px, transparent 0)',
              backgroundSize: '32px 32px',
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto mb-8 md:mb-10">
            <p className="text-lg text-brand-blue/65 leading-relaxed">
              A simple question becomes a precise, on-brand answer — because Daryle.AI passes it through your knowledge, context, standards, workflows, and memory before it ever reaches a model.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.15fr)_auto_minmax(0,1.25fr)] gap-6 lg:gap-4 items-stretch">
            {/* 1. PROMPT */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="text-[10px] font-bold tracking-[0.22em] uppercase text-brand-blue/45 mb-3">01 · Prompt</div>
              <div className="relative rounded-2xl bg-white border border-brand-blue/10 shadow-lg shadow-brand-blue/5 p-5 h-full">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-brand-blue/5 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-brand-blue/60" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-brand-blue/40 mb-1.5">You ask</div>
                    <p className="font-heading text-[15px] md:text-base leading-snug text-brand-blue">
                      "Draft a Q3 launch update for the leadership team."
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-[10px] uppercase tracking-wider font-semibold text-brand-blue/35">
                  <MessageSquare className="h-3 w-3" />
                  <span>Plain question · 9 words</span>
                </div>
              </div>
            </motion.div>

            {/* arrow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="hidden lg:flex items-center justify-center"
            >
              <ArrowRight className="h-6 w-6 text-brand-blue/30" />
            </motion.div>
            <div className="flex lg:hidden items-center justify-center">
              <ArrowDown className="h-5 w-5 text-brand-blue/30" />
            </div>

            {/* 2. YOURS — the layers */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative"
            >
              <div className="text-[10px] font-bold tracking-[0.22em] uppercase text-brand-yellow mb-3">02 · What's yours</div>
              <div className="relative rounded-2xl bg-brand-blue text-brand-offwhite p-5 md:p-6 h-full overflow-hidden shadow-2xl shadow-brand-blue/30">
                <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-brand-yellow/25 blur-3xl" />
                <div
                  className="absolute inset-0 opacity-[0.06]"
                  style={{
                    backgroundImage:
                      'linear-gradient(hsl(var(--brand-offwhite)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--brand-offwhite)) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                  }}
                />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-yellow">Daryle.AI Layer</span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-brand-offwhite/50">Wrapping your prompt</span>
                  </div>

                  <div className="space-y-2">
                    {[
                      { icon: Database, label: 'Your knowledge', detail: 'Q3 launch docs · roadmap · briefs' },
                      { icon: Compass, label: 'Your context', detail: 'Leadership audience · this quarter' },
                      { icon: Shield, label: 'Your standards', detail: 'Tone · clarity · approval rules' },
                      { icon: Workflow, label: 'Your workflows', detail: 'Exec update template · format' },
                      { icon: Brain, label: 'Your memory', detail: 'Prior updates · open decisions' },
                    ].map((row, i) => (
                      <motion.div
                        key={row.label}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.35, delay: 0.2 + i * 0.06 }}
                        className="flex items-center gap-3 rounded-xl bg-brand-offwhite/[0.06] border border-brand-offwhite/10 px-3 py-2.5"
                      >
                        <div className="h-7 w-7 rounded-lg bg-brand-yellow/15 flex items-center justify-center flex-shrink-0">
                          <row.icon className="h-3.5 w-3.5 text-brand-yellow" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-bold text-brand-offwhite leading-tight">{row.label}</div>
                          <div className="text-[10.5px] text-brand-offwhite/55 truncate">{row.detail}</div>
                        </div>
                        <Check className="h-3.5 w-3.5 text-brand-yellow flex-shrink-0" />
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-brand-offwhite/10 flex items-center justify-between text-[10px] uppercase tracking-wider font-semibold">
                    <span className="text-brand-offwhite/50">Routes to best model</span>
                    <span className="flex items-center gap-1.5 text-brand-yellow">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-yellow animate-pulse" />
                      Claude · long-form
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* arrow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="hidden lg:flex items-center justify-center"
            >
              <ArrowRight className="h-6 w-6 text-brand-yellow" />
            </motion.div>
            <div className="flex lg:hidden items-center justify-center">
              <ArrowDown className="h-5 w-5 text-brand-yellow" />
            </div>

            {/* 3. GREAT ANSWER */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="text-[10px] font-bold tracking-[0.22em] uppercase text-brand-blue/45 mb-3">03 · Great answer</div>
              <div className="relative rounded-2xl bg-white border-2 border-brand-yellow/40 shadow-xl shadow-brand-yellow/20 p-5 h-full overflow-hidden">
                <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-brand-yellow/20 blur-3xl" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-brand-yellow flex items-center justify-center shadow-md shadow-brand-yellow/40">
                        <Sparkles className="h-3.5 w-3.5 text-brand-blue" />
                      </div>
                      <span className="text-[11px] uppercase tracking-[0.18em] font-bold text-brand-blue">Daryle.AI</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-brand-blue/40">Draft v1</span>
                  </div>

                  <div className="rounded-xl bg-brand-offwhite/60 border border-brand-blue/10 p-3.5">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-brand-blue/55 mb-1.5">Subject</div>
                    <div className="font-heading font-bold text-[14px] text-brand-blue leading-snug mb-3">
                      Q3 Launch — On track, three decisions for leadership
                    </div>
                    <div className="space-y-1.5 text-[12px] text-brand-blue/75 leading-relaxed">
                      <p><span className="font-semibold text-brand-blue">Status:</span> Launch confirmed for Sept 18 — engineering and GTM aligned.</p>
                      <p><span className="font-semibold text-brand-blue">Decisions needed:</span> pricing tier, partner co-marketing, exec keynote owner.</p>
                      <p><span className="font-semibold text-brand-blue">Risks:</span> data pipeline cutover (mitigation in motion).</p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {[
                      { k: '23', v: 'Sources' },
                      { k: '100%', v: 'On voice' },
                      { k: '0', v: 'Re-explain' },
                    ].map((s) => (
                      <div key={s.v} className="rounded-lg bg-brand-offwhite/70 border border-brand-blue/10 px-2 py-1.5 text-center">
                        <div className="font-heading font-extrabold text-sm text-brand-blue leading-none">{s.k}</div>
                        <div className="text-[9px] uppercase tracking-wider font-semibold text-brand-blue/50 mt-0.5">{s.v}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {['Grounded', 'On-brand', 'Decision-ready', 'Cited'].map((t) => (
                      <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-blue text-brand-offwhite text-[10px] font-semibold">
                        <Check className="h-2.5 w-2.5 text-brand-yellow" />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Caption strip */}
          <motion.div
            {...fadeUp}
            className="mt-12 max-w-4xl mx-auto text-center"
          >
            <div className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-2 px-5 py-3 rounded-full bg-white border border-brand-blue/10 shadow-sm text-[12px] font-semibold text-brand-blue/70">
              <span className="text-brand-blue/45">Without Daryle.AI:</span>
              <span className="line-through decoration-red-400/40">prompt → model → generic guess</span>
              <span className="h-3 w-px bg-brand-blue/15" />
              <span className="text-brand-blue/45">With Daryle.AI:</span>
              <span className="text-brand-blue">prompt → <span className="text-brand-yellow">your layer</span> + <span className="text-brand-blue/80 italic">Ambassador values layer</span> → great answer</span>
            </div>
            <p className="mt-3 text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-blue/40">
              Wrapped in Ambassador's ethics &amp; values framework
            </p>
          </motion.div>
        </div>
      </section>

      {/* Five shifts */}
      <section className="py-24 bg-white border-y border-brand-blue/5">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center mb-16">
            <p className="t-overline text-brand-yellow mb-4 font-semibold tracking-[0.2em] uppercase text-xs">Why this matters</p>
            <h2 className="font-heading font-bold text-4xl md:text-5xl leading-[1.05] tracking-tight">
              Five shifts your organization gets.
            </h2>
          </motion.div>
          <div className="space-y-4">
            {[
              { from: 'Traditional AI gives answers.', to: 'Daryle.AI gives aligned answers.', body: 'Right context, right tone, right sources, right standards — already in place.' },
              { from: 'Traditional AI depends on the user.', to: 'Daryle.AI supports the user.', body: 'Better outputs without needing prompt-engineering expertise.' },
              { from: 'Traditional AI creates scattered usage.', to: 'Daryle.AI creates a shared system.', body: 'A common environment with shared context, standards, and workflows.' },
              { from: 'Traditional AI is generic.', to: 'Daryle.AI is operational.', body: 'Designed around the work your organization actually needs to do.' },
              { from: 'Traditional AI is rented capability.', to: 'Daryle.AI is owned intelligence infrastructure.', body: 'Your knowledge, workflows, and operating context become part of the system.' },
            ].map((shift, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="group grid md:grid-cols-12 gap-4 p-6 md:p-8 rounded-2xl bg-brand-offwhite/60 border border-brand-blue/5 hover:bg-brand-offwhite hover:border-brand-yellow/30 transition-all"
              >
                <div className="md:col-span-1 font-heading font-extrabold text-3xl md:text-4xl text-brand-yellow tabular-nums">{String(i + 1).padStart(2, '0')}</div>
                <div className="md:col-span-11">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                    <span className="text-brand-blue/40 line-through text-sm md:text-base">{shift.from}</span>
                    <ArrowRight className="hidden md:block h-4 w-4 text-brand-yellow flex-shrink-0" />
                    <span className="font-heading font-bold text-lg md:text-xl tracking-tight">{shift.to}</span>
                  </div>
                  <p className="text-brand-blue/65 leading-relaxed">{shift.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Ambassador intelligence layer — Character, Competency, Chemistry */}
      <section className="py-24 md:py-32 bg-brand-blue/5">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto mb-14">
            <p className="t-overline text-brand-yellow mb-4 font-semibold tracking-[0.2em] uppercase text-xs">The Ambassador intelligence layer</p>
            <h2 className="font-heading font-bold text-4xl md:text-5xl leading-[1.05] tracking-tight text-brand-blue">
              Built on values, not just data.
            </h2>
            <p className="mt-5 text-brand-blue/70 leading-relaxed">
              Your knowledge base teaches Daryle.AI <span className="font-semibold text-brand-blue">what</span> your company knows. Ambassador Daryle and Ambassador Enterprises teach it <span className="font-semibold text-brand-blue">how</span> to think and act — a foundational ethics-and-values intelligence layer trained, curated, and stewarded so every answer carries judgment, not just information.
            </p>
          </motion.div>

          {/* Stack visual: Customer KB → Ambassador layer → Answer */}
          <motion.div
            {...fadeUp}
            className="max-w-3xl mx-auto mb-14"
          >
            <div className="rounded-2xl bg-white border border-brand-blue/10 shadow-sm overflow-hidden">
              <div className="px-5 py-3 flex items-center justify-between border-b border-brand-blue/10">
                <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-brand-blue/55">Layer 01</span>
                <span className="font-heading font-bold text-sm text-brand-blue">Your organizational knowledge base</span>
                <span className="text-[11px] text-brand-blue/45">what your company knows</span>
              </div>
              <div className="px-5 py-3 flex items-center justify-between border-b border-brand-blue/10 bg-brand-yellow/10">
                <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-brand-blue/55">Layer 02</span>
                <span className="font-heading font-bold text-sm text-brand-blue">Ambassador ethics &amp; values intelligence</span>
                <span className="text-[11px] text-brand-blue/55">how to think and act</span>
              </div>
              <div className="px-5 py-3 flex items-center justify-between bg-brand-blue text-brand-offwhite">
                <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-brand-yellow">Result</span>
                <span className="font-heading font-bold text-sm">Decision-ready, principled answers</span>
                <span className="text-[11px] text-brand-offwhite/70">on-brand · on-values</span>
              </div>
            </div>
            <p className="mt-3 text-center text-[11px] uppercase tracking-[0.22em] font-semibold text-brand-blue/40">
              Your knowledge × Ambassador's principles
            </p>
          </motion.div>

          {/* The 3 Cs */}
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: User,
                tag: 'C·01',
                title: 'Character',
                body: 'Integrity, candor, and accountability baked into every response. Daryle.AI is trained to be honest about what it knows, what it doesn\'t, and what it recommends — the way a trusted teammate would be.',
              },
              {
                icon: Brain,
                tag: 'C·02',
                title: 'Competency',
                body: 'Rigorous training across reasoning, judgment, and craft — paired with your knowledge base — so answers are not just plausible, but grounded, sourced, and decision-ready for your team.',
              },
              {
                icon: Users,
                tag: 'C·03',
                title: 'Chemistry',
                body: 'Tuned to work the way your people work. Daryle.AI listens for context, matches tone, and collaborates — so it feels less like a tool and more like a partner your team actually wants to work with.',
              },
            ].map(({ icon: Icon, tag, title, body }) => (
              <motion.div
                key={title}
                {...fadeUp}
                className="rounded-2xl bg-white border border-brand-blue/10 p-7 hover:border-brand-yellow/40 hover:shadow-lg hover:shadow-brand-blue/5 transition-all"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="h-11 w-11 rounded-xl bg-brand-yellow/15 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-brand-yellow" />
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.22em] font-bold text-brand-blue/40">{tag}</span>
                </div>
                <h3 className="font-heading font-bold text-2xl text-brand-blue tracking-tight mb-2">{title}</h3>
                <p className="text-brand-blue/70 leading-relaxed text-[14px]">{body}</p>
              </motion.div>
            ))}
          </div>

          <motion.p
            {...fadeUp}
            className="mt-10 text-center text-[12px] uppercase tracking-[0.22em] font-semibold text-brand-blue/45"
          >
            Daryle's operating principles — the character behind the intelligence.
          </motion.p>
        </div>
      </section>

      {/* Advantages */}
      <section className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto mb-14">
            <p className="t-overline text-brand-yellow mb-4 font-semibold tracking-[0.2em] uppercase text-xs">The Daryle.AI advantage</p>
            <h2 className="font-heading font-bold text-4xl md:text-5xl leading-[1.05] tracking-tight">Six properties that compound over time.</h2>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-brand-blue/10 rounded-3xl overflow-hidden border border-brand-blue/10">
            {advantages.map(({ icon: Icon, title, body }) => (
              <div key={title} className="group p-8 bg-white hover:bg-brand-offwhite/60 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <Icon className="h-6 w-6 text-brand-yellow group-hover:scale-110 transition-transform" />
                  <h3 className="font-heading font-bold text-lg tracking-tight">{title}</h3>
                </div>
                <p className="text-sm text-brand-blue/65 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing comparison */}
      <section className="py-24 md:py-32 bg-white border-y border-brand-blue/5">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto mb-14">
            <p className="t-overline text-brand-yellow mb-4 font-semibold tracking-[0.2em] uppercase text-xs">Pricing</p>
            <h2 className="font-heading font-bold text-4xl md:text-5xl leading-[1.05] tracking-tight">
              More capability.
              <span className="block text-brand-yellow italic font-medium">Less cost.</span>
            </h2>
            <p className="mt-5 text-lg text-brand-blue/65 leading-relaxed">
              One organizational AI layer — for less than a single seat of a frontier model.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5 lg:gap-6 items-stretch">
            {/* Traditional A */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5 }}
              className="relative p-8 rounded-3xl bg-brand-offwhite/60 border border-brand-blue/10 flex flex-col"
            >
              <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-brand-blue/40 mb-3">ChatGPT Plus · Claude Pro</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="font-heading font-extrabold text-5xl text-brand-blue/55 line-through decoration-2 decoration-brand-blue/20">$20</span>
                <span className="text-sm text-brand-blue/45">/mo</span>
              </div>
              <div className="text-xs text-brand-blue/50 mb-6">Per user, single model</div>
              <ul className="space-y-2.5 text-sm text-brand-blue/55">
                {['One model family', 'No company knowledge', 'No shared workflows', 'No governance layer'].map((t) => (
                  <li key={t} className="flex items-start gap-2.5">
                    <X className="h-4 w-4 text-brand-blue/30 mt-0.5 flex-shrink-0" />
                    <span className="line-through decoration-brand-blue/15">{t}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Daryle — featured */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative p-8 rounded-3xl bg-brand-blue text-brand-offwhite border-2 border-brand-yellow shadow-2xl shadow-brand-blue/30 md:-translate-y-4 flex flex-col overflow-hidden"
            >
              <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-brand-yellow/25 blur-3xl" />
              <div className="absolute top-5 right-5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-yellow text-brand-blue text-[10px] font-bold tracking-[0.15em] uppercase">
                  <Sparkles className="h-3 w-3" /> Best value
                </span>
              </div>
              <div className="relative">
                <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-brand-yellow mb-3">Daryle.AI</div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-2xl font-heading font-bold text-brand-offwhite/70">$</span>
                  <span className="font-heading font-extrabold text-6xl tracking-tight">14.99</span>
                  <span className="text-sm text-brand-offwhite/60 ml-1">/mo</span>
                </div>
                <div className="text-xs text-brand-offwhite/60 mb-6">Per user · all frontier models included</div>
                <ul className="space-y-2.5 text-sm">
                  {[
                    'GPT, Claude, Gemini, Grok included',
                    'Your knowledge & sources built in',
                    'Workflows, memory, governance',
                    'One bill, one source of truth',
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2.5">
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-brand-yellow text-brand-blue mt-0.5 flex-shrink-0">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <span className="text-brand-offwhite">{t}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/signup"
                  className="group mt-7 inline-flex items-center justify-center gap-2 w-full bg-brand-yellow text-brand-blue px-6 py-3.5 rounded-full font-bold hover:bg-brand-yellow/90 transition-all"
                >
                  Get started
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </motion.div>

            {/* Traditional B */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="relative p-8 rounded-3xl bg-brand-offwhite/60 border border-brand-blue/10 flex flex-col"
            >
              <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-brand-blue/40 mb-3">Premium / Team tiers</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="font-heading font-extrabold text-5xl text-brand-blue/55 line-through decoration-2 decoration-brand-blue/20">$35</span>
                <span className="text-sm text-brand-blue/45">/mo</span>
              </div>
              <div className="text-xs text-brand-blue/50 mb-6">Per user, still siloed</div>
              <ul className="space-y-2.5 text-sm text-brand-blue/55">
                {['Higher limits, same gaps', 'Still no business context', 'Scattered across vendors', 'Multiple bills to manage'].map((t) => (
                  <li key={t} className="flex items-start gap-2.5">
                    <X className="h-4 w-4 text-brand-blue/30 mt-0.5 flex-shrink-0" />
                    <span className="line-through decoration-brand-blue/15">{t}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Savings strip */}
          <motion.div
            {...fadeUp}
            className="mt-12 max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 px-6 py-5 rounded-2xl bg-brand-yellow/10 border border-brand-yellow/30 text-center"
          >
            <div className="flex items-center gap-2 font-heading font-bold text-brand-blue">
              <Sparkles className="h-4 w-4 text-brand-yellow" />
              Up to <span className="text-brand-yellow text-xl">57% less</span> per seat
            </div>
            <div className="hidden sm:block h-6 w-px bg-brand-blue/15" />
            <div className="text-sm text-brand-blue/70">
              Replaces multiple AI subscriptions with one organizational layer.
            </div>
          </motion.div>
        </div>
      </section>
      {/* Trust & Adoption */}
      <section className="py-24 md:py-32 bg-brand-offwhite">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto mb-16">
            <p className="t-overline text-brand-yellow mb-4 font-semibold tracking-[0.2em] uppercase text-xs">Trust &amp; adoption</p>
            <h2 className="font-heading font-bold text-4xl md:text-5xl leading-[1.05] tracking-tight">
              You can&apos;t fully trust a frontier model.
              <span className="block text-brand-yellow italic font-medium mt-2">You can trust the layer around it.</span>
            </h2>
            <p className="mt-6 text-lg text-brand-blue/65 leading-relaxed">
              Frontier models change. They ship features that may not align with your values, your standards, or the way your organization actually works. Daryle.AI puts the trust boundary where it belongs — around your business.
            </p>
          </motion.div>

          {/* Trust split */}
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5 }}
              className="p-8 md:p-10 rounded-3xl bg-white border border-brand-blue/10"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-11 w-11 rounded-xl bg-brand-blue/5 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-brand-blue/40" />
                </div>
                <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-brand-blue/40">Raw frontier models</span>
              </div>
              <h3 className="font-heading font-bold text-2xl mb-5 leading-tight text-brand-blue/65">
                Out of your control.
              </h3>
              <ul className="space-y-3 text-sm text-brand-blue/55">
                {[
                  'Vendors ship features that may not match your values',
                  'Behavior shifts silently with each model update',
                  'No guarantee outputs reflect how your team works',
                  'Locked into one provider as the market evolves',
                  'Adoption depends on each employee figuring it out',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <X className="h-4 w-4 text-brand-blue/30 mt-0.5 flex-shrink-0" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative p-8 md:p-10 rounded-3xl bg-brand-blue text-brand-offwhite overflow-hidden shadow-2xl shadow-brand-blue/20"
            >
              <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-brand-yellow/20 blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-11 w-11 rounded-xl bg-brand-yellow/20 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-brand-yellow" />
                  </div>
                  <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-brand-yellow">With Daryle.AI</span>
                </div>
                <h3 className="font-heading font-bold text-2xl mb-5 leading-tight">
                  Trust lives in the layer you own.
                </h3>
                <ul className="space-y-3 text-sm">
                  {[
                    'Your standards, sources, and guardrails sit above the model',
                    'Switch or combine models as the market shifts — never locked in',
                    'Always route the best model for the task, today and tomorrow',
                    'Adoption rolls out from the institution, not employee by employee',
                    'Onboarding teaches the company, not just the tool',
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-3">
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-brand-yellow text-brand-blue mt-0.5 flex-shrink-0">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <span className="text-brand-offwhite">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>

          {/* Three pillars */}
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: ShieldCheck,
                title: 'Aligned by design',
                body: 'Your values, voice, and standards wrap every response — no matter which underlying model is used.',
              },
              {
                icon: GitBranch,
                title: 'Never stuck on one model',
                body: 'Use the best frontier model at any moment. Compare answers. Switch as new ones emerge.',
              },
              {
                icon: Rocket,
                title: 'Adoption from the top',
                body: 'AI rollout led by the organization, not improvised by individuals. Easier onboarding, consistent results.',
              },
            ].map(({ icon: Icon, title, body }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group p-7 rounded-2xl bg-white border border-brand-blue/10 hover:border-brand-yellow/40 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="h-11 w-11 rounded-xl bg-brand-yellow/15 flex items-center justify-center mb-5 group-hover:bg-brand-yellow transition-colors">
                  <Icon className="h-5 w-5 text-brand-yellow group-hover:text-brand-blue transition-colors" />
                </div>
                <h3 className="font-heading font-bold text-lg mb-2 tracking-tight">{title}</h3>
                <p className="text-sm text-brand-blue/65 leading-relaxed">{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 bg-brand-blue text-brand-offwhite relative overflow-hidden">
        <div className="absolute inset-0 -z-0 opacity-40">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-brand-yellow/30 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-brand-yellow/15 blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-heading font-extrabold text-4xl md:text-6xl leading-[1.05] tracking-tight mb-6">
            From generic AI access
            <span className="block text-brand-yellow italic font-medium">to organizational intelligence.</span>
          </h2>
          <p className="text-lg text-brand-offwhite/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            Turn the best available AI models into a trusted system built around how your business actually works.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup" className="group inline-flex items-center gap-2 bg-brand-yellow text-brand-blue px-8 py-4 rounded-full font-bold hover:bg-brand-yellow/90 transition-all hover:shadow-2xl hover:-translate-y-0.5">
              Get started <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link to="/contact" className="inline-flex items-center gap-2 border border-brand-offwhite/20 px-8 py-4 rounded-full font-semibold hover:bg-brand-offwhite/5 transition-colors">
              Book a conversation
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default WhyDarylePage;