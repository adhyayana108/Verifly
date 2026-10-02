import type { ReactNode } from "react";
import { Button } from "./Button";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  action?: ReactNode;
}

export function ErrorState({
  message,
  onRetry,
  action,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-md border border-invalid/25 bg-invalid-faint px-5 py-4">
      <p className="text-sm text-ink">
        <span
          className="mr-1.5 font-mono text-invalid"
          aria-hidden="true"
        >
          ✕
        </span>
        {message}
      </p>

      {(onRetry || action) && (
        <div className="flex gap-2">
          {onRetry && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onRetry}
            >
              Try again
            </Button>
          )}

          {action}
        </div>
      )}
    </div>
  );
}

export function InlineError({
  message,
}: {
  message: string;
}) {
  return (
    <p
      className="text-sm text-invalid"
      role="alert"
    >
      {message}
    </p>
  );
}
