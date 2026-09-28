import type { VerificationRecord } from "../../lib/types";
import { statusOf } from "../../lib/types";
import { StatusBadge } from "../ui/StatusBadge";
import { DNSRecordCard } from "./DNSRecordCard";

function explain(rec: VerificationRecord): string {
  const missing: string[] = [];
  if (!rec.hasMX) missing.push("MX");
  if (!rec.hasSPF) missing.push("SPF");
  if (!rec.hasDMARC) missing.push("DMARC");

  if (missing.length === 0) {
    return "MX, SPF and DMARC are all present — this domain is configured for authenticated mail.";
  }
  if (missing.length === 3) {
    return "No MX, SPF or DMARC records were found for this domain.";
  }
  return `${missing.join(" and ")} ${missing.length === 1 ? "is" : "are"} missing, so this domain isn't fully configured for authenticated mail.`;
}

export function VerificationResult({ record }: { record: VerificationRecord }) {
  const status = statusOf(record);

  return (
    <div className="flex flex-col gap-5 animate-rise-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-ink-faint mb-1">Verification result</p>
          <h2 className="font-mono text-xl text-ink">{record.domain}</h2>
        </div>
        <StatusBadge status={status} />
      </div>

      <p className="text-sm text-ink-dim max-w-lg">{explain(record)}</p>

      {record.error && (
        <div className="rounded-md border border-warn/25 bg-warn-faint px-4 py-3 text-sm text-ink-dim">
          <span className="text-warn font-mono mr-1.5" aria-hidden="true">
            ●
          </span>
          Some lookups didn't complete cleanly: <span className="font-mono text-xs">{record.error}</span>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <DNSRecordCard title="MX" description="Mail servers accept mail for this domain" present={record.hasMX} values={record.mxHosts} />
        <DNSRecordCard
          title="SPF"
          description="Declares which servers may send mail"
          present={record.hasSPF}
          values={record.spfRecord ? [record.spfRecord] : undefined}
        />
        <DNSRecordCard
          title="DMARC"
          description="Sets policy for failed SPF/DKIM checks"
          present={record.hasDMARC}
          values={record.dmarcRecord ? [record.dmarcRecord] : undefined}
        />
      </div>
    </div>
  );
}