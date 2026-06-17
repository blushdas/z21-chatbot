import { Brain, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type SharpenToggleProps = {
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
  loading?: boolean;
  onCancel?: () => void;
};

export function SharpenToggle({ enabled, onToggle, disabled, loading, onCancel }: SharpenToggleProps) {
  const isMobile = useIsMobile();

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={loading ? onCancel : onToggle}
            disabled={disabled || (loading && !onCancel)}
            aria-busy={loading || undefined}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors",
              enabled
                ? "bg-brand-yellow text-brand-blue border-brand-yellow"
                : "bg-[var(--chat-card)] text-[var(--chat-muted)] border-[var(--chat-border)] hover:bg-[var(--chat-card-2)]",
              disabled && "opacity-50 cursor-not-allowed",
              loading && !onCancel && "opacity-50 cursor-not-allowed",
              loading && onCancel && "hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40"
            )}
          >
            {loading ? (
              onCancel ? (
                <X className="h-3.5 w-3.5" />
              ) : (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )
            ) : (
              <Brain
                className={cn(
                  "h-3.5 w-3.5",
                  enabled ? "text-brand-blue" : "text-[var(--chat-muted)]"
                )}
              />
            )}
            {!isMobile && (
              <span className="whitespace-nowrap">
                {loading ? (onCancel ? "Cancel" : "Sharpening…") : "Sharpen Prompt"}
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{loading ? (onCancel ? "Click to cancel sharpening" : "Refining your prompt…") : "Automatically refine your prompt before sending"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
