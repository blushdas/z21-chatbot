import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, Building2, Layers, Compass, Workflow, TrendingUp, Telescope } from 'lucide-react';

type Slide = { id: number; render: () => React.ReactNode };

const NAVY = '#0B1F3A';
const GOLD = '#C9A24C';
const CREAM = '#F5F0E6';

const Chip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-[var(--gold)]/40 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-[var(--gold)]">
    {children}
  </span>
);

const SectionTitle: React.FC<{ kicker?: string; title: string; sub?: string }> = ({ kicker, title, sub }) => (
  <div className="mb-10">
    {kicker && <Chip>{kicker}</Chip>}
    <h2 className="mt-4 font-serif text-5xl md:text-6xl leading-tight text-white">{title}</h2>
    {sub && <p className="mt-3 max-w-3xl text-lg text-white/70">{sub}</p>}
  </div>
);

const Card: React.FC<{ label: string; body: string; tone?: 'pos' | 'neg' | 'neutral' }> = ({ label, body, tone = 'neutral' }) => {
  const accent = tone === 'pos' ? 'border-emerald-400/30' : tone === 'neg' ? 'border-rose-400/30' : 'border-white/10';
  return (
    <div className={`rounded-2xl border ${accent} bg-white/[0.03] p-6 backdrop-blur`}>
      <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--gold)]">{label}</div>
      <p className="mt-3 text-white/85 leading-relaxed">{body}</p>
    </div>
  );
};

const Row: React.FC<{ left: string; right: string; tone?: 'pos' | 'neg' }> = ({ left, right, tone }) => (
  <div className="grid grid-cols-12 gap-4 border-t border-white/10 py-4">
    <div className="col-span-12 md:col-span-4 text-white/60 text-sm md:text-base">{left}</div>
    <div className={`col-span-12 md:col-span-8 text-base md:text-lg ${tone === 'pos' ? 'text-emerald-200' : tone === 'neg' ? 'text-rose-200' : 'text-white'}`}>{right}</div>
  </div>
);

