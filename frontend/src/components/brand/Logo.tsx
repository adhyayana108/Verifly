interface LogoProps {
  size?: "sm" | "md" | "lg";
  withMark?: boolean;
  className?: string;
}

const SIZE_MAP: Record<NonNullable<LogoProps["size"]>, { text: string; mark: number; tracking: string }> = {
  sm: { text: "text-sm", mark: 16, tracking: "tracking-tight" },
  md: { text: "text-lg", mark: 20, tracking: "tracking-tight" },
  lg: { text: "text-2xl", mark: 26, tracking: "tracking-tight" },
};


export function Logo({ size = "md", withMark = true, className = "" }: LogoProps) {
  const s = SIZE_MAP[size];
  return (
    <span className={`inline-flex items-center gap-2 font-mono ${s.text} ${s.tracking} ${className}`}>
      {withMark && (
        <svg width={s.mark} height={s.mark} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="0.5" y="0.5" width="15" height="15" rx="3.5" stroke="#4DD9C0" strokeOpacity="0.5" />
          <path d="M4 8.2l2.6 2.6L12 5" stroke="#4DD9C0" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      <span className="text-ink font-medium">
        VERI<span className="text-ink-dim">FLY</span>
      </span>
    </span>
  );
}