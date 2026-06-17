import { BookOpen, BookX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBrand } from "@/context/BrandContext";

type KbStatusBannerProps = {
  enabled: boolean;
};

export function KbStatusBanner({ enabled }: KbStatusBannerProps) {
  const Icon = enabled ? BookOpen : BookX;
  const { activeBrand } = useBrand();
  const isWhiteLabel = !!activeBrand;
  const brandName = activeBrand?.product_name ?? 'Brand';
  const onText = isWhiteLabel
    ? `${brandName} Knowledge Base active — answers cite ${brandName} sources`
    : 'Ambassador Way Knowledge Base active — answers cite Daryle sources';
  const offText = isWhiteLabel
    ? `Raw Model — no Knowledge Base, no citations.`
    : 'Raw Model — no Knowledge Base, no citations. Daryle voice preserved.';
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "w-full border-b px-4 py-1.5 flex items-center justify-center gap-2 text-xs",
        enabled
          ? "bg-[var(--color-success-soft)] border-[var(--color-success-border)] text-[color:var(--color-success)]"
          : "bg-[var(--color-warning-soft)] border-[var(--color-warning-border)] text-[color:var(--color-warning)]"
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="font-medium uppercase tracking-wide">
        {enabled ? "KB On" : "KB Off"}
      </span>
      <span className="opacity-80 hidden sm:inline">
        {enabled ? onText : offText}
      </span>
    </div>
  );
}

export default KbStatusBanner;