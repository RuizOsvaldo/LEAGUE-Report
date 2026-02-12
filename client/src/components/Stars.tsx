import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Stars({
  value,
  onChange,
  size = "md",
  readOnly = false,
  testId,
}: {
  value: number;
  onChange?: (n: number) => void;
  size?: "sm" | "md" | "lg";
  readOnly?: boolean;
  testId: string;
}) {
  const px = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-7 w-7" : "h-5 w-5";

  return (
    <div className="flex items-center gap-1.5" data-testid={testId}>
      {Array.from({ length: 5 }).map((_, i) => {
        const n = i + 1;
        const filled = n <= value;
        return (
          <button
            key={n}
            type="button"
            onClick={() => (!readOnly ? onChange?.(n) : undefined)}
            disabled={readOnly}
            data-testid={`${testId}-star-${n}`}
            className={cn(
              "group relative grid place-items-center rounded-xl p-2 transition-all duration-200",
              "hover:-translate-y-0.5 active:translate-y-0",
              readOnly ? "cursor-default" : "cursor-pointer",
              "focus:outline-none focus-visible:ring-4 focus-visible:ring-ring/15",
            )}
            aria-label={`${n} star`}
          >
            <Star
              className={cn(
                px,
                "transition-all duration-200",
                filled ? "fill-accent text-accent" : "text-muted-foreground/70 group-hover:text-accent",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
