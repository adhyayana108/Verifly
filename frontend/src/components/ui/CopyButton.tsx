import { useState } from "react";
import { cn } from "@/lib/cn";

interface CopyButtonProps {
  value: string;
  className?: string;
}

export function CopyButton({
  value,
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!value}
      aria-label={copied ? "Copied" : "Copy"}
      className={cn(
        "shrink-0 rounded-sm border border-line px-2 py-1",
        "font-mono text-xs text-ink-dim",
        "transition-colors hover:border-signal hover:text-signal",
        "disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
    >
      {copied ? "copied" : "copy"}
    </button>
  );
}
