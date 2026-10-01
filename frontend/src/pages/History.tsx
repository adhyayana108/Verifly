import { useEffect, useMemo, useState } from "react";
import { HistoryTable } from "../components/history/HistoryTable";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { SkeletonRow } from "../components/ui/LoadingState";
import { ApiError, getHistory } from "../lib/api";
import { useAuth } from "../lib/auth";
import { statusOf, type VerificationRecord, type VerificationStatus } from "../lib/types";

const PAGE_SIZE = 25;

type StatusFilter = "all" | VerificationStatus;

export function HistoryPage() {
  const { logout } = useAuth();

  const [records, setRecords] = useState<VerificationRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  async function load(nextLimit: number) {
    if (nextLimit === PAGE_SIZE) setLoading(true);
    else setLoadingMore(true);
    setError(null);
    try {
      setRecords(await getHistory(nextLimit));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return logout();
      setError(err instanceof ApiError ? err.message : "Couldn't load verification history.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    load(PAGE_SIZE);
  }, []);

  const filtered = useMemo(() => {
    if (!records) return [];
    return records.filter((r) => {
      if (statusFilter !== "all" && statusOf(r) !== statusFilter) return false;
      if (query && !r.domain.toLowerCase().includes(query.trim().toLowerCase())) return false;
      return true;
    });
  }, [records, query, statusFilter]);

  function handleLoadMore() {
    const next = limit + PAGE_SIZE;
    setLimit(next);
    load(next);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-mono text-xl text-ink">History</h1>
        <p className="text-sm text-ink-faint mt-1">Every domain you've checked, most recent first.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="sm:w-64">
          <Input placeholder="Filter by domain…" value={query} onChange={(e) => setQuery(e.target.value)} mono />
        </div>
        <div className="flex gap-1.5">
          {(["all", "valid", "partial", "invalid"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={
                "rounded-sm px-2.5 py-1 text-xs font-mono border transition-colors duration-150 " +
                (statusFilter === s
                  ? "border-signal/50 text-signal bg-signal-faint"
                  : "border-line text-ink-faint hover:text-ink-dim")
              }
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}

      {!loading && error && <ErrorState message={error} onRetry={() => load(limit)} />}

      {!loading && !error && records && records.length === 0 && (
        <EmptyState title="No checks yet" description="Domains you verify will show up here." />
      )}

      {!loading && !error && records && records.length > 0 && filtered.length === 0 && (
        <EmptyState title="No matches" description="Nothing matches that filter. Try clearing it." />
      )}

      {!loading && !error && filtered.length > 0 && (
        <>
          <HistoryTable records={filtered} />
          {records && records.length >= limit && (
            <div className="pt-2">
              <Button variant="secondary" size="sm" loading={loadingMore} onClick={handleLoadMore}>
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}