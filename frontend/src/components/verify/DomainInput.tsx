import { useState, type FormEvent } from "react";
import { cn } from "../../lib/cn";

interface DomainInputProps {
  onSubmit: (domain: string) => void;
  loading?: boolean;
  autoFocus?: boolean;
}

const DOMAIN_PATTERN = /^(?=.{1,253}$)([a-zA-Z0-9](-*[a-zA-Z0-9])*\.)+[a-zA-Z]{2,}$/;

export function DomainInput({ onSubmit, loading, autoFocus }: DomainInputProps) {
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);

  const trimmed = value.trim();
  const isValidShape = trimmed.length === 0 || DOMAIN_PATTERN.test(trimmed);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!trimmed || !DOMAIN_PATTERN.test(trimmed) || loading) return;
    onSubmit(trimmed.toLowerCase());
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div
        className={cn(
          "flex items-center rounded-md border bg-surface pl-4 pr-1.5 py-1.5 transition-colors duration-150",
          "focus-within:border-signal/60",
          touched && !isValidShape ? "border-invalid/50" : "border-line"
        )}
      >
        <span className="mr-2 select-none text-ink-faint font-mono" aria-hidden="true">
          $
        </span>
        <input
          type="text"
          inputMode="url"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus={autoFocus}
          placeholder="example.com"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => setTouched(true)}
          aria-label="Domain to verify"
          className="flex-1 bg-transparent py-1.5 font-mono text-base text-ink placeholder:text-ink-faint outline-none"
        />
        <button
          type="submit"
          disabled={loading || !trimmed}
          aria-label="Verify domain"
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded transition-colors duration-150",
            "bg-signal text-void hover:bg-signal/90 disabled:opacity-30 disabled:cursor-not-allowed"
          )}
        >
          {loading ? <SpinnerIcon /> : <ArrowIcon />}
        </button>
      </div>

      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-ink-faint font-mono">Check MX · SPF · DMARC</p>
        {touched && !isValidShape && <p className="text-xs text-invalid">Enter a valid domain, like example.com</p>}
      </div>
    </form>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}