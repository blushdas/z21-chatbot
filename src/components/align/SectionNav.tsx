import { cn } from "@/lib/utils";
import type { AlignSection } from "@/lib/align/types";

const STEPS: { key: AlignSection | "profile"; label: string }[] = [
  { key: "profile", label: "Profile" },
  { key: "A", label: "A · Purpose" },
  { key: "L", label: "L · Locate" },
  { key: "I", label: "I · Readiness" },
  { key: "G", label: "G · Trust" },
  { key: "N", label: "N · Navigate" },
];

export function SectionNav({
  current,
  onJump,
}: {
  current: AlignSection | "profile" | "report";
  onJump: (k: AlignSection | "profile") => void;
}) {
  return (
    <nav className="flex flex-wrap gap-2">
      {STEPS.map((s) => (
        <button
          key={s.key}
          onClick={() => onJump(s.key)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs",
            current === s.key ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          {s.label}
        </button>
      ))}
    </nav>
  );
}