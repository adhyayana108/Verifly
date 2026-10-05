import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { getAnalytics, getHistory } from "../lib/api";
import type { AnalyticsSummary, VerificationRecord } from "../lib/types";

import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { ChartContainer } from "../components/charts/ChartContainer";

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatDomain(domain: string): string {
  return domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function StatusBadge({ valid }: { valid: boolean }) {
  if (valid) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-valid-faint px-2.5 py-1 font-mono text-xs text-valid">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        valid
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-invalid-faint px-2.5 py-1 font-mono text-xs text-invalid">
      <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
      invalid
    </span>
  );
}

function StatCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-ink-faint">
            {label}
          </p>

          <p className="mt-3 text-3xl font-medium tracking-tight text-ink">
            {value}
          </p>

          <p className="mt-1 text-xs text-ink-faint">{description}</p>
        </div>

        <div className="rounded-md border border-line bg-surface-raised p-2.5 text-signal">
          {icon}
        </div>
      </div>
    </div>
  );
}

function VerificationRow({
  record,
}: {
  record: VerificationRecord;
}) {
  return (
    <Link
      to={`/history`}
      className="group flex items-center justify-between gap-4 border-b border-line-soft px-5 py-4 last:border-b-0 hover:bg-surface-raised"
    >
      <div className="min-w-0">
        <p className="truncate font-mono text-sm text-ink group-hover:text-signal">
          {formatDomain(record.domain)}
        </p>

        <div className="mt-1 flex items-center gap-2 text-xs text-ink-faint">
          <Clock3 className="h-3 w-3" aria-hidden="true" />
          {formatDate(record.checkedAt)}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <StatusBadge valid={record.valid} />

        <ArrowRight
          className="h-4 w-4 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-signal"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}

function OverviewChart({
  analytics,
}: {
  analytics: AnalyticsSummary;
}) {
  const total = analytics.totalChecked;

  const validPercent =
    total > 0 ? Math.round((analytics.validCount / total) * 100) : 0;

  const invalidPercent =
    total > 0 ? Math.round((analytics.invalidCount / total) * 100) : 0;

  return (
    <ChartContainer
      title="Verification health"
      description="Current validity distribution across your checks."
    >
      <div className="flex flex-col gap-5">
        <div className="flex h-3 overflow-hidden rounded-full bg-surface-raised">
          {validPercent > 0 && (
            <div
              className="bg-valid transition-[width] duration-500"
              style={{ width: `${validPercent}%` }}
              title={`Valid: ${validPercent}%`}
            />
          )}

          {invalidPercent > 0 && (
            <div
              className="bg-invalid transition-[width] duration-500"
              style={{ width: `${invalidPercent}%` }}
              title={`Invalid: ${invalidPercent}%`}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full bg-valid"
              aria-hidden="true"
            />

            <div>
              <p className="font-mono text-xs text-ink-faint">valid</p>
              <p className="mt-0.5 text-sm text-ink">
                {analytics.validCount}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full bg-invalid"
              aria-hidden="true"
            />

            <div>
              <p className="font-mono text-xs text-ink-faint">invalid</p>
              <p className="mt-0.5 text-sm text-ink">
                {analytics.invalidCount}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-line pt-4">
          <p className="font-mono text-xs text-ink-faint">
            validity rate
          </p>

          <p className="mt-1 text-2xl text-ink">{validPercent}%</p>
        </div>
      </div>
    </ChartContainer>
  );
}

export default function Dashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [history, setHistory] = useState<VerificationRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadDashboard() {
    setLoading(true);
    setError(null);

    try {
      const [analyticsData, historyData] = await Promise.all([
        getAnalytics(),
        getHistory(5),
      ]);

      setAnalytics(analyticsData);
      setHistory(historyData);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load dashboard.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <div className="h-7 w-40 animate-pulse rounded bg-surface-raised" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-surface-raised" />
        </div>

        <LoadingState label="Loading dashboard" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-ink">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-ink-faint">
            Overview of your domain verification activity.
          </p>
        </div>

        <ErrorState message={error} onRetry={() => void loadDashboard()} />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-ink">
            Dashboard
          </h1>
        </div>

        <EmptyState
          title="No dashboard data"
          description="There is currently no verification data available."
          action={
            <Link
              to="/verify"
              className="inline-flex items-center gap-2 rounded-md bg-signal px-4 py-2 text-sm font-medium text-void transition-colors hover:bg-signal-dim"
            >
              Verify a domain
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2">
            <Activity
              className="h-5 w-5 text-signal"
              aria-hidden="true"
            />

            <p className="font-mono text-xs uppercase tracking-[0.18em] text-signal">
              overview
            </p>
          </div>

          <h1 className="mt-2 text-2xl font-medium tracking-tight text-ink">
            Dashboard
          </h1>

          <p className="mt-1 max-w-xl text-sm text-ink-faint">
            Monitor your email-domain authentication and verification
            activity.
          </p>
        </div>

        <Link
          to="/verify"
          className="inline-flex w-fit items-center gap-2 rounded-md bg-signal px-4 py-2.5 text-sm font-medium text-void transition-colors hover:bg-signal-dim"
        >
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Verify domain
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {/* Stats */}
      <section
        aria-label="Verification statistics"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          label="Total checks"
          value={analytics.totalChecked}
          description="All-time verifications"
          icon={
            <Activity className="h-4 w-4" aria-hidden="true" />
          }
        />

        <StatCard
          label="Valid"
          value={analytics.validCount}
          description="Passing all checks"
          icon={
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          }
        />

        <StatCard
          label="Invalid"
          value={analytics.invalidCount}
          description="Missing or invalid records"
          icon={
            <XCircle className="h-4 w-4" aria-hidden="true" />
          }
        />

        <StatCard
          label="Validity rate"
          value={
            analytics.totalChecked > 0
              ? `${Math.round(
                  (analytics.validCount /
                    analytics.totalChecked) *
                    100,
                )}%`
              : "0%"
          }
          description="Successful verification rate"
          icon={
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          }
        />
      </section>

      {/* Main content */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <OverviewChart analytics={analytics} />

        <div className="rounded-md border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <p className="text-sm text-ink">Recent activity</p>
              <p className="mt-0.5 text-xs text-ink-faint">
                Your latest domain checks.
              </p>
            </div>

            <Link
              to="/history"
              className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-dim transition-colors hover:text-signal"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {history.length === 0 ? (
            <div className="px-5 py-8">
              <EmptyState
                title="No verifications yet"
                description="Run your first domain verification to start building your verification history."
                action={
                  <Link
                    to="/verify"
                    className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm text-ink transition-colors hover:border-signal hover:text-signal"
                  >
                    Verify a domain
                    <ArrowRight
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                  </Link>
                }
              />
            </div>
          ) : (
            <div>
              {history.map((record) => (
                <VerificationRow
                  key={`${record.domain}-${record.checkedAt}`}
                  record={record}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <div className="mb-3">
          <p className="text-sm text-ink">Quick actions</p>
          <p className="mt-0.5 text-xs text-ink-faint">
            Common verification workflows.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            to="/verify"
            className="group rounded-md border border-line bg-surface p-4 transition-colors hover:border-signal"
          >
            <ShieldCheck
              className="h-5 w-5 text-signal"
              aria-hidden="true"
            />

            <p className="mt-3 text-sm text-ink">
              Single verification
            </p>

            <p className="mt-1 text-xs leading-5 text-ink-faint">
              Check MX, SPF, and DMARC for one domain.
            </p>

            <div className="mt-3 flex items-center gap-1 font-mono text-xs text-ink-faint group-hover:text-signal">
              Open verifier
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </div>
          </Link>

          <Link
            to="/bulk"
            className="group rounded-md border border-line bg-surface p-4 transition-colors hover:border-signal"
          >
            <Activity
              className="h-5 w-5 text-signal"
              aria-hidden="true"
            />

            <p className="mt-3 text-sm text-ink">
              Bulk verification
            </p>

            <p className="mt-1 text-xs leading-5 text-ink-faint">
              Upload multiple domains and monitor results live.
            </p>

            <div className="mt-3 flex items-center gap-1 font-mono text-xs text-ink-faint group-hover:text-signal">
              Open bulk verifier
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </div>
          </Link>

          <Link
            to="/history"
            className="group rounded-md border border-line bg-surface p-4 transition-colors hover:border-signal"
          >
            <Clock3
              className="h-5 w-5 text-signal"
              aria-hidden="true"
            />

            <p className="mt-3 text-sm text-ink">
              Verification history
            </p>

            <p className="mt-1 text-xs leading-5 text-ink-faint">
              Review previous domain verification results.
            </p>

            <div className="mt-3 flex items-center gap-1 font-mono text-xs text-ink-faint group-hover:text-signal">
              View history
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}