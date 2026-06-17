import { cn } from "@/lib/utils";

export function RatingRow({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number | undefined;
  onChange: (n: number) => void;
  hint?: string;
}) {
  return (
    <div className="grid gap-1.5 py-2 border-b border-border last:border-0">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <div className="text-sm font-medium">{label}</div>
          {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={cn(
                "h-8 w-8 rounded-md border text-sm",
                value === n ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted",
              )}
              aria-label={`${label} ${n}`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}