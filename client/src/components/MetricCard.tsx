import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function MetricCard({
  label,
  value,
  icon,
  tone = "neutral",
  testId,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone?: "neutral" | "primary" | "accent" | "danger";
  testId: string;
}) {
  const toneCls =
    tone === "primary"
      ? "from-primary/16 via-primary/8 to-transparent"
      : tone === "accent"
      ? "from-accent/18 via-accent/8 to-transparent"
      : tone === "danger"
      ? "from-destructive/16 via-destructive/8 to-transparent"
      : "from-foreground/6 via-foreground/3 to-transparent";

  return (
    <div
      data-testid={testId}
      className={cn(
        "group relative overflow-hidden rounded-3xl border bg-card/70 p-5 shadow-sm backdrop-blur",
        "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg",
      )}
    >
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br", toneCls)} />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-muted-foreground">{label}</div>
          <div className="mt-2 font-display text-3xl leading-none tracking-tight">{value}</div>
        </div>

        <div className="grid h-11 w-11 place-items-center rounded-2xl border bg-card/60 shadow-sm">
          <div className="text-primary">{icon}</div>
        </div>
      </div>

      <div className="relative mt-4 h-px bg-border/70" />
      <div className="relative mt-3 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground/80">Tip:</span> Hover for subtle depth—this is a “workboard”, not a spreadsheet.
      </div>
    </div>
  );
}
