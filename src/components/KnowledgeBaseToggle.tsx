import { BookOpen, BookX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useBrand } from "@/context/BrandContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type KnowledgeBaseToggleProps = {
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
};

export function KnowledgeBaseToggle({ enabled, onToggle, disabled }: KnowledgeBaseToggleProps) {
  const isMobile = useIsMobile();
  const { activeBrand } = useBrand();
  const isWhiteLabel = !!activeBrand;
  const kbLabel = isWhiteLabel ? `${activeBrand?.product_name ?? 'Brand'} KB` : 'Ambassador Way KB';
  const kbTooltipOn = isWhiteLabel
    ? `${activeBrand?.product_name ?? 'Brand'} Knowledge Base: KB and citations`
    : 'Ambassador Way Knowledge Base: KB, citations, Daryle voice';
  const kbTooltipOff = isWhiteLabel
    ? `Raw Model: no ${activeBrand?.product_name ?? 'Brand'} Knowledge Base or citations`
    : 'Raw Model: no Ambassador Way Knowledge Base or citations';
  const Icon = enabled ? BookOpen : BookX;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onToggle}
            disabled={disabled}
            aria-pressed={enabled}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors",
              enabled
                ? "bg-brand-green/10 text-brand-green border-brand-green/30"
                : "bg-[var(--chat-card)] text-[var(--chat-muted)] border-[var(--chat-border)] hover:bg-[var(--chat-card-2)]",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <Icon
              className={cn(
                "h-3.5 w-3.5",
                enabled ? "text-brand-green" : "text-yellow-500"
              )}
            />
            {!isMobile && (
              <span className="whitespace-nowrap">
                {enabled ? kbLabel : "Raw Model"}
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>
            {enabled ? kbTooltipOn : kbTooltipOff}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}