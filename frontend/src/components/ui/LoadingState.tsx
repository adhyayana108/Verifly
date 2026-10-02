export function LoadingState({
  label = "Loading",
}: {
  label?: string;
}) {
  return (
    <div
      className="flex items-center gap-2.5 py-8 font-mono text-sm text-ink-faint"
      role="status"
      aria-live="polite"
    >
      <span className="flex gap-1">
        <Dot delay="0ms" />
        <Dot delay="150ms" />
        <Dot delay="300ms" />
      </span>

      {label}
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-1.5 w-1.5 rounded-full bg-ink-faint animate-blink"
      style={{ animationDelay: delay }}
      aria-hidden="true"
    />
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3">
      <div className="h-3 w-32 rounded-sm bg-surface-raised animate-pulse" />
      <div className="h-3 w-16 rounded-sm bg-surface-raised animate-pulse" />
      <div className="h-3 w-16 rounded-sm bg-surface-raised animate-pulse" />
      <div className="h-3 w-20 rounded-sm bg-surface-raised animate-pulse" />
    </div>
  );
}
