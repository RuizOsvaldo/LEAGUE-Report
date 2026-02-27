import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import Seo from "@/components/Seo";
import MonthPicker, { previousMonthStartISO, monthLabel } from "@/components/MonthPicker";
import { useAdminCompliance } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError, redirectToLogin } from "@/lib/auth-utils";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Search, TriangleAlert } from "lucide-react";

export default function AdminCompliance() {
  const { toast } = useToast();
  const [month, setMonth] = useState(previousMonthStartISO());
  const data = useAdminCompliance(month);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (data.error instanceof Error && isUnauthorizedError(data.error)) {
      redirectToLogin((o) => toast(o));
    }
  }, [data.error, toast]);

  const rows = useMemo(() => {
    const all = data.data ?? [];
    const query = q.trim().toLowerCase();
    const filtered = !query
      ? all
      : all.filter((r) => `${r.name ?? ""} ${r.email ?? ""}`.toLowerCase().includes(query));
    filtered.sort((a, b) => (b.pending - a.pending) || (a.name ?? "").localeCompare(b.name ?? ""));
    return filtered;
  }, [data.data, q]);

  return (
    <AppShell variant="admin">
      <Seo title={`Admin — Compliance (${monthLabel(month)}) | LEAGUE Report`} description="Identify instructors who haven't completed monthly reviews." />

      <div className="animate-in">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-3xl" data-testid="admin-compliance-title">
              Compliance
            </h1>
            <p className="mt-2 text-sm text-muted-foreground" data-testid="admin-compliance-subtitle">
              See who’s on track—and who needs a nudge—before month-end.
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto">
            <MonthPicker value={month} onChange={setMonth} testId="admin-compliance-month" />
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Search</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  data-testid="admin-compliance-search"
                  className="h-12 rounded-2xl pl-9"
                  placeholder="Filter by name or email…"
                  type="search"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[2rem] border bg-card/70 p-6 shadow-sm backdrop-blur">
          {data.isLoading && (
            <div className="space-y-3" data-testid="admin-compliance-loading">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 rounded-3xl border bg-card/60 shadow-sm animate-pulse" />
              ))}
            </div>
          )}

          {data.error && !data.isLoading && (
            <div className="rounded-3xl border bg-destructive/10 p-5" data-testid="admin-compliance-error">
              <div className="flex items-start gap-3">
                <TriangleAlert className="mt-0.5 h-5 w-5 text-destructive" />
                <div>
                  <div className="font-semibold text-destructive">Couldn’t load compliance</div>
                  <div className="mt-1 text-sm text-muted-foreground">{(data.error as Error).message}</div>
                </div>
              </div>
            </div>
          )}

          {!data.isLoading && !data.error && (
            <div className="space-y-3" data-testid="admin-compliance-list">
              {rows.map((r) => {
                const completion = r.totalAssigned ? Math.round((r.sent / r.totalAssigned) * 100) : 0;
                return (
                  <div
                    key={r.instructorId}
                    className={cn(
                      "rounded-3xl border bg-card/60 px-4 py-4 shadow-sm",
                      "transition-all duration-300 hover:-translate-y-0.5 hover:bg-card hover:shadow-lg",
                    )}
                    data-testid={`admin-compliance-row-${r.instructorId}`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <div className="truncate font-semibold" data-testid={`admin-compliance-name-${r.instructorId}`}>
                          {r.name || "Instructor"}
                        </div>
                        <div className="truncate text-xs text-muted-foreground" data-testid={`admin-compliance-email-${r.instructorId}`}>
                          {r.email || "—"}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-2xl border bg-muted px-3 py-1 text-xs font-semibold">
                          Assigned: <span data-testid={`admin-compliance-assigned-${r.instructorId}`}>{r.totalAssigned}</span>
                        </span>
                        <span className="rounded-2xl border bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
                          Sent: <span data-testid={`admin-compliance-sent-${r.instructorId}`}>{r.sent}</span>
                        </span>
                        <span className="rounded-2xl border bg-destructive/10 text-destructive px-3 py-1 text-xs font-semibold">
                          Pending: <span data-testid={`admin-compliance-pending-${r.instructorId}`}>{r.pending}</span>
                        </span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Completion</span>
                        <span data-testid={`admin-compliance-completion-${r.instructorId}`}>{completion}%</span>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-2 rounded-full bg-gradient-to-r",
                            completion >= 80 ? "from-primary to-accent" : completion >= 40 ? "from-accent to-primary" : "from-destructive to-accent",
                          )}
                          style={{ width: `${Math.min(100, completion)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {rows.length === 0 && (
                <div className="rounded-3xl border bg-card/60 p-6 text-sm text-muted-foreground" data-testid="admin-compliance-empty">
                  No instructors match your filter.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
