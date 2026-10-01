import type { ReactNode } from "react";
import { Link } from "react-router";
import { Logo } from "../components/brand/Logo";
import { Button } from "../components/ui/Button";

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Logo size="md" />
        <nav className="flex items-center gap-4">
          <Link to="/login" className="text-sm text-ink-dim hover:text-ink transition-colors">
            Sign in
          </Link>
          <Link to="/register">
            <Button variant="secondary" size="sm">
              Register
            </Button>
          </Link>
        </nav>
      </header>

      <main className="mx-auto grid max-w-5xl gap-12 px-6 pt-16 pb-24 md:grid-cols-[1.1fr_0.9fr] md:items-center md:pt-24">
        <div className="flex flex-col gap-6">
          <h1 className="font-mono text-3xl md:text-4xl text-ink leading-tight">
            Know what&rsquo;s really configured on your domain.
          </h1>
          <p className="text-base text-ink-dim max-w-md">
            Check MX, SPF and DMARC records in seconds. See exactly what your domain is publishing — verify one, or upload
            hundreds.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link to="/register">
              <Button variant="primary" size="lg">
                Verify a domain
              </Button>
            </Link>
            <Link to="/login" className="text-sm text-ink-dim hover:text-ink transition-colors px-1">
              View dashboard
            </Link>
          </div>
        </div>

        <DnsTree />
      </main>

      <footer className="mx-auto max-w-5xl px-6 pb-10">
        <div className="border-t border-line-soft pt-5 text-xs text-ink-faint font-mono">VERIFLY</div>
      </footer>
    </div>
  );
}

function DnsTree() {
  return (
    <div className="rounded-md border border-line bg-surface px-8 py-10 font-mono text-sm text-ink-dim">
      <div className="flex flex-col items-center gap-1.5">
        <TreeLine>domain</TreeLine>
        <Connector />
        <TreeLine muted>DNS</TreeLine>
        <div className="flex flex-col items-start gap-1 pl-2">
          <TreeLine dim>├── MX</TreeLine>
          <TreeLine dim>├── SPF</TreeLine>
          <TreeLine dim>└── DMARC</TreeLine>
        </div>
        <Connector />
        <span className="text-valid tracking-wide">VERIFIED</span>
      </div>
    </div>
  );
}

function TreeLine({ children, muted, dim }: { children: ReactNode; muted?: boolean; dim?: boolean }) {
  return <span className={dim ? "text-ink-faint" : muted ? "text-ink-dim" : "text-ink"}>{children}</span>;
}

function Connector() {
  return (
    <span className="text-ink-faint select-none" aria-hidden="true">
      ↓
    </span>
  );
}