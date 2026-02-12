import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Seo from "@/components/Seo";
import MonthPicker, { previousMonthStartISO, monthLabel } from "@/components/MonthPicker";
import { useAdminCompliance } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError, redirectToLogin } from "@/lib/auth-utils";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TriangleAlert } from "lucide-react";

export default function AdminOverview() {
  const { toast } = useToast();
  const [month, setMonth] = useState(previousMonthStartISO());
  const compliance = useAdminCompliance(month);

  useEffect(() => {
    if (compliance.error instanceof Error && isUnauthorizedError(compliance.error)) {
      redirectToLogin((o) => toast(o));
    }
  }, [compliance.error, toast]);

  const rows = compliance.data ?? [];
  const totals = rows.reduce(
    (acc, r) => {
      acc.totalAssigned += r.totalAssigned;
      acc.sent += r.sent;
      acc.pending += r.pending;
      return acc;
    },
    { totalAssigned: 0, sent: 0, pending: 0 },
  );

  return (
    <AppShell variant="admin">
      <Seo title={`Admin Overview — ${monthLabel(month)} | LEAGUE Reviews`} description="Admin overview for activation and compliance." />

      <div className="animate-in">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-3xl" data-testid="admin-overview-title">
              Overview
            </h1>
            <p className="mt-2 text-sm text-muted-foreground" data-testid="admin-overview-subtitle">
              Monthly compliance snapshot across instructors. Use this to identify follow-ups early.
            </p>
          </div>
          <div className="w-full sm:max-w-sm">
            <MonthPicker value={month} onChange={setMonth} testId="admin-month-picker" />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { label: "Assigned", value: totals.totalAssigned, cls: "from-foreground/8 via-primary/10 to-transparent" },
            { label: "Sent", value: totals.sent, cls: "from-primary/16 via-primary/8 to-transparent" },
            { label: "Pending", value: totals.pending, cls: "from-destructive/14 via-destructive/8 to-transparent" },
          ].map((c) => (
            <div
              key={c.label}
              className={cn(
                "relative overflow-hidden rounded-[2rem] border bg-card/70 p-6 shadow-sm backdrop-blur",
                "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg",
              )}
              data-testid={`admin-overview-card-${c.label.toLowerCase()}`}
            >
              <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br", c.cls)} />
              <div className="relative">
                <div className="text-xs font-semibold text-muted-foreground">{c.label}</div>
                <div className="mt-2 font-display text-4xl leading-none">{c.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-[2rem] border bg-card/70 p-6 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-display text-2xl" data-testid="admin-overview-table-title">
                Instructors at a glance
              </div>
              <div className="text-sm text-muted-foreground">
                {monthLabel(month)} • {rows.length} instructors
              </div>
            </div>
            <Badge className="rounded-2xl border bg-card/60" data-testid="admin-overview-badge">
              Compliance
            </Badge>
          </div>

          {compliance.isLoading && (
            <div className="mt-4 space-y-3" data-testid="admin-overview-loading">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 rounded-3xl border bg-card/60 shadow-sm animate-pulse" />
              ))}
            </div>
          )}

          {compliance.error && !compliance.isLoading && (
            <div className="mt-4 rounded-3xl border bg-destructive/10 p-5" data-testid="admin-overview-error">
              <div className="flex items-start gap-3">
                <TriangleAlert className="mt-0.5 h-5 w-5 text-destructive" />
                <div>
                  <div className="font-semibold text-destructive">Couldn’t load compliance</div>
                  <div className="mt-1 text-sm text-muted-foreground">{(compliance.error as Error).message}</div>
                </div>
              </div>
            </div>
          )}

          {!compliance.isLoading && !compliance.error && (
            <div className="mt-4 grid grid-cols-1 gap-3" data-testid="admin-overview-list">
              {rows.map((r) => (
                <div
                  key={r.instructorId}
                  className={cn(
                    "flex flex-col gap-3 rounded-3xl border bg-card/60 px-4 py-4 shadow-sm",
                    "transition-all duration-300 hover:-translate-y-0.5 hover:bg-card hover:shadow-lg",
                    "md:flex-row md:items-center md:justify-between",
                  )}
                  data-testid={`admin-overview-row-${r.instructorId}`}
                >
                  <div className="min-w-0">
                    <div className="truncate font-semibold" data-testid={`admin-overview-name-${r.instructorId}`}>
                      {r.name || "Instructor"}
                    </div>
                    <div className="truncate text-xs text-muted-foreground" data-testid={`admin-overview-email-${r.instructorId}`}>
                      {r.email || "—"}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-2xl border bg-muted px-3 py-1 text-xs font-semibold">
                      Assigned: <span data-testid={`admin-overview-assigned-${r.instructorId}`}>{r.totalAssigned}</span>
                    </span>
                    <span className="rounded-2xl border bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
                      Sent: <span data-testid={`admin-overview-sent-${r.instructorId}`}>{r.sent}</span>
                    </span>
                    <span className="rounded-2xl border bg-destructive/10 text-destructive px-3 py-1 text-xs font-semibold">
                      Pending: <span data-testid={`admin-overview-pending-${r.instructorId}`}>{r.pending}</span>
                    </span>
                  </div>
                </div>
              ))}

              {rows.length === 0 && (
                <div className="rounded-3xl border bg-card/60 p-6 text-sm text-muted-foreground" data-testid="admin-overview-empty">
                  No compliance data for this month yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
