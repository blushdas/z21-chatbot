import React from 'react';
import { ShieldCheck, CheckCircle2, HelpCircle, Search, Lightbulb, Loader2, RefreshCw, Clock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { useVerificationContext } from '@/context/VerificationContext';
import { useVerificationCompanion } from '@/hooks/useVerificationCompanion';
import { cn } from '@/lib/utils';

const sectionVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const VerificationPanel: React.FC = () => {
  const ctx = useVerificationContext();
  const lastMsg = ctx?.lastAssistantMessage ?? null;
  const { result, loading, error, reVerify } = useVerificationCompanion(lastMsg);

  return (
    <div className="flex flex-col h-full bg-muted/20">
      {/* Header */}
      <div className={cn(
        "flex items-center gap-2 px-4 py-3 border-b border-border transition-colors duration-300",
        loading ? "bg-accent/5" : "bg-muted/40"
      )}>
        <ShieldCheck className={cn(
          "h-5 w-5 transition-colors",
          loading ? "text-accent animate-pulse" : "text-accent"
        )} />
        <h2 className="text-sm font-semibold text-foreground">Verification Companion</h2>
        <span className="ml-auto text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded">
          Demo
        </span>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4 text-sm">
          <AnimatePresence mode="wait">
            {/* Loading */}
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 gap-4 text-center"
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-accent/10 animate-ping" />
                  <Loader2 className="h-8 w-8 text-accent animate-spin relative z-10" />
                </div>
                <div className="space-y-1">
                  <p className="text-foreground text-xs font-medium">Analyzing response…</p>
                  <p className="text-muted-foreground/60 text-[10px]">Evaluating accuracy, assumptions & claims</p>
                </div>
              </motion.div>
            )}

            {/* Waiting */}
            {!loading && !result && (
              <motion.div
                key="waiting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 gap-4 text-center"
              >
                <div className="p-4 rounded-2xl bg-muted/40">
                  <ShieldCheck className="h-10 w-10 text-muted-foreground/25" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-foreground/70 text-xs font-medium">Awaiting Response</p>
                  <p className="text-muted-foreground/40 max-w-[200px] text-[11px] leading-relaxed">
                    Send a message in the main chat to receive third-party verification.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Result */}
            {!loading && result && (
              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-1"
              >
                {/* Timestamp */}
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50 mb-3">
                  <Clock className="h-3 w-3" />
                  <span>Verified {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {error && (
                    <span className="ml-2 text-amber-500/70">· heuristic mode</span>
                  )}
                </div>

                {/* Error fallback notice */}
                {error && (
                  <div className="text-[10px] text-amber-600 bg-amber-500/5 rounded-lg px-3 py-2 mb-3 border border-amber-500/20">
                    ⚠ Live AI analysis unavailable — showing rules-based heuristic review
                  </div>
                )}

                <Section index={0} icon={CheckCircle2} title="What Seems Solid" color="text-green-500" bgColor="bg-green-500/10" borderColor="border-green-500/20" content={result.whatSeemssolid} />
                <Separator className="my-3 opacity-50" />
                <Section index={1} icon={HelpCircle} title="What to Question" color="text-amber-500" bgColor="bg-amber-500/10" borderColor="border-amber-500/20" content={result.whatToQuestion} />
                <Separator className="my-3 opacity-50" />
                <Section index={2} icon={Search} title="What to Verify" color="text-blue-500" bgColor="bg-blue-500/10" borderColor="border-blue-500/20" content={result.whatToVerify} />
                <Separator className="my-3 opacity-50" />
                <Section index={3} icon={Lightbulb} title="Companion Perspective" color="text-accent" bgColor="bg-accent/10" borderColor="border-accent/20" content={result.companionPerspective} />

                {/* Re-verify */}
                <div className="pt-5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs gap-2 border-dashed hover:border-accent/40 hover:text-accent transition-colors"
                    onClick={reVerify}
                    disabled={loading}
                  >
                    <RefreshCw className="h-3 w-3" />
                    Re-verify Response
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
};

const Section: React.FC<{
  index: number;
  icon: React.ElementType;
  title: string;
  color: string;
  bgColor: string;
  borderColor: string;
  content: string;
}> = ({ index, icon: Icon, title, color, bgColor, borderColor, content }) => (
  <motion.div
    custom={index}
    initial="hidden"
    animate="visible"
    variants={sectionVariants}
    className="space-y-2"
  >
    <div className="flex items-center gap-2">
      <div className={cn("p-1.5 rounded-md border", bgColor, borderColor)}>
        <Icon className={cn("h-3.5 w-3.5", color)} />
      </div>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">{title}</span>
    </div>
    <p className="pl-8 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{content}</p>
  </motion.div>
);

export default VerificationPanel;
