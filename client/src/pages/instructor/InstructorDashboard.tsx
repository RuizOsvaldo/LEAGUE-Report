import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import Seo from "@/components/Seo";
import MonthPicker, { previousMonthStartISO, monthLabel } from "@/components/MonthPicker";
import MetricCard from "@/components/MetricCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError, redirectToLogin } from "@/lib/auth-utils";
import { useAssignedReviews, useInstructorDashboard } from "@/hooks/use-instructor";
import { usePike13Sync } from "@/hooks/use-pike13";
import { Link } from "wouter";
import { CheckCircle2, Clock3, FilePenLine, RefreshCcw, Send, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export default function InstructorDashboard() {
  const { toast } = useToast();
  const [month, setMonth] = useState<string>(() => previousMonthStartISO());

  const dashboard = useInstructorDashboard(month);
  const assigned = useAssignedReviews(month);
  const sync = usePike13Sync();

  useEffect(() => {
    const err = (dashboard.error ?? assigned.error) as unknown;
    if (err instanceof Error && isUnauthorizedError(err)) {
      redirectToLogin((o) => toast(o));
    }
  }, [dashboard.error, assigned.error, toast]);

  const summary = dashboard.data;
  const rows = assigned.data ?? [];

  const counts = useMemo(() => {
    const sent = rows.filter((r) => r.status === "sent").length;
    const draft = rows.filter((r) => r.status === "draft").length;
    const pending = rows.filter((r) => r.status === "pending").length;
    return { total: rows.length, sent, draft, pending };
  }, [rows]);

  return (
    <AppShell variant="instructor">
      <Seo title={`Instructor Dashboard — ${monthLabel(month)} | LEAGUE Reviews`} description="Monthly summary and review progress." />

      <div className="animate-in">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-3xl" data-testid="instructor-dashboard-title">
              Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground" data-testid="instructor-dashboard-subtitle">
              Pick a month, sync assignments, and keep your review flow moving. Drafts autosave. Sends are tracked.
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto lg:grid-cols-2 lg:items-end">
            <MonthPicker value={month} onChange={setMonth} testId="instructor-month-picker" />
            <div className="flex flex-col gap-2">
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Data</label>
              <Button
                onClick={() => sync.mutate()}
                disabled={sync.isPending}
                data-testid="pike13-sync-button"
                className={cn(
                  "rounded-2xl bg-gradient-to-r from-primary to-primary/85 shadow-md shadow-primary/20",
                  "hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200",
                )}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                {sync.isPending ? "Syncing…" : "Sync from Pike13"}
              </Button>
              <div className="text-[11px] text-muted-foreground" data-testid="pike13-sync-hint">
                MVP: sync seeds assignments for the selected month.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            testId="metric-total-assigned"
            label="Assigned"
            value={summary?.totalAssigned ?? counts.total}
            icon={<Users className="h-5 w-5" />}
            tone="neutral"
          />
          <MetricCard
            testId="metric-sent"
            label="Sent"
            value={summary?.sent ?? counts.sent}
            icon={<Send className="h-5 w-5" />}
            tone="primary"
          />
          <MetricCard
            testId="metric-draft"
            label="Draft"
            value={summary?.draft ?? counts.draft}
            icon={<FilePenLine className="h-5 w-5" />}
            tone="accent"
          />
          <MetricCard
            testId="metric-pending"
            label="Pending"
            value={summary?.pending ?? counts.pending}
            icon={<Clock3 className="h-5 w-5" />}
            tone="danger"
          />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-[2rem] border bg-card/70 p-6 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-display text-2xl" data-testid="recent-reviews-title">
                    Recent activity
                  </div>
                  <div className="text-sm text-muted-foreground" data-testid="recent-reviews-subtitle">
                    Quick glance at what’s been sent in {monthLabel(month)}.
                  </div>
                </div>

                <Link
                  href={`/instructor/reviews?month=${encodeURIComponent(month)}`}
                  data-testid="dashboard-open-reviews"
                  className="inline-flex items-center justify-center rounded-2xl border bg-card/60 px-4 py-2 text-sm font-semibold shadow-sm hover:bg-card hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                >
                  Open reviews
                  <CheckCircle2 className="ml-2 h-4 w-4 text-primary" />
                </Link>
              </div>

              <div className="mt-5 space-y-3">
                {(assigned.isLoading || dashboard.isLoading) && (
                  <div className="space-y-3" data-testid="dashboard-loading">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-16 rounded-3xl border bg-card/60 shadow-sm animate-pulse" />
                    ))}
                  </div>
                )}

                {!assigned.isLoading && rows.length === 0 && (
                  <div className="rounded-3xl border bg-card/60 p-6 text-sm text-muted-foreground" data-testid="dashboard-empty">
                    No assigned students for this month yet. Try <span className="font-semibold text-foreground/80">Sync from Pike13</span>.
                  </div>
                )}

                {rows
                  .slice()
                  .sort((a, b) => (a.status === b.status ? 0 : a.status === "sent" ? -1 : 1))
                  .slice(0, 5)
                  .map((r) => (
                    <Link
                      key={r.monthlyReviewId}
                      href={`/instructor/reviews/${r.monthlyReviewId}`}
                      data-testid={`dashboard-review-link-${r.monthlyReviewId}`}
                      className={cn(
                        "group flex items-center justify-between gap-3 rounded-3xl border bg-card/60 px-4 py-4 shadow-sm",
                        "transition-all duration-300 hover:-translate-y-0.5 hover:bg-card hover:shadow-lg",
                      )}
                    >
                      <div className="min-w-0">
                        <div className="truncate font-semibold" data-testid={`dashboard-student-${r.monthlyReviewId}`}>
                          {r.studentName}
                        </div>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          {r.subject || "No subject yet"} •{" "}
                          <span className="capitalize" data-testid={`dashboard-status-${r.monthlyReviewId}`}>
                            {r.status}
                          </span>
                        </div>
                      </div>
                      <div className="rounded-2xl border bg-muted px-3 py-1 text-xs font-semibold capitalize">
                        {r.status}
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border bg-card/70 p-6 shadow-sm backdrop-blur">
            <div className="font-display text-2xl">Workflow</div>
            <div className="mt-2 text-sm text-muted-foreground">
              A clean monthly cadence. A calm inbox. A happier parent conversation.
            </div>

            <ol className="mt-5 space-y-3 text-sm">
              {[
                { t: "Sync", d: "Pull last month’s students (stub for MVP)." },
                { t: "Draft", d: "Use a template and personalize quickly." },
                { t: "Send", d: "Email account manager / guardian with a feedback link." },
                { t: "Track", d: "Admin sees compliance automatically." },
              ].map((s, idx) => (
                <li key={s.t} className="flex items-start gap-3" data-testid={`workflow-step-${idx}`}>
                  <div className="mt-0.5 grid h-7 w-7 place-items-center rounded-xl border bg-card/60 text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-semibold">{s.t}</div>
                    <div className="text-xs text-muted-foreground">{s.d}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
