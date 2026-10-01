import { useEffect, useState } from "react";
import { Badge } from "../components/ui/Badge";
import { LoadingState } from "../components/ui/LoadingState";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { ApiError, getAdminUsers } from "../lib/api";
import { useAuth } from "../lib/auth";
import { fullTimestamp } from "../lib/format";
import type { AdminUserView } from "../lib/types";

export function AdminPage() {
  const { logout } = useAuth();
  const [users, setUsers] = useState<AdminUserView[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setUsers(await getAdminUsers());
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return logout();
      setError(err instanceof ApiError ? err.message : "Couldn't load the user list.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-mono text-xl text-ink">Admin</h1>
        <p className="text-sm text-ink-faint mt-1">Every registered account and today's quota usage.</p>
      </div>

      {loading && <LoadingState label="Loading users" />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && users && users.length === 0 && <EmptyState title="No users yet" />}

      {!loading && !error && users && users.length > 0 && (
        <>
          <table className="hidden md:table w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-ink-faint">
                <th className="py-2.5 font-normal">Username</th>
                <th className="py-2.5 font-normal">Email</th>
                <th className="py-2.5 font-normal">Role</th>
                <th className="py-2.5 font-normal">Usage today</th>
                <th className="py-2.5 font-normal">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-line-soft">
                  <td className="py-3 font-mono text-ink">{u.username}</td>
                  <td className="py-3 text-ink-dim">{u.email}</td>
                  <td className="py-3">
                    <Badge tone={u.role === "admin" ? "signal" : "default"}>{u.role}</Badge>
                  </td>
                  <td className="py-3 font-mono text-ink-dim tabular-nums">
                    {u.quotaUsedToday} / {u.dailyQuota}
                  </td>
                  <td className="py-3 text-ink-faint">{fullTimestamp(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile cards */}
          <div className="flex flex-col gap-2 md:hidden">
            {users.map((u) => (
              <div key={u.id} className="rounded-md border border-line bg-surface px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-sm text-ink truncate">{u.username}</span>
                  <Badge tone={u.role === "admin" ? "signal" : "default"}>{u.role}</Badge>
                </div>
                <p className="text-xs text-ink-faint mt-1">{u.email}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-ink-faint font-mono">
                  <span>
                    {u.quotaUsedToday} / {u.dailyQuota} today
                  </span>
                  <span>{fullTimestamp(u.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}