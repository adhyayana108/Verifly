import type { VerificationRecord } from "../../lib/types";
import { statusOf } from "../../lib/types";
import { cn } from "../../lib/cn";

const SYMBOL: Record<ReturnType<typeof statusOf>, { glyph: string; className: string }> = {
  valid: { glyph: "✓", className: "text-valid" },
  partial: { glyph: "●", className: "text-warn" },
  invalid: { glyph: "✕", className: "text-invalid" },
};

export function StreamingResults({ records }: { records: VerificationRecord[] }) {
  return (
    <div className="scrollbar-thin max-h-80 overflow-y-auto rounded-md border border-line bg-surface font-mono text-sm">
      {records.length === 0 ? (
        <p className="px-4 py-6 text-ink-faint text-center">Results will appear here as each domain finishes.</p>
      ) : (
        <ul>
          {[...records].reverse().map((r) => {
            const s = SYMBOL[statusOf(r)];
            return (
              <li
                key={r.id}
                className="flex items-center gap-2.5 border-b border-line-soft px-4 py-2 last:border-0 animate-rise-in"
              >
                <span className={cn(s.className)} aria-hidden="true">
                  {s.glyph}
                </span>
                <span className="text-ink">{r.domain}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}