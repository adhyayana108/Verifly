import { cn } from "../../lib/cn";
import type { VerificationStatus } from "../../lib/types";

const CONFIG: Record<VerificationStatus, { label: string; text: string; bg: string; symbol: string }> = {
  valid: { label: "Valid", text: "text-valid", bg: "bg-valid-faint", symbol: "✓" },
  partial: { label: "Partial", text: "text-warn", bg: "bg-warn-faint", symbol: "●" },
  invalid: { label: "Invalid", text: "text-invalid", bg: "bg-invalid-faint", symbol: "✕" },
};


export function StatusBadge({ status, className }: { status: VerificationStatus; className?: string }) {
  const c = CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs font-mono font-medium uppercase tracking-wide",
        c.text,
        c.bg,
        className
      )}
    >
      <span aria-hidden="true">{c.symbol}</span>
      {c.label}
    </span>
  );
}

export function RecordIndicator({ present }: { present: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", present ? "text-valid" : "text-ink-faint")}>
      <span aria-hidden="true">{present ? "✓" : "—"}</span>
      {present ? "Configured" : "Not found"}
    </span>
  );
}