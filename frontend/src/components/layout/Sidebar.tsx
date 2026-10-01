import { NavLink } from "react-router";
import { Logo } from "../brand/Logo";
import { useAuth } from "../../lib/auth";
import { cn } from "../../lib/cn";

const NAV_ITEMS = [
  { to: "/app", label: "Overview", end: true },
  { to: "/app/verify", label: "Verify" },
  { to: "/app/bulk", label: "Bulk" },
  { to: "/app/history", label: "History" },
  { to: "/app/analytics", label: "Analytics" },
];


export function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-line bg-surface/40 px-4 py-5">
      <div className="px-1 pb-6">
        <Logo size="md" />
      </div>

      <nav className="flex flex-col gap-0.5" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "rounded px-2.5 py-1.5 text-sm border-l-2 transition-colors duration-150",
                isActive
                  ? "border-signal text-ink bg-surface-raised"
                  : "border-transparent text-ink-dim hover:text-ink hover:bg-surface-raised/60"
              )
            }
          >
            {item.label}
          </NavLink>
        ))}

        {user?.role === "admin" && (
          <>
            <div className="my-3 border-t border-line-soft" />
            <NavLink
              to="/app/admin"
              className={({ isActive }) =>
                cn(
                  "rounded px-2.5 py-1.5 text-sm border-l-2 transition-colors duration-150",
                  isActive
                    ? "border-signal text-ink bg-surface-raised"
                    : "border-transparent text-ink-dim hover:text-ink hover:bg-surface-raised/60"
                )
              }
            >
              Admin
            </NavLink>
          </>
        )}
      </nav>

      <div className="mt-auto flex flex-col gap-2 border-t border-line-soft pt-4">
        <div className="px-1">
          <p className="text-sm text-ink truncate">{user?.username}</p>
          <p className="text-xs text-ink-faint">{user?.role === "admin" ? "Administrator" : "Member"}</p>
        </div>
        <button
          onClick={logout}
          className="rounded px-2.5 py-1.5 text-left text-sm text-ink-faint hover:text-invalid hover:bg-invalid-faint transition-colors duration-150"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}