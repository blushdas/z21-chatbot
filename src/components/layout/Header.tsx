import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-gold text-black font-bold text-sm">
            Z21
          </div>
          <span className="hidden text-sm font-medium tracking-wide text-foreground sm:block">
            Z21
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-6">
          <Link
            to="/"
            className="text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
          >
            Resources
          </Link>
          <Link
            to="/"
            className="text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
          >
            Proof
          </Link>
          <Link
            to="/faq"
            className="text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
          >
            FAQ
          </Link>
          <Link
            to="/chat"
            className="rounded bg-gold px-4 py-2 text-xs font-medium uppercase tracking-wider text-black transition-colors hover:bg-gold-light"
          >
            Start Building
          </Link>
        </nav>
      </div>
    </header>
  );
}
