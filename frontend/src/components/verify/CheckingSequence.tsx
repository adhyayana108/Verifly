interface CheckingSequenceProps {
  domain: string;
}

export function CheckingSequence({
  domain,
}: CheckingSequenceProps) {
  const steps = [
    "resolving MX",
    "inspecting SPF",
    "checking DMARC",
  ];

  return (
    <div className="flex flex-col gap-3 rounded-md border border-line bg-surface px-5 py-5">
      <p className="text-sm text-ink-dim">
        Checking{" "}
        <span className="font-mono text-ink">
          {domain}
        </span>
      </p>

      <div className="flex flex-col gap-1.5 font-mono text-sm text-ink-faint">
        {steps.map((step, index) => (
          <div
            key={step}
            className="flex items-center gap-2"
          >
            <span aria-hidden="true">
              {index === steps.length - 1
                ? "└─"
                : "├─"}
            </span>

            <span
              className="animate-blink"
              style={{
                animationDelay: `${index * 180}ms`,
              }}
            >
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
