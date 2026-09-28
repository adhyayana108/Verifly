import { useRef, useState, type DragEvent } from "react";
import { cn } from "../../lib/cn";
import { Button } from "../ui/Button";

interface BulkUploaderProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export function BulkUploader({ onFileSelected, disabled }: BulkUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelected(file);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-md border border-dashed px-6 py-12 text-center transition-colors duration-150",
        dragging ? "border-signal bg-signal-faint" : "border-line",
        disabled && "opacity-50"
      )}
    >
      <p className="font-mono text-sm text-ink-dim">Drop a CSV here</p>
      <p className="text-xs text-ink-faint max-w-xs">
        A "domain" column, or one domain per line. Up to 500 domains per upload.
      </p>
      <Button
        variant="secondary"
        size="sm"
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        Choose file
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv,text/plain"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelected(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}