import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { DomainInput } from "../components/verify/DomainInput";
import { HistoryTable } from "../components/history/HistoryTable";
import { Stat } from "../components/ui/Stat";
import { SkeletonRow } from "../components/ui/LoadingState";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { useAuth } from "../lib/auth";
import { ApiError, getAnalytics, getHistory } from "../lib/api";
import type { AnalyticsSummary, VerificationRecord } from "../lib/types";

function todayUTCKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function OverviewPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [recent, setRecent] = useState<VerificationRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const [a, h] = await Promise.all([getAnalytics(), getHistory(5)]);
      setAnalytics(a);
      setRecent(h);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return logout();
      setError(err instanceof ApiError ? err.message : "Couldn't load your dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const todaysUsage = analytics?.checkedByDay[todayUTCKey()] ?? 0;
  const remaining = user ? Math.max(0, user.dailyQuota - todaysUsage) : null;

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="text-sm text-ink-faint">
          {greeting()}, {user?.username}
        </p>
        <h1 className="font-mono text-xl text-ink mt-0.5">Verify a domain</h1>
      </div>

      <DomainInput onSubmit={(domain) => navigate(`/app/verify?domain=${encodeURIComponent(domain)}`)} autoFocus />

      {error && <ErrorState message={error} onRetry={load} />}

      {loading && !error && (
        <div className="flex gap-8">
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
        </div>
      )}

      {!loading && !error && analytics && (
        <div className="flex flex-wrap gap-x-10 gap-y-4">
          <Stat value={analytics.totalChecked} label="Total verifications" />
          <Stat value={analytics.validCount} label="Fully valid" tone="valid" />
          <Stat value={analytics.invalidCount} label="Not fully configured" tone="invalid" />
          <Stat value={todaysUsage} label="Checked today" />
          {remaining !== null && <Stat value={remaining} label="Remaining today" tone="signal" />}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-sm text-ink-dim">Recent activity</h2>
        {loading && !error && (
          <div className="flex flex-col">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        )}
        {!loading && recent && recent.length === 0 && (
          <EmptyState
            title="No checks yet"
            description="Verify your first domain above — it'll show up here."
          />
        )}
        {!loading && recent && recent.length > 0 && <HistoryTable records={recent} />}
      </div>
    </div>
  );
}

function SkeletonStat() {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="h-7 w-10 rounded-sm bg-surface-raised animate-pulse" />
      <div className="h-3 w-20 rounded-sm bg-surface-raised animate-pulse" />
    </div>
  );
}