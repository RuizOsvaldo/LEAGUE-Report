import { useMemo } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function monthStartISO(d: Date) {
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  return `${year}-${pad2(month)}-01`;
}

export function previousMonthStartISO(from = new Date()) {
  const d = new Date(from);
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return monthStartISO(d);
}

export function monthLabel(isoYYYYMMDD: string) {
  const [y, m] = isoYYYYMMDD.split("-").map((v) => Number(v));
  const d = new Date(y, (m || 1) - 1, 1);
  return d.toLocaleString(undefined, { month: "long", year: "numeric" });
}

export default function MonthPicker({
  value,
  onChange,
  monthsBack = 12,
  testId,
}: {
  value: string;
  onChange: (next: string) => void;
  monthsBack?: number;
  testId: string;
}) {
  const options = useMemo(() => {
    const base = new Date();
    base.setDate(1);

    const arr: { value: string; label: string }[] = [];
    for (let i = 0; i < monthsBack; i++) {
      const d = new Date(base);
      d.setMonth(d.getMonth() - i);
      const v = monthStartISO(d);
      arr.push({ value: v, label: monthLabel(v) });
    }
    return arr;
  }, [monthsBack]);

  return (
    <div className="relative">
      <label className="mb-1 block text-xs font-semibold text-muted-foreground">Month</label>
      <div className="relative">
        <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <select
          data-testid={testId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full appearance-none rounded-2xl border bg-card/60 pl-9 pr-10 py-3 text-sm font-semibold",
            "shadow-sm backdrop-blur transition-all duration-200",
            "hover:shadow-md focus:outline-none focus:ring-4 focus:ring-ring/15 focus:border-ring",
          )}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} data-testid={`${testId}-option-${o.value}`}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  );
}
