import { forwardRef, useId, useState, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  mono?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, mono, className, id, type = "text", ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword && showPassword ? "text" : type;

  return (
    <label htmlFor={inputId} className="flex flex-col gap-1.5">
      {label && <span className="text-sm text-ink-dim">{label}</span>}
      <span className="relative flex items-center">
        <input
          ref={ref}
          id={inputId}
          type={resolvedType}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={cn(
            "w-full rounded border bg-surface px-3 py-2.5 text-ink placeholder:text-ink-faint",
            "outline-none transition-colors duration-150",
            "focus:border-signal/60",
            error ? "border-invalid/50" : "border-line",
            mono && "font-mono",
            isPassword && "pr-10",
            className
          )}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2.5 text-ink-faint hover:text-ink-dim transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={0}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </span>
      {error && (
        <span id={`${inputId}-error`} className="text-xs text-invalid">
          {error}
        </span>
      )}
      {!error && hint && (
        <span id={`${inputId}-hint`} className="text-xs text-ink-faint">
          {hint}
        </span>
      )}
    </label>
  );
});

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.24 4.24M9.5 5.2A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a15 15 0 0 1-3.4 4.1M6.3 6.9C4 8.5 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 3-.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}