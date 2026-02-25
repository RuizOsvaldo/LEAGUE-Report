import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import Seo from "@/components/Seo";
import MonthPicker, { previousMonthStartISO, monthLabel } from "@/components/MonthPicker";
import { useAssignedReviews } from "@/hooks/use-instructor";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError, redirectToLogin } from "@/lib/auth-utils";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, FilePenLine, Search, Send, SlidersHorizontal, TriangleAlert } from "lucide-react";

type SortKey = "name" | "status";

export default function InstructorReviews() {
  const { toast } = useToast();
  const [location] = useLocation();
  const initialMonth = useMemo(() => {
    const url = new URL(window.location.href);
    return url.searchParams.get("month") || previousMonthStartISO();
  }, []);
  const [month, setMonth] = useState<string>(initialMonth);
  const list = useAssignedReviews(month);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "pending" | "draft" | "sent">("all");
  const [sort, setSort] = useState<SortKey>("status");

  useEffect(() => {
    if (list.error instanceof Error && isUnauthorizedError(list.error)) {
      redirectToLogin((o) => toast(o));
    }
  }, [list.error, toast]);

  const filtered = useMemo(() => {
    const rows = list.data ?? [];
    const q = query.trim().toLowerCase();

    const afterFilter = rows.filter((r) => {
      const matchesQ = !q || r.studentName.toLowerCase().includes(q) || (r.subject ?? "").toLowerCase().includes(q);
      const matchesStatus = status === "all" ? true : r.status === status;
      return matchesQ && matchesStatus;
    });

    const score = (s: string) => (s === "sent" ? 0 : s === "draft" ? 1 : 2);
    afterFilter.sort((a, b) => {
      if (sort === "name") return a.studentName.localeCompare(b.studentName);
      return score(a.status) - score(b.status) || a.studentName.localeCompare(b.studentName);
    });

    return afterFilter;
  }, [list.data, query, status, sort]);

  return (
    <AppShell variant="instructor">
      <Seo title={`Reviews — ${monthLabel(month)} | JTL Reviews`} description="Assigned student reviews, searchable and filterable." />

      <div className="animate-in">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-3xl" data-testid="reviews-title">
              Reviews
            </h1>
            <p className="mt-2 text-sm text-muted-foreground" data-testid="reviews-subtitle">
              Search, filter, sort, then open any student to draft + send.
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto">
            <MonthPicker value={month} onChange={setMonth} testId="reviews-month-picker" />
            <div className="flex flex-col gap-2">
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Sort</label>
              <Button
                variant="secondary"
                onClick={() => setSort((s) => (s === "status" ? "name" : "status"))}
                data-testid="reviews-sort-toggle"
                className={cn(
                  "rounded-2xl border bg-card/60 hover:bg-card hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200",
                )}
              >
                <ArrowUpDown className="mr-2 h-4 w-4" />
                {sort === "status" ? "By status" : "By name"}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-[2rem] border bg-card/70 p-5 shadow-sm backdrop-blur lg:col-span-1">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              <div className="font-display text-xl">Filters</div>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Search</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Student or subject…"
                  data-testid="reviews-search"
                  className="h-12 rounded-2xl pl-9"
                  type="search"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-xs font-semibold text-muted-foreground">Status</label>
              <div className="flex flex-wrap gap-2">
                {(["all", "pending", "draft", "sent"] as const).map((s) => (
                  <button
                    key={s}
                    data-testid={`reviews-filter-${s}`}
                    onClick={() => setStatus(s)}
                    className={cn(
                      "rounded-2xl border px-3 py-2 text-xs font-semibold capitalize transition-all duration-200",
                      "hover:-translate-y-0.5 active:translate-y-0",
                      status === s
                        ? "bg-gradient-to-r from-primary/18 to-accent/10 shadow-sm"
                        : "bg-card/60 hover:bg-card",
                      "focus:outline-none focus-visible:ring-4 focus-visible:ring-ring/15",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-3xl border bg-card/60 p-4 text-xs text-muted-foreground">
              <div className="font-semibold text-foreground/80">Pro tip</div>
              <div className="mt-1">
                Drafts are meant to be “good enough”. Sending can always include a small personal sentence—parents feel it.
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-[2rem] border bg-card/70 p-5 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-display text-xl" data-testid="reviews-list-title">
                    Assigned students
                  </div>
                  <div className="text-xs text-muted-foreground" data-testid="reviews-list-meta">
                    {monthLabel(month)} • {filtered.length} of {(list.data ?? []).length}
                  </div>
                </div>
                <Badge variant="secondary" className="rounded-2xl border bg-card/60" data-testid="reviews-location">
                  {location}
                </Badge>
              </div>

              <div className="mt-4 space-y-3">
                {list.isLoading && (
                  <div className="space-y-3" data-testid="reviews-loading">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-16 rounded-3xl border bg-card/60 shadow-sm animate-pulse" />
                    ))}
                  </div>
                )}

                {list.error && !list.isLoading && (
                  <div className="rounded-3xl border bg-destructive/10 p-5 text-sm" data-testid="reviews-error">
                    <div className="flex items-start gap-3">
                      <TriangleAlert className="mt-0.5 h-5 w-5 text-destructive" />
                      <div className="min-w-0">
                        <div className="font-semibold text-destructive">Couldn’t load assigned reviews</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {(list.error as Error).message}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!list.isLoading && !list.error && filtered.length === 0 && (
                  <div className="rounded-3xl border bg-card/60 p-6 text-sm text-muted-foreground" data-testid="reviews-empty">
                    No matches. Try clearing search or switching status filter.
                  </div>
                )}

                {filtered.map((r) => {
                  const icon =
                    r.status === "sent" ? (
                      <Send className="h-4 w-4 text-primary" />
                    ) : r.status === "draft" ? (
                      <FilePenLine className="h-4 w-4 text-accent" />
                    ) : (
                      <div className="h-2.5 w-2.5 rounded-full bg-destructive" />
                    );

                  return (
                    <Link
                      key={r.monthlyReviewId}
                      href={`/instructor/reviews/${r.monthlyReviewId}`}
                      data-testid={`reviews-open-${r.monthlyReviewId}`}
                      className={cn(
                        "group flex items-center justify-between gap-3 rounded-3xl border bg-card/60 px-4 py-4 shadow-sm",
                        "transition-all duration-300 hover:-translate-y-0.5 hover:bg-card hover:shadow-lg",
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl border bg-card/60 shadow-sm">
                          {icon}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-semibold" data-testid={`reviews-student-${r.monthlyReviewId}`}>
                            {r.studentName}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {r.subject || "No subject yet"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded-2xl border px-3 py-1 text-xs font-semibold capitalize",
                            r.status === "sent"
                              ? "bg-primary/10 text-primary border-primary/20"
                              : r.status === "draft"
                              ? "bg-accent/10 text-accent border-accent/20"
                              : "bg-destructive/10 text-destructive border-destructive/20",
                          )}
                          data-testid={`reviews-status-${r.monthlyReviewId}`}
                        >
                          {r.status}
                        </span>
                        <span className="hidden text-xs text-muted-foreground sm:inline" data-testid={`reviews-sentAt-${r.monthlyReviewId}`}>
                          {r.sentAt ? new Date(r.sentAt).toLocaleDateString() : ""}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
