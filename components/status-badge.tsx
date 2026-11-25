import { cn } from "cn";
import type { CoverageSlot, DocStatus } from "@/lib/types";

const styles: Record<CoverageSlot, string> = {
  valid: "bg-emerald-50 text-emerald-950 ring-emerald-300",
  expiring: "bg-amber-50 text-amber-950 ring-amber-300",
  expired: "bg-red-50 text-red-950 ring-red-300",
  missing: "bg-stone-100 text-stone-700 ring-stone-300",
};

const dots: Record<CoverageSlot, string> = {
  valid: "bg-emerald-600",
  expiring: "bg-amber-500",
  expired: "bg-red-600",
  missing: "bg-stone-400",
};

const labels: Record<CoverageSlot, string> = {
  valid: "Valid",
  expiring: "Expiring",
  expired: "Expired",
  missing: "Missing",
};

export function StatusBadge({
  status,
  testId,
}: {
  status: DocStatus | CoverageSlot;
  testId?: string;
}) {
  return (
    <span
      data-testid={testId}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ring-1",
        styles[status],
      )}
    >
      <span className={cn("size-1.5 rounded-full", dots[status])} />
      {labels[status]}
    </span>
  );
}
