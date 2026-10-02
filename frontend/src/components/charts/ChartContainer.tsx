import type { ReactNode } from "react";

interface ChartContainerProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function ChartContainer({
  title,
  description,
  children,
}: ChartContainerProps) {
  return (
    <div className="rounded-md border border-line bg-surface p-5">
      <p className="text-sm text-ink">
        {title}
      </p>

      {description && (
        <p className="mt-0.5 mb-3 text-xs text-ink-faint">
          {description}
        </p>
      )}

      <div className={description ? "" : "mt-3"}>
        {children}
      </div>
    </div>
  );
}
