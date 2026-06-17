import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import VerificationToggle from '@/components/verification/VerificationToggle';
import VerificationLayout from '@/components/verification/VerificationLayout';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, ShieldCheck, Eye, Brain, Scale } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VerificationModePage: React.FC = () => {
  const [enabled, setEnabled] = useState(false);

  return (
    <AdminLayout>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border bg-background/95 backdrop-blur-sm sticky top-16 z-30">
        <div className="flex items-center gap-3">
          <FlaskConical className="h-5 w-5 text-accent" />
          <h1 className="text-lg font-heading font-bold text-foreground">
            Third-Party Verification Mode
          </h1>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-accent/40 text-accent">
            Demo — Internal Preview
          </Badge>
        </div>
        <VerificationToggle enabled={enabled} onToggle={setEnabled} />
      </div>

      {/* Always mount VerificationLayout so ChatInterface stays alive */}
      <div className={enabled ? '' : 'hidden'}>
        <VerificationLayout enabled={enabled} />
      </div>

      {/* Intro hero overlaid when disabled */}
      <AnimatePresence>
        {!enabled && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <IntroHero onEnable={() => setEnabled(true)} />
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

/** Executive-ready intro shown when verification is OFF */
const IntroHero: React.FC<{ onEnable: () => void }> = ({ onEnable }) => (
  <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
    <div className="max-w-2xl mx-auto px-6 text-center space-y-8">
      <div className="flex items-center justify-center gap-4">
        <div className="p-3 rounded-xl bg-accent/10">
          <ShieldCheck className="h-8 w-8 text-accent" />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
          AI Responses, Independently Verified
        </h2>
        <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-lg mx-auto">
          A split-screen experience where the primary assistant operates on the left and an intelligent verification companion provides real-time second-perspective analysis on the right.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <FeaturePill icon={Eye} label="Observe & Assess" />
        <FeaturePill icon={Brain} label="Critical Thinking" />
        <FeaturePill icon={Scale} label="Balanced Perspective" />
        <FeaturePill icon={ShieldCheck} label="Trust Elevation" />
      </div>

      <button
        onClick={onEnable}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-accent-foreground font-medium text-sm hover:bg-accent/90 transition-colors shadow-md hover:shadow-lg"
      >
        <ShieldCheck className="h-4 w-4" />
        Enable Verification Mode
      </button>

      <p className="text-[11px] text-muted-foreground/50">
        Admin-only demo feature · Not user-facing · For stakeholder review
      </p>
    </div>
  </div>
);

const FeaturePill: React.FC<{ icon: React.ElementType; label: string }> = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 border border-border text-xs text-muted-foreground">
    <Icon className="h-3.5 w-3.5" />
    <span>{label}</span>
  </div>
);

export default VerificationModePage;
