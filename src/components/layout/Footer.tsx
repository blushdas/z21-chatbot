import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background py-10">
      <div className="mx-auto max-w-6xl px-6">
        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          {/* Brand */}
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <span className="text-xs uppercase tracking-widest text-gold font-medium">
              Z21 — Zero to One Builder Community
            </span>
            <p className="text-xs text-muted-foreground">
              Copyright &copy; 2026 &mdash; Z21 &mdash; All Rights Reserved
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacy Policy
            </Link>
            <Link
              to="/"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Disclaimer
            </Link>
            <Link
              to="/"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Cookie Policy
            </Link>
            <Link
              to="/"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Contact
            </Link>
          </nav>

          {/* Social icons */}
          <div className="flex items-center gap-3">
            {["IG", "Li", "YT", "DC"].map((s) => (
              <button
                key={s}
                className="flex h-7 w-7 items-center justify-center rounded border border-border/50 text-xs text-muted-foreground transition-colors hover:border-gold hover:text-gold"
                title={s}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
