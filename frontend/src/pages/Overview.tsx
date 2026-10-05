import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { DomainInput } from "../components/verify/DomainInput";
import { HistoryTable } from "../components/history/HistoryTable";
import { Stat } from "../components/ui/Stat";
import { SkeletonRow } from "../components/ui/LoadingState";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { useAuth } from "../lib/auth";
import { ApiError, getAnalytics, getHistory } from "../lib/api";
import type {
  AnalyticsSummary,
  VerificationRecord,
} from "../lib/types";

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

  const [analytics, setAnalytics] =
    useState<AnalyticsSummary | null>(null);

  const [recent, setRecent] =
    useState<VerificationRecord[] | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const [analyticsResult, historyResult] =
        await Promise.all([
          getAnalytics(),
          getHistory(5),
        ]);

      setAnalytics(analyticsResult);
      setRecent(historyResult);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        return;
      }

      setError(
        err instanceof ApiError
          ? err.message
          : "Couldn't load your dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    void load();
  }, [load]);

  const todaysUsage =
    analytics?.checkedByDay?.[todayUTCKey()] ?? 0;

  const remaining =
    user && analytics
      ? Math.max(
          0,
          user.dailyQuota - todaysUsage,
        )
      : null;

  return (
    <div className="flex flex-col gap-10">
      <section>
        <p className="text-sm text-ink-faint">
          {greeting()}
          {user?.username
            ? `, ${user.username}`
            : ""}
        </p>

        <h1 className="mt-0.5 font-mono text-xl text-ink">
          Verify a domain
        </h1>
      </section>

      <DomainInput
        onSubmit={(domain) => {
          navigate(
            `/app/verify?domain=${encodeURIComponent(domain)}`,
          );
        }}
        autoFocus
      />

      {error && (
        <ErrorState
          message={error}
          onRetry={load}
        />
      )}

      {loading && !error && (
        <div className="flex flex-wrap gap-8">
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
        </div>
      )}

      {!loading && !error && analytics && (
        <div className="flex flex-wrap gap-x-10 gap-y-4">
          <Stat
            value={analytics.totalChecked}
            label="Total verifications"
          />

          <Stat
            value={analytics.validCount}
            label="Fully valid"
            tone="valid"
          />

          <Stat
            value={analytics.invalidCount}
            label="Not fully configured"
            tone="invalid"
          />

          <Stat
            value={todaysUsage}
            label="Checked today"
          />

          {remaining !== null && (
            <Stat
              value={remaining}
              label="Remaining today"
              tone="signal"
            />
          )}
        </div>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm text-ink-dim">
          Recent activity
        </h2>

        {loading && !error && (
          <div className="flex flex-col">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        )}

        {!loading &&
          !error &&
          recent &&
          recent.length === 0 && (
            <EmptyState
              title="No checks yet"
              description="Verify your first domain above — it'll show up here."
            />
          )}

        {!loading &&
          !error &&
          recent &&
          recent.length > 0 && (
            <HistoryTable records={recent} />
          )}
      </section>
    </div>
  );
}

function SkeletonStat() {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="h-7 w-10 animate-pulse rounded-sm bg-surface-raised" />
      <div className="h-3 w-20 animate-pulse rounded-sm bg-surface-raised" />
    </div>
  );
}