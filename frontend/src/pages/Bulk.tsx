import { useRef, useState } from "react";
import { BulkUploader } from "../components/bulk/BulkUploader";
import { StreamingResults } from "../components/bulk/StreamingResults";
import { ProgressBar } from "../components/ui/ProgressBar";
import { Button } from "../components/ui/Button";
import { ErrorState } from "../components/ui/ErrorState";
import { Stat } from "../components/ui/Stat";
import { ApiError, bulkVerify } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { VerificationRecord } from "../lib/types";

type Phase = "idle" | "running" | "done";

export function BulkPage() {
  const { logout } = useAuth();

  const [phase, setPhase] = useState<Phase>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  async function handleFile(file: File) {
    setPhase("running");
    setFileName(file.name);
    setTotal(0);
    setCompleted(0);
    setRecords([]);
    setQuotaExceeded(false);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await bulkVerify(
        file,
        (event) => {
          if (event.total) setTotal(event.total);
          setCompleted(event.completed);
          if (event.type === "result" && event.record) {
            setRecords((prev) => [...prev, event.record!]);
          }
          if (event.type === "quota_exceeded") {
            setQuotaExceeded(true);
          }
          if (event.type === "done") {
            setPhase("done");
          }
        },
        controller.signal
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return logout();
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof ApiError ? err.message : "The upload didn't go through. Check your connection and try again.");
      setPhase("idle");
    }
  }

  function reset() {
    abortRef.current?.abort();
    setPhase("idle");
    setFileName(null);
    setTotal(0);
    setCompleted(0);
    setRecords([]);
    setQuotaExceeded(false);
    setError(null);
  }

  function downloadCsv() {
    const header = "domain,hasMX,hasSPF,hasDMARC,valid\n";
    const body = records.map((r) => [r.domain, r.hasMX, r.hasSPF, r.hasDMARC, r.valid].join(",")).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "verifly-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const validCount = records.filter((r) => r.valid).length;
  const invalidCount = records.length - validCount;
  const pct = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-mono text-xl text-ink">Bulk verification</h1>
        <p className="text-sm text-ink-faint mt-1">Upload a CSV. Results stream in as each domain finishes.</p>
      </div>

      {phase === "idle" && !error && <BulkUploader onFileSelected={handleFile} />}
      {error && <ErrorState message={error} action={<Button size="sm" onClick={() => setError(null)}>Try a different file</Button>} />}

      {phase !== "idle" && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <p className="font-mono text-sm text-ink-dim truncate">{fileName}</p>
            {phase === "running" && (
              <button onClick={reset} className="text-xs text-ink-faint hover:text-invalid transition-colors">
                Cancel
              </button>
            )}
          </div>

          <ProgressBar
            value={pct}
            label={
              phase === "running"
                ? `Checking domains — ${completed} / ${total || "…"}`
                : `Done — ${completed} / ${total} domains checked`
            }
          />

          {quotaExceeded && (
            <p className="text-sm text-warn">
              Your daily verification limit was reached partway through — the remaining domains weren't checked.
            </p>
          )}

          <StreamingResults records={records} />

          {phase === "done" && (
            <div className="flex flex-wrap items-center gap-8 rounded-md border border-line bg-surface px-5 py-4">
              <Stat value={records.length} label="Total checked" />
              <Stat value={validCount} label="Fully valid" tone="valid" />
              <Stat value={invalidCount} label="Not fully configured" tone="invalid" />
              <div className="ml-auto flex gap-2">
                <Button variant="secondary" size="sm" onClick={downloadCsv} disabled={records.length === 0}>
                  Download CSV
                </Button>
                <Button variant="primary" size="sm" onClick={reset}>
                  Run another
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}