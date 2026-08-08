import { cn } from "@/lib/utils";
import { formatRupee } from "@shared/utils/utils";

/**
 * Outstanding badge.
 * - Positive outstanding → neutral badge with destructive text and Dr label.
 * - Negative outstanding → neutral badge with Cr label.
 * - Zero → settled neutral.
 */
export function OutstandingBadge({
  outstanding,
  className,
  size = "md"
}: {
  outstanding: number;
  className?: string;
  size?: "sm" | "md";
}) {
  const isZero = outstanding === 0;
  const isDue = outstanding > 0;
  const amount = formatRupee(Math.abs(outstanding));
  const label = isZero ? "Settled" : amount + (isDue ? " Dr" : " Cr");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border font-medium tabular-nums",
        size === "md" ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs",
        isZero
          ? "border-frame bg-card text-muted-foreground"
          : isDue
            ? "border-frame bg-card text-destructive"
            : "border-frame bg-card text-foreground",
        className
      )}
    >
      <span className="font-semibold">{label}</span>
    </span>
  );
}
