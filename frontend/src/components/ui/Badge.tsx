import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface BadgeProps {
  children: ReactNode;
  tone?: "default" | "signal";
  className?: string;
}

export function Badge({ children, tone = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-1.5 py-0.5 text-xs font-mono",
        tone === "signal" ? "bg-signal-faint text-signal" : "bg-surface-raised text-ink-dim border border-line",
        className
      )}
    >
      {children}
    </span>
  );
}