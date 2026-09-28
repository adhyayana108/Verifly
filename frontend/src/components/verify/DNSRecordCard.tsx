import { Card } from "../ui/Card";
import { RecordIndicator } from "../ui/StatusBadge";
import { CopyButton } from "../ui/CopyButton";

interface DNSRecordCardProps {
  title: string;
  description: string;
  present: boolean;
  values?: string[];
}

export function DNSRecordCard({ title, description, present, values }: DNSRecordCardProps) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm text-ink">{title}</p>
          <p className="text-xs text-ink-faint mt-0.5">{description}</p>
        </div>
        <RecordIndicator present={present} />
      </div>

      {present && values && values.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {values.map((v, i) => (
            <div
              key={i}
              className="flex items-start justify-between gap-3 rounded-sm border border-line-soft bg-void/60 px-3 py-2"
            >
              <code className="flex-1 break-all font-mono text-xs text-ink-dim leading-relaxed">{v}</code>
              <CopyButton value={v} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}