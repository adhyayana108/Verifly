import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { DomainInput } from "../components/verify/DomainInput";
import { CheckingSequence } from "../components/verify/CheckingSequence";
import { VerificationResult } from "../components/verify/VerificationResult";
import { HistoryTable } from "../components/history/HistoryTable";
import { SkeletonRow } from "../components/ui/LoadingState";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { ApiError, getHistory, verifyDomain } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { VerificationRecord } from "../lib/types";

export function VerifyPage() {
  const { logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [checking, setChecking] = useState(false);
  const [pendingDomain, setPendingDomain] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [recent, setRecent] = useState<VerificationRecord[] | null>(null);
  const [recentLoading, setRecentLoading] = useState(true);

  const ranInitial = useRef(false);

  async function loadRecent() {
    setRecentLoading(true);
    try {
      setRecent(await getHistory(5));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return logout();
      setRecent([]);
    } finally {
      setRecentLoading(false);
    }
  }

  async function runVerify(domain: string) {
    setChecking(true);
    setPendingDomain(domain);
    setError(null);
    setResult(null);
    try {
      const rec = await verifyDomain(domain);
      setResult(rec);
      loadRecent();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return logout();
      setError(err instanceof ApiError ? err.message : "Couldn't reach the verification service.");
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    loadRecent();
  }, []);

  useEffect(() => {
    const domain = searchParams.get("domain");
    if (domain && !ranInitial.current) {
      ranInitial.current = true;
      runVerify(domain);
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <h1 className="font-mono text-xl text-ink">Verify a domain</h1>
        <DomainInput onSubmit={runVerify} loading={checking} autoFocus />
      </div>

      {checking && pendingDomain && <CheckingSequence domain={pendingDomain} />}
      {!checking && error && <ErrorState message={error} onRetry={() => pendingDomain && runVerify(pendingDomain)} />}
      {!checking && !error && result && <VerificationResult record={result} />}

      <div className="flex flex-col gap-3 border-t border-line-soft pt-8">
        <h2 className="text-sm text-ink-dim">Recent activity</h2>
        {recentLoading && (
          <div className="flex flex-col">
            <SkeletonRow />
            <SkeletonRow />
          </div>
        )}
        {!recentLoading && recent && recent.length === 0 && (
          <EmptyState title="Nothing checked yet" description="Your verified domains will show up here." />
        )}
        {!recentLoading && recent && recent.length > 0 && <HistoryTable records={recent} />}
      </div>
    </div>
  );
}