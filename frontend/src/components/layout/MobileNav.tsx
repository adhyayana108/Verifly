import { useState } from "react";
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

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <Logo size="sm" />
        <button
          onClick={() => setOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={open}
          className="flex h-8 w-8 items-center justify-center rounded text-ink-dim hover:text-ink hover:bg-surface-raised"
        >
          <MenuIcon />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-void animate-fade-in">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <Logo size="sm" />
            <button
              onClick={() => setOpen(false)}
              aria-label="Close navigation menu"
              className="flex h-8 w-8 items-center justify-center rounded text-ink-dim hover:text-ink hover:bg-surface-raised"
            >
              <CloseIcon />
            </button>
          </div>

          <nav className="flex flex-col gap-1 px-4 py-4" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "rounded px-3 py-2.5 text-base border-l-2",
                    isActive ? "border-signal text-ink bg-surface-raised" : "border-transparent text-ink-dim"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            {user?.role === "admin" && (
              <>
                <div className="my-2 border-t border-line-soft" />
                <NavLink
                  to="/app/admin"
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "rounded px-3 py-2.5 text-base border-l-2",
                      isActive ? "border-signal text-ink bg-surface-raised" : "border-transparent text-ink-dim"
                    )
                  }
                >
                  Admin
                </NavLink>
              </>
            )}
          </nav>

          <div className="mt-auto flex items-center justify-between border-t border-line px-4 py-4">
            <div>
              <p className="text-sm text-ink">{user?.username}</p>
              <p className="text-xs text-ink-faint">{user?.role === "admin" ? "Administrator" : "Member"}</p>
            </div>
            <button onClick={logout} className="text-sm text-ink-faint hover:text-invalid">
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}