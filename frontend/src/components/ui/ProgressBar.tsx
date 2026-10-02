interface ProgressBarProps {
  value: number;
  label?: string;
}

export function ProgressBar({
  value,
  label,
}: ProgressBarProps) {
  const clamped = Math.max(
    0,
    Math.min(100, value),
  );

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-surface-raised"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-signal transition-[width] duration-300 ease-out"
          style={{
            width: `${clamped}%`,
          }}
        />
      </div>

      {label && (
        <p className="font-mono text-xs text-ink-faint">
          {label}
        </p>
      )}
    </div>
  );
}
