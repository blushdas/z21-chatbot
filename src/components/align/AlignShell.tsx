import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AlignShellProps {
  children: React.ReactNode;
  /** Eyebrow text (e.g. "ALIGN Discovery"). */
  eyebrow?: string;
  /** Page title — large display heading on the brand-blue hero band. */
  title?: string;
  /** Short subtitle shown under the title. */
  subtitle?: string;
  /** Optional CTA rendered inside the hero band. */
  cta?: React.ReactNode;
  /** Slot rendered under the hero (e.g. step nav). */
  heroExtra?: React.ReactNode;
  /** Constrain content width (default 3xl). */
  maxWidth?: "3xl" | "4xl" | "5xl";
  /** Tight variant: omit large hero (used for in-survey pages). */
  compact?: boolean;
  /** Optional right-side header content (e.g. download / status). */
  headerRight?: React.ReactNode;
}

export function AlignShell({
  children,
  eyebrow = "ALIGN Discovery",
  title,
  subtitle,
  cta,
  heroExtra,
  maxWidth = "3xl",
  compact = false,
  headerRight,
}: AlignShellProps) {
  const widthClass = {
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
  }[maxWidth];

  return (
    <div className="min-h-screen flex flex-col bg-brand-offwhite text-foreground">
      {/* Top nav — brand-blue band with Daryle logo */}
      <nav className="bg-brand-blue text-white">
        <div className={cn("container mx-auto px-4 md:px-6 max-w-7xl flex items-center justify-between h-16 md:h-20")}>
          <Link to="/landing" className="flex items-center gap-3">
            <img
              src="/lovable-uploads/Daryle_Logo_White.svg"
              alt="Daryle AI"
              className="h-9 md:h-12 w-auto"
            />
            <span className="hidden sm:inline-block text-xs uppercase tracking-[0.2em] text-white/70 border-l border-white/20 pl-3">
              ALIGN
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {headerRight}
            <Link to="/landing" className="text-sm text-white/80 hover:text-white transition-colors hidden md:inline">
              Back to Daryle AI
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero band */}
      {!compact && (title || subtitle || cta) && (
        <header className="relative bg-brand-blue text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-brand-blue to-brand-blue/90" />
          <div className={cn("relative container mx-auto px-4 md:px-6", widthClass, "py-14 md:py-20")}>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {eyebrow && (
                <p className="text-xs md:text-sm uppercase tracking-[0.25em] text-accent font-semibold">
                  {eyebrow}
                </p>
              )}
              {title && (
                <h1 className="mt-3 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.05]">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-4 text-base md:text-lg text-white/80 max-w-2xl leading-relaxed">
                  {subtitle}
                </p>
              )}
              {cta && <div className="mt-7 flex flex-wrap gap-3">{cta}</div>}
            </motion.div>
          </div>
        </header>
      )}

      {compact && (title || heroExtra) && (
        <header className="bg-brand-blue text-white">
          <div className={cn("container mx-auto px-4 md:px-6", widthClass, "py-5 flex flex-col gap-3")}>
            {title && (
              <div className="flex items-center justify-between gap-3">
                <div>
                  {eyebrow && (
                    <p className="text-[10px] uppercase tracking-[0.25em] text-accent font-semibold">{eyebrow}</p>
                  )}
                  <h1 className="text-lg md:text-xl font-semibold">{title}</h1>
                  {subtitle && <p className="text-xs text-white/70 mt-0.5">{subtitle}</p>}
                </div>
                {cta}
              </div>
            )}
            {heroExtra && <div>{heroExtra}</div>}
          </div>
        </header>
      )}

      {!compact && heroExtra && (
        <div className="bg-card border-b border-border">
          <div className={cn("container mx-auto px-4 md:px-6", widthClass, "py-3")}>{heroExtra}</div>
        </div>
      )}

      <main className={cn("flex-1 container mx-auto px-4 md:px-6 py-10 md:py-12 space-y-6", widthClass)}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="space-y-6"
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="mt-auto">
        <div className="bg-card border-t border-border py-8">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="text-center md:text-left">
              <p className="font-semibold text-primary">Daryle AI · ALIGN</p>
              <p className="text-xs text-muted-foreground italic">Pursuing the Better Way.</p>
            </div>
            <nav className="flex flex-wrap justify-center gap-5 text-xs text-muted-foreground">
              <Link to="/terms" className="hover:text-foreground">Terms</Link>
              <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link to="/contact" className="hover:text-foreground">Contact</Link>
            </nav>
          </div>
        </div>
        <div className="bg-brand-blue py-4 text-center">
          <p className="text-xs text-white/80">© 2025 Daryle AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default AlignShell;