const slides: Slide[] = [
  {
    id: 1,
    render: () => (
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden" style={{ background: '#0a0a0c' }}>
        {/* Ambient radial glows */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(224,172,105,0.10) 0%, transparent 70%)' }}
          />
          <div
            className="absolute -left-24 -top-24 h-96 w-96 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(141,91,76,0.07) 0%, transparent 70%)' }}
          />
          <div
            className="absolute -bottom-24 -right-24 h-[28rem] w-[28rem] blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(201,162,76,0.06) 0%, transparent 70%)' }}
          />
        </div>

        {/* Giant faint monogram */}
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 0.04, scale: 1 }}
          transition={{ duration: 1.6, ease: 'easeOut' }}
          className="pointer-events-none absolute inset-0 flex select-none items-center justify-center"
        >
          <span className="font-serif leading-none text-white" style={{ fontSize: 'min(70vw, 48rem)', fontWeight: 300 }}>
            A
          </span>
        </motion.div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-8">
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 0.6 }}
            transition={{ delay: 0.2, duration: 0.9 }}
            className="mb-10 h-px w-16 origin-center"
            style={{ background: 'linear-gradient(to right, transparent, #e0ac69, transparent)' }}
          />

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.9, ease: 'easeOut' }}
            className="flex items-baseline gap-2 font-serif"
          >
            <span
              className="text-6xl md:text-8xl lg:text-9xl font-semibold tracking-tight"
              style={{
                background: 'linear-gradient(to bottom, #f3e3d3 0%, #e0ac69 55%, #8d5b4c 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              AmbassadorWay
            </span>
            <span
              className="text-2xl md:text-4xl font-light tracking-[0.2em]"
              style={{ color: 'rgba(224,172,105,0.65)', fontFamily: 'Inter, ui-sans-serif, system-ui' }}
            >
              .AI
            </span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="mt-8 flex items-center gap-6"
          >
            <div className="h-px w-10" style={{ background: 'rgba(224,172,105,0.25)' }} />
            <p
              className="text-xs md:text-sm font-light uppercase tracking-[0.45em]"
              style={{ color: 'rgba(243,227,211,0.75)', fontFamily: 'Inter, ui-sans-serif, system-ui' }}
            >
              An Introduction
            </p>
            <div className="h-px w-10" style={{ background: 'rgba(224,172,105,0.25)' }} />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95, duration: 0.8 }}
            className="mt-16 font-serif italic text-lg md:text-xl"
            style={{ color: 'rgba(224,172,105,0.55)' }}
          >
            Where artificial intelligence meets institutional heritage
          </motion.p>
        </div>

        {/* Corner ornaments */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="absolute left-10 top-10 flex items-center gap-3"
        >
          <div className="h-px w-10" style={{ background: 'rgba(224,172,105,0.35)' }} />
          <span className="text-[10px] uppercase tracking-[0.35em]" style={{ color: 'rgba(224,172,105,0.55)', fontFamily: 'Inter' }}>
            Confidential · 2026
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute bottom-10 left-10 flex flex-col gap-2"
        >
          <div className="h-12 w-px" style={{ background: 'linear-gradient(to bottom, transparent, rgba(224,172,105,0.4))' }} />
          <span className="text-[10px] uppercase tracking-[0.35em]" style={{ color: 'rgba(224,172,105,0.5)', fontFamily: 'Inter' }}>
            MMXXVI
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute bottom-10 right-10 flex flex-col items-end gap-2"
        >
          <span className="text-[10px] uppercase tracking-[0.35em]" style={{ color: 'rgba(224,172,105,0.5)', fontFamily: 'Inter' }}>
            Vol. I
          </span>
          <div className="h-px w-12" style={{ background: 'rgba(224,172,105,0.4)' }} />
        </motion.div>
      </div>
    ),
  },
  {
    id: 2,
    render: () => (
      <div className="relative h-full w-full overflow-hidden" style={{ background: '#0a0a0c' }}>
        {/* Rootless decorative lines */}
        <div className="pointer-events-none absolute right-24 top-0 h-32 w-px" style={{ background: 'linear-gradient(to bottom, rgba(224,172,105,0.4), transparent)' }} />
        <div className="pointer-events-none absolute bottom-32 left-24 h-px w-32" style={{ background: 'linear-gradient(to right, transparent, rgba(224,172,105,0.2))' }} />
        <div className="pointer-events-none absolute -right-32 top-1/3 h-80 w-80 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(224,172,105,0.06), transparent 70%)' }} />

        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-between px-14 py-14">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="mb-5 text-[10px] uppercase tracking-[0.4em]" style={{ color: '#e0ac69', fontFamily: 'Inter' }}>
              AmbassadorWay.ai &nbsp;//&nbsp; The Landscape · 01
            </p>
            <h1 className="font-serif text-5xl md:text-6xl font-light italic leading-tight text-white">
              Public AI <span className="not-italic" style={{ color: '#e0ac69' }}>—</span> <span style={{ color: '#e0ac69' }}>Powerful</span>, but rented and rootless.
            </h1>
          </motion.header>

          {/* Three columns */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="grid grid-cols-1 gap-12 md:grid-cols-3"
          >
            {/* What It Is */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-px w-4" style={{ background: '#e0ac69' }} />
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.25em]" style={{ color: 'rgba(224,172,109,0.85)', fontFamily: 'Inter' }}>
                  What It Is
                </h2>
              </div>
              <p className="text-base font-light leading-relaxed text-slate-300" style={{ fontFamily: 'Inter' }}>
                Public models like <span className="font-medium text-white">ChatGPT, Gemini,</span> and <span className="font-medium text-white">Claude</span> — trained on the sum of the world's accessible knowledge.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-px w-4" style={{ background: '#e0ac69' }} />
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.25em]" style={{ color: 'rgba(224,172,109,0.85)', fontFamily: 'Inter' }}>
                  Benefits
                </h2>
              </div>
              <ul className="space-y-3 text-sm font-light text-slate-300" style={{ fontFamily: 'Inter' }}>
                {['Vast knowledge and broad reasoning', 'Excellence in research and synthesis', 'Universal writing & financial modeling'].map((b) => (
                  <li key={b} className="flex items-baseline gap-3">
                    <span className="text-xs" style={{ color: '#e0ac69' }}>+</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Risks */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-px w-4 bg-rose-400/60" />
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-rose-300/80" style={{ fontFamily: 'Inter' }}>
                  The Risks
                </h2>
              </div>
              <ul className="space-y-3 text-sm font-light text-slate-300" style={{ fontFamily: 'Inter' }}>
                <li className="flex items-baseline gap-3">
                  <span className="text-xs text-rose-400/70">•</span>
                  <span>Knows the world, but knows nothing of <em className="font-serif italic text-white">us</em></span>
                </li>
                <li className="flex items-baseline gap-3">
                  <span className="text-xs text-rose-400/70">•</span>
                  <span>Values and guardrails set by others</span>
                </li>
                <li className="flex items-baseline gap-3">
                  <span className="text-xs text-rose-400/70">•</span>
                  <span>We rent the intellect; we never own it</span>
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Footer quote */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="flex justify-end border-t border-white/10 pt-8"
          >
            <blockquote className="max-w-lg text-right font-serif text-2xl italic leading-snug text-slate-400">
              &ldquo;The brilliant consultant who just walked in — encyclopedic. <span className="text-white">But has never met us.</span>&rdquo;
            </blockquote>
          </motion.footer>
        </div>

        {/* Tiny rented dot ornament */}
        <div className="absolute bottom-6 left-16 flex items-center gap-1.5">
          <div className="h-1 w-1 rounded-full" style={{ background: 'rgba(224,172,105,0.4)' }} />
          <div className="h-1 w-8 rounded-full" style={{ background: 'rgba(224,172,105,0.15)' }} />
        </div>
      </div>
    ),
  },
  {
    id: 3,
    render: () => (
      <div className="relative h-full w-full overflow-hidden" style={{ background: '#0a0a0c' }}>
        {/* Walled-in metaphor: vertical "gate" bars */}
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-stretch gap-3 pl-6 opacity-50">
          <div className="w-px" style={{ background: 'linear-gradient(to bottom, transparent, rgba(224,172,105,0.35), transparent)' }} />
          <div className="w-px" style={{ background: 'linear-gradient(to bottom, transparent, rgba(224,172,105,0.2), transparent)' }} />
          <div className="w-px" style={{ background: 'linear-gradient(to bottom, transparent, rgba(224,172,105,0.1), transparent)' }} />
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-stretch gap-3 pr-6 opacity-50">
          <div className="w-px" style={{ background: 'linear-gradient(to bottom, transparent, rgba(224,172,105,0.1), transparent)' }} />
          <div className="w-px" style={{ background: 'linear-gradient(to bottom, transparent, rgba(224,172,105,0.2), transparent)' }} />
          <div className="w-px" style={{ background: 'linear-gradient(to bottom, transparent, rgba(224,172,105,0.35), transparent)' }} />
        </div>
        <div className="pointer-events-none absolute -left-32 top-1/4 h-80 w-80 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(141,91,76,0.08), transparent 70%)' }} />

        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-between px-14 py-14">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="mb-5 text-[10px] uppercase tracking-[0.4em]" style={{ color: '#e0ac69', fontFamily: 'Inter' }}>
              AmbassadorWay.ai &nbsp;//&nbsp; The Landscape · 02
            </p>
            <h1 className="font-serif text-5xl md:text-6xl font-light italic leading-tight text-white">
              Institutional AI <span className="not-italic" style={{ color: '#e0ac69' }}>—</span> <span style={{ color: '#e0ac69' }}>Ours</span>, but walled in.
            </h1>
          </motion.header>

          {/* Three columns */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="grid grid-cols-1 gap-12 md:grid-cols-3"
          >
            {/* What It Is */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-px w-4" style={{ background: '#e0ac69' }} />
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.25em]" style={{ color: 'rgba(224,172,109,0.85)', fontFamily: 'Inter' }}>
                  What It Is
                </h2>
              </div>
              <p className="text-base font-light leading-relaxed text-slate-300" style={{ fontFamily: 'Inter' }}>
                AI grounded in a company's <span className="font-medium text-white">IP, values, practices,</span> and <span className="font-medium text-white">playbooks</span> — fluent in the house, blind to the world.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-px w-4 bg-emerald-400/70" />
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-300/85" style={{ fontFamily: 'Inter' }}>
                  Benefits
                </h2>
              </div>
              <ul className="space-y-3 text-sm font-light text-slate-300" style={{ fontFamily: 'Inter' }}>
                {[
                  'Speaks the mission natively',
                  'Thinks like the company',
                  'Sees every problem through its values',
                ].map((b) => (
                  <li key={b} className="flex items-baseline gap-3">
                    <span className="text-xs text-emerald-400/80">+</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Risks */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-px w-4 bg-rose-400/60" />
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-rose-300/80" style={{ fontFamily: 'Inter' }}>
                  The Risks
                </h2>
              </div>
              <ul className="space-y-3 text-sm font-light text-slate-300" style={{ fontFamily: 'Inter' }}>
                <li className="flex items-baseline gap-3">
                  <span className="text-xs text-rose-400/70">•</span>
                  <span>Narrow — knows <em className="font-serif italic text-white">us</em> but not the world</span>
                </li>
                <li className="flex items-baseline gap-3">
                  <span className="text-xs text-rose-400/70">•</span>
                  <span>Blind to outside frontier intelligence</span>
                </li>
                <li className="flex items-baseline gap-3">
                  <span className="text-xs text-rose-400/70">•</span>
                  <span>Only as good as the IP behind it</span>
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Footer quote — left-aligned to mirror slide 2 */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="flex justify-start border-t border-white/10 pt-8"
          >
            <blockquote className="max-w-lg text-left font-serif text-2xl italic leading-snug text-slate-400">
              &ldquo;The 20-year veteran who knows the company — <span className="text-white">whose world ends at the company gates.</span>&rdquo;
            </blockquote>
          </motion.footer>
        </div>

        {/* Walled ornament: closed bracket */}
        <div className="absolute bottom-6 right-16 flex items-center gap-1.5">
          <div className="h-1 w-8 rounded-full" style={{ background: 'rgba(224,172,105,0.15)' }} />
          <div className="h-1 w-1 rounded-full" style={{ background: 'rgba(224,172,105,0.4)' }} />
        </div>
      </div>
    ),
  },
  {
    id: 4,
    render: () => (
      <div className="relative h-full w-full overflow-hidden" style={{ background: '#0a0a0c' }}>
        {/* Synthesis radial glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(224,172,105,0.07), transparent 70%)' }} />
        <div className="pointer-events-none absolute right-16 top-24 h-px w-40" style={{ background: 'linear-gradient(to right, transparent, rgba(224,172,105,0.35))' }} />
        <div className="pointer-events-none absolute left-16 bottom-40 h-px w-40" style={{ background: 'linear-gradient(to right, rgba(224,172,105,0.35), transparent)' }} />

        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-between gap-12 px-14 py-14">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-5"
          >
            <div className="flex items-center gap-4">
              <span className="rounded-full border border-[#e0ac69]/30 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.25em]" style={{ color: '#e0ac69', fontFamily: 'Inter' }}>
                The Synthesis · 03
              </span>
              <div className="h-px w-24" style={{ background: 'linear-gradient(to right, rgba(224,172,105,0.35), transparent)' }} />
            </div>
            <div className="space-y-3">
              <h1 className="font-serif text-6xl md:text-7xl font-light leading-[1.05] tracking-tight text-white">
                AmbassadorWay<span style={{ color: '#e0ac69' }}>.</span>ai
              </h1>
              <p className="max-w-xl text-base font-light leading-relaxed text-white/55" style={{ fontFamily: 'Inter' }}>
                An IP-grounded, multi-model enterprise AI — <span className="text-white/85">built for, and owned by, AE.</span>
              </p>
            </div>
          </motion.header>

          {/* Three pillars */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="grid grid-cols-1 gap-8 md:grid-cols-3"
          >
            {[
              { n: '01.', t: 'AE Knowledge', d: "The mission, values, principles, and playbooks at the core. Intellectual capital distilled into digital intuition." },
              { n: '02.', t: 'Affiliate Companies', d: 'The specialized knowledge of each affiliate, layered in. A network effect of cross-domain expertise.' },
              { n: '03.', t: 'Public Domain', d: "Frontier model intelligence, on tap, alongside our IP. The world's knowledge, contextualized by ours." },
            ].map((p) => (
              <div
                key={p.t}
                className="group relative border-l border-white/10 p-8 transition-colors duration-500 hover:border-[#e0ac69]/40"
              >
                <span className="mb-6 block font-serif text-4xl italic" style={{ color: '#e0ac69' }}>{p.n}</span>
                <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.2em] text-white" style={{ fontFamily: 'Inter' }}>
                  {p.t}
                </h3>
                <p className="text-sm font-light leading-relaxed text-white/55" style={{ fontFamily: 'Inter' }}>
                  {p.d}
                </p>
              </div>
            ))}
          </motion.div>

          {/* Footer: benefit / risk / quote */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="space-y-10 border-t border-white/5 pt-10"
          >
            <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
              <div className="flex items-start gap-6">
                <div className="h-12 w-px bg-emerald-500/40" />
                <div>
                  <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-400/80" style={{ fontFamily: 'Inter' }}>
                    Benefit
                  </span>
                  <p className="text-sm text-white/80" style={{ fontFamily: 'Inter' }}>
                    Integrated wisdom — <span className="text-emerald-300/90">owned, not rented.</span>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-6">
                <div className="h-12 w-px bg-rose-500/40" />
                <div>
                  <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.25em] text-rose-400/80" style={{ fontFamily: 'Inter' }}>
                    Risk
                  </span>
                  <p className="text-sm text-white/80" style={{ fontFamily: 'Inter' }}>
                    A living system — <span className="text-rose-300/90">requires ongoing updates to stay sharp.</span>
                  </p>
                </div>
              </div>
            </div>

            <blockquote
              className="max-w-3xl border-l-2 pl-8 font-serif text-2xl italic leading-snug text-white/90 md:text-3xl"
              style={{ borderColor: '#e0ac69' }}
            >
              &ldquo;A trusted advisor with an outsider&rsquo;s breadth and an insider&rsquo;s depth.&rdquo;
            </blockquote>
          </motion.div>
        </div>
      </div>
    ),
  },
  {
    id: 5,
    render: () => (
      <div className="relative h-full w-full overflow-hidden" style={{ background: '#0a0a0c' }}>
        {/* Cathedral-light ambient glows */}
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full blur-3xl" style={{ background: 'radial-gradient(ellipse, rgba(224,172,105,0.10), transparent 70%)' }} />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-[280px] w-[500px] -translate-x-1/2 translate-y-1/3 rounded-full blur-3xl" style={{ background: 'radial-gradient(ellipse, rgba(224,172,105,0.06), transparent 70%)' }} />
        {/* Cross-hair editorial rules */}
        <div className="pointer-events-none absolute left-16 top-1/2 h-px w-40" style={{ background: 'linear-gradient(to right, rgba(224,172,105,0.35), transparent)' }} />
        <div className="pointer-events-none absolute right-16 top-1/2 h-px w-40" style={{ background: 'linear-gradient(to left, rgba(224,172,105,0.35), transparent)' }} />

        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-between gap-10 px-14 py-14">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-5 flex items-center gap-4">
              <span className="rounded-full border border-[#e0ac69]/30 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.25em]" style={{ color: '#e0ac69', fontFamily: 'Inter' }}>
                Why It Matters · 04
              </span>
              <div className="h-px w-24" style={{ background: 'linear-gradient(to right, rgba(224,172,105,0.35), transparent)' }} />
            </div>
            <h1 className="font-serif text-5xl md:text-6xl font-light italic leading-tight text-white">
              Built for a <span className="not-italic" style={{ color: '#e0ac69' }}>Christ-centered</span> enterprise.
            </h1>
            <p className="mt-4 max-w-2xl text-base font-light leading-relaxed text-white/55" style={{ fontFamily: 'Inter' }}>
              AE stewards capital, companies, and leaders across generations. That calling needs AI built not just to perform — <span className="text-white/85">but to preserve and advance.</span>
            </p>
          </motion.header>

          {/* Five-row editorial ledger */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="flex flex-col"
          >
            {[
              ['I',   'Mission & Values',     'Keeps the AE ecosystem aligned and united.'],
              ['II',  'Founder Intent',       "Promotes Daryle and Brenda Doden's legacy across generations."],
              ['III', '3Returns Philosophy',  'Financial, cultural, and eternal returns — on the table in every decision.'],
              ['IV',  'Collective Know-How',  'Best practices shared across companies and leaders — today, and in 2126.'],
              ['V',   'Stewardship Legacy',   'Supports responsible decision-making, governance, and succession.'],
            ].map(([num, label, body], idx) => (
              <div
                key={label}
                className={`group grid grid-cols-12 items-baseline gap-6 py-4 transition-colors duration-500 ${idx !== 0 ? 'border-t border-white/[0.06]' : ''}`}
              >
                <div className="col-span-1 font-serif text-xl italic tracking-wider transition-colors group-hover:text-[#e0ac69]" style={{ color: 'rgba(224,172,105,0.55)' }}>
                  {num}.
                </div>
                <div className="col-span-4 text-[13px] font-semibold uppercase tracking-[0.18em] text-white transition-colors" style={{ fontFamily: 'Inter' }}>
                  {label}
                </div>
                <div className="col-span-7 font-serif text-lg font-light leading-snug text-white/65">
                  {body}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Footer pull quote */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="flex justify-center border-t border-white/10 pt-8"
          >
            <blockquote className="max-w-3xl text-center font-serif text-2xl italic leading-snug text-white/85">
              Helps AE <span style={{ color: '#e0ac69' }}>remember</span>, <span style={{ color: '#e0ac69' }}>reason</span>, and <span style={{ color: '#e0ac69' }}>act</span> in alignment with who it is.
            </blockquote>
          </motion.footer>
        </div>

        {/* Roman numeral ornament */}
        <div className="absolute bottom-6 right-16 flex items-center gap-3">
          <span className="font-serif text-xs italic" style={{ color: 'rgba(224,172,105,0.4)', fontFamily: 'Cormorant Garamond' }}>MMXXVI</span>
          <div className="h-px w-10" style={{ background: 'rgba(224,172,105,0.3)' }} />
        </div>
      </div>
    ),
  },
  {
    id: 6,
    render: () => (
      <div className="relative h-full w-full overflow-hidden bg-[#0a0a0c]">
        {/* Ambient cathedral glow */}
        <div
          className="pointer-events-none absolute -top-40 left-1/2 h-[640px] w-[1100px] -translate-x-1/2 blur-3xl"
          style={{ background: 'radial-gradient(ellipse at center, rgba(224,172,105,0.12), transparent 70%)' }}
        />
        {/* Cross-hair editorial rules */}
        <div className="pointer-events-none absolute left-12 right-12 top-24 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(224,172,105,0.45), transparent)' }} />
        <div className="pointer-events-none absolute left-12 right-12 bottom-24 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(224,172,105,0.25), transparent)' }} />

        <div className="relative mx-auto flex h-full max-w-[1180px] flex-col px-12 pt-14 pb-14">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-end justify-between"
          >
            <div>
              <div className="text-[11px] uppercase tracking-[0.45em] text-[var(--chat-muted)]">
                AmbassadorWay<span className="text-[#e0ac69]">.ai</span> · 2026
              </div>
              <h2 className="mt-4 font-serif text-[64px] leading-[0.95] tracking-tight text-white">
                What It <em className="not-italic text-[#e0ac69] italic">Does</em> Today
              </h2>
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/55">
                A daily operating rhythm — seven verbs that turn what AE knows into what AE does.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.35em] text-[var(--chat-muted)]">
              <span>The Practice</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#e0ac69]" />
              <span>05</span>
            </div>
          </motion.header>

          {/* Verb ledger — flowing horizontal rhythm */}
          <div className="mt-12 flex-1">
            <div className="grid grid-cols-12 gap-x-8 gap-y-6">
              {[
                ['I', 'Access', "Tap the world's best AI models alongside AE's own knowledge."],
                ['II', 'Find', 'Integrate trusted AE knowledge in seconds.'],
                ['III', 'Think', 'Apply our mission, values, and leadership principles.'],
                ['IV', 'Decide', 'Frame options, risks, and next steps.'],
                ['V', 'Record', 'Capture new decisions, lessons, and case studies.'],
                ['VI', 'Learn', 'Turn lessons into leadership development.'],
                ['VII', 'Share', 'Carry learning across companies, leaders, and generations.'],
              ].map(([num, verb, body], idx) => (
                <motion.div
                  key={verb}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 + idx * 0.06 }}
                  className={`group relative ${idx === 6 ? 'col-span-12' : 'col-span-6'} border-t border-white/10 pt-5 transition-colors hover:border-[#e0ac69]/40`}
                >
                  <div className="flex items-baseline gap-5">
                    <div className="font-serif text-[13px] tracking-[0.2em] text-[#e0ac69]/70 w-8 shrink-0">{num}</div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-4">
                        <h3 className="font-serif text-3xl text-white tracking-tight transition-colors group-hover:text-[#e0ac69]">
                          {verb}
                        </h3>
                        <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                      </div>
                      <p className="mt-2 text-[14px] leading-relaxed text-white/60">{body}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer pull-quote */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-10 flex items-center justify-center"
          >
            <div className="relative max-w-3xl text-center">
              <span className="absolute -left-6 top-0 font-serif text-4xl leading-none text-[#e0ac69]/40">“</span>
              <p className="font-serif text-xl italic text-white/80 leading-snug">
                It helps AE <span className="text-[#e0ac69] not-italic">find</span> what it knows,{' '}
                <span className="text-[#e0ac69] not-italic">apply</span> what it believes, and{' '}
                <span className="text-[#e0ac69] not-italic">preserve</span> what it learns.
              </p>
              <span className="absolute -right-6 bottom-0 font-serif text-4xl leading-none text-[#e0ac69]/40">”</span>
            </div>
          </motion.footer>
        </div>
      </div>
    ),
  },
  {
    id: 7,
    render: () => (
      <div className="mx-auto max-w-6xl px-10 py-14">
        <SectionTitle kicker="2027 Horizon" title="What It Could Do Next" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            [Telescope, 'Investor Mode', 'Due diligence and PE opportunity vetting against market standards, mission fit, and portfolio alignment.'],
            [Workflow, 'Raise · Hold · Fold Mode', 'Automates the RHF process with history, tracking, company analysis, longitudinal trends, and quarterly data.'],
            [Compass, 'AmbassadorWay.ai App', 'Mobile version for on-the-go access to models, institutional knowledge, and decision support.'],
            [Sparkles, 'Coaching Mode', 'Hybrid executive leadership coaching paths that pair members with designated coaches.'],
            [Layers, 'Advanced Profiles', 'Team member assessments, preferences, and career trajectories for personalized engagement.'],
            [TrendingUp, 'Advanced Data Analysis', 'Identifies common needs, reads the pulse of the workforce, and empowers excellence.'],
          ].map(([Icon, t, d]) => {
            const I = Icon as React.ComponentType<{ className?: string }>;
            return (
              <div key={t as string} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-[var(--gold)]/15 p-2"><I className="h-5 w-5 text-[var(--gold)]" /></div>
                  <div className="text-white text-lg font-semibold">{t as string}</div>
                </div>
                <p className="mt-3 text-white/70 text-sm leading-relaxed">{d as string}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-8 text-center text-lg text-white/80 italic">
          By 2027, AmbassadorWay.ai could guide strategic decisions, coach leaders, and mobilize the health of the ecosystem.
        </p>
      </div>
    ),
  },
  {
    id: 8,
    render: () => (
      <div className="mx-auto max-w-6xl px-10 py-14">
        <SectionTitle kicker="The Opportunity" title="An asset that grows wiser every year" sub="Every institution loses knowledge as it grows. AE can be an exception." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-rose-400/20 bg-rose-500/[0.04] p-6">
            <div className="text-[10px] uppercase tracking-[0.25em] text-rose-300/80">Without It</div>
            <ul className="mt-4 space-y-3 text-white/80">
              <li>Knowledge leaves when people do.</li>
              <li>Each leader starts from scratch.</li>
              <li>Growth pulls the ecosystem apart.</li>
              <li>Decisions repeat old mistakes.</li>
              <li>Wisdom sits siloed in individuals.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/[0.05] p-6">
            <div className="text-[10px] uppercase tracking-[0.25em] text-emerald-300/90">With AmbassadorWay.ai</div>
            <ul className="mt-4 space-y-3 text-white">
              <li>Knowledge stays — and builds on itself.</li>
              <li>Each leader starts from all we've learned.</li>
              <li>Growth gives more wisdom to the whole.</li>
              <li>Decisions build on every lesson.</li>
              <li>Wisdom flows across the ecosystem.</li>
            </ul>
          </div>
        </div>
        <p className="mt-10 text-center font-serif text-3xl text-[var(--gold)]">
          Not just better AI — an asset we own that compounds.
        </p>
        <div className="mt-12 flex justify-center">
          <Chip><Building2 className="h-3.5 w-3.5" /> AmbassadorWay.ai · 2026</Chip>
        </div>
      </div>
    ),
  },
];

const AmbassadorWayPitchPage: React.FC = () => {
  const [i, setI] = useState(0);
  const go = useCallback((d: number) => setI((p) => Math.max(0, Math.min(slides.length - 1, p + d))), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(-1); }
      if (e.key === 'Home') setI(0);
      if (e.key === 'End') setI(slides.length - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  useEffect(() => {
    document.title = 'AmbassadorWay.ai — An Introduction';
  }, []);

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{
        background: `radial-gradient(1200px 600px at 20% 10%, rgba(201,162,76,0.12), transparent 60%), radial-gradient(1000px 500px at 80% 90%, rgba(201,162,76,0.08), transparent 60%), ${NAVY}`,
        ['--gold' as never]: GOLD,
        ['--cream' as never]: CREAM,
      }}
    >
      <style>{`
        .font-serif { font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif; }
      `}</style>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-8 py-5">
        <div className="text-white/80 text-sm tracking-[0.3em] uppercase">AmbassadorWay<span className="text-[var(--gold)]">.ai</span></div>
        <div className="text-[var(--chat-muted)] text-xs tracking-[0.3em] uppercase">{String(i + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</div>
      </div>

      {/* Slide area */}
      <div className="relative z-10 flex min-h-screen items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={slides[i].id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            {slides[i].render()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="absolute bottom-6 inset-x-0 z-20 flex items-center justify-center gap-4">
        <button
          onClick={() => go(-1)}
          disabled={i === 0}
          className="rounded-full border border-white/20 bg-white/5 p-3 text-white/80 transition hover:bg-[var(--ui-bg-hover)] disabled:opacity-30"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              className={`h-1.5 rounded-full transition-all ${idx === i ? 'w-8 bg-[var(--gold)]' : 'w-3 bg-white/25 hover:bg-white/50'}`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
        <button
          onClick={() => go(1)}
          disabled={i === slides.length - 1}
          className="rounded-full border border-white/20 bg-white/5 p-3 text-white/80 transition hover:bg-[var(--ui-bg-hover)] disabled:opacity-30"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default AmbassadorWayPitchPage;