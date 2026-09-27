import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface StatProps {
  value: ReactNode;
  label: string;
  tone?: "default" | "valid" | "invalid" | "signal";
  className?: string;
}

const TONE_CLASSES: Record<NonNullable<StatProps["tone"]>, string> = {
  default: "text-ink",
  valid: "text-valid",
  invalid: "text-invalid",
  signal: "text-signal",
};


export function Stat({ value, label, tone = "default", className }: StatProps) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className={cn("font-mono text-2xl font-medium tabular-nums", TONE_CLASSES[tone])}>{value}</span>
      <span className="text-xs text-ink-faint">{label}</span>
    </div>
  );
}