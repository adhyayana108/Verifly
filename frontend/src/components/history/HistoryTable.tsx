import type { VerificationRecord } from "../../lib/types";
import { statusOf } from "../../lib/types";
import { StatusBadge } from "../ui/StatusBadge";
import { relativeTime, fullTimestamp } from "../../lib/format";
import { cn } from "../../lib/cn";

function CheckMark({ present }: { present: boolean }) {
  return (
    <span className={cn("font-mono", present ? "text-valid" : "text-ink-faint")} aria-label={present ? "present" : "missing"}>
      {present ? "✓" : "—"}
    </span>
  );
}

export function HistoryTable({ records }: { records: VerificationRecord[] }) {
  return (
    <>
      {/* Desktop table */}
      <table className="hidden md:table w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs text-ink-faint">
            <th className="py-2.5 font-normal">Domain</th>
            <th className="py-2.5 font-normal">MX</th>
            <th className="py-2.5 font-normal">SPF</th>
            <th className="py-2.5 font-normal">DMARC</th>
            <th className="py-2.5 font-normal">Result</th>
            <th className="py-2.5 font-normal text-right">Checked</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id} className="border-b border-line-soft hover:bg-surface-raised/50 transition-colors duration-150">
              <td className="py-3 font-mono text-ink">{r.domain}</td>
              <td className="py-3">
                <CheckMark present={r.hasMX} />
              </td>
              <td className="py-3">
                <CheckMark present={r.hasSPF} />
              </td>
              <td className="py-3">
                <CheckMark present={r.hasDMARC} />
              </td>
              <td className="py-3">
                <StatusBadge status={statusOf(r)} />
              </td>
              <td className="py-3 text-right text-ink-faint" title={fullTimestamp(r.checkedAt)}>
                {relativeTime(r.checkedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile cards */}
      <div className="flex flex-col gap-2 md:hidden">
        {records.map((r) => (
          <div key={r.id} className="rounded-md border border-line bg-surface px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-sm text-ink truncate">{r.domain}</span>
              <StatusBadge status={statusOf(r)} />
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-ink-faint">
              <span>
                MX <CheckMark present={r.hasMX} />
              </span>
              <span>
                SPF <CheckMark present={r.hasSPF} />
              </span>
              <span>
                DMARC <CheckMark present={r.hasDMARC} />
              </span>
              <span className="ml-auto">{relativeTime(r.checkedAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}