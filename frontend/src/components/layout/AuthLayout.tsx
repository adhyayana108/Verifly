import type { ReactNode } from "react";
import { Link } from "react-router";
import { Logo } from "../brand/Logo";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-between border-r border-line px-12 py-10">
        <Logo size="md" />
        <div className="flex flex-col gap-4">
          <p className="font-mono text-2xl text-ink leading-snug max-w-sm">Your DNS, explained.</p>
          <p className="text-sm text-ink-dim max-w-xs">
            MX, SPF and DMARC — checked in seconds, with the full record shown so you can see exactly what's published.
          </p>
        </div>
        <div className="font-mono text-xs text-ink-faint leading-relaxed">
          <p>mail.example.com → MX</p>
          <p>"v=spf1 include:_spf.example.com ~all" → SPF</p>
          <p>"v=DMARC1; p=reject" → DMARC</p>
        </div>
      </div>

      <div className="flex flex-col justify-center px-6 py-12 md:px-16">
        <div className="mb-8 md:hidden">
          <Link to="/">
            <Logo size="md" />
          </Link>
        </div>
        <div className="mx-auto w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}