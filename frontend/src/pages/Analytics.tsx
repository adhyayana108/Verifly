import { useEffect, useState } from "react";
import { ChartContainer } from "../components/charts/ChartContainer";
import { ValidityDonut } from "../components/charts/ValidityDonut";
import { AdoptionBars } from "../components/charts/AdoptionBars";
import { ActivityLine } from "../components/charts/ActivityLine";
import { Stat } from "../components/ui/Stat";
import { LoadingState } from "../components/ui/LoadingState";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { ApiError, getAnalytics } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { AnalyticsSummary } from "../lib/types";

export function AnalyticsPage() {
  const { logout } = useAuth();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setData(await getAnalytics());
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return logout();
      setError(err instanceof ApiError ? err.message : "Couldn't load analytics.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-mono text-xl text-ink">Analytics</h1>
        <p className="text-sm text-ink-faint mt-1">A summary of everything you've verified.</p>
      </div>

      {loading && <LoadingState label="Loading analytics" />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && data && data.totalChecked === 0 && (
        <EmptyState title="Nothing to show yet" description="Verify a few domains and your analytics will appear here." />
      )}

      {!loading && !error && data && data.totalChecked > 0 && (
        <>
          <div className="flex flex-wrap gap-x-10 gap-y-4">
            <Stat value={data.totalChecked} label="Total verifications" />
            <Stat value={data.validCount} label="Fully valid" tone="valid" />
            <Stat value={data.invalidCount} label="Not fully configured" tone="invalid" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ChartContainer title="Valid vs. invalid">
              <ValidityDonut valid={data.validCount} invalid={data.invalidCount} />
            </ChartContainer>
            <ChartContainer title="Record adoption" description="Share of checked domains publishing each record">
              <AdoptionBars mx={data.mxPresentRate} spf={data.spfPresentRate} dmarc={data.dmarcPresentRate} />
            </ChartContainer>
          </div>

          <ChartContainer title="Activity over time">
            <ActivityLine checkedByDay={data.checkedByDay} />
          </ChartContainer>

          {data.recentDomains.length > 0 && (
            <div>
              <h2 className="text-sm text-ink-dim mb-2">Recently checked</h2>
              <div className="flex flex-wrap gap-2">
                {data.recentDomains.map((d) => (
                  <span key={d} className="rounded-sm border border-line bg-surface px-2 py-1 font-mono text-xs text-ink-dim">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}