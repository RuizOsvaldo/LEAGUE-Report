import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import Seo from "@/components/Seo";
import { useAdminInstructors, useSetInstructorActive } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError, redirectToLogin } from "@/lib/auth-utils";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CheckCircle2, Search, Shield, TriangleAlert, XCircle } from "lucide-react";

export default function AdminInstructors() {
  const { toast } = useToast();
  const list = useAdminInstructors();
  const toggle = useSetInstructorActive();

  const [query, setQuery] = useState("");

  useEffect(() => {
    if (list.error instanceof Error && isUnauthorizedError(list.error)) {
      redirectToLogin((o) => toast(o));
    }
  }, [list.error, toast]);

  const filtered = useMemo(() => {
    const rows = list.data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = `${r.name ?? ""} ${r.email ?? ""} ${r.userId}`.toLowerCase();
      return hay.includes(q);
    });
  }, [list.data, query]);

  const onSetActive = async (instructorId: number, isActive: boolean) => {
    try {
      await toggle.mutateAsync({ instructorId, isActive });
      toast({
        title: isActive ? "Activated" : "Deactivated",
        description: `Instructor ${isActive ? "can now" : "can no longer"} access reviews.`,
      });
    } catch (e) {
      toast({ title: "Update failed", description: (e as Error).message, variant: "destructive" });
    }
  };

  return (
    <AppShell variant="admin">
      <Seo title="Admin — Instructors | LEAGUE Reviews" description="Activate or deactivate instructor accounts." />

      <div className="animate-in">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-3xl" data-testid="admin-instructors-title">
              Instructors
            </h1>
            <p className="mt-2 text-sm text-muted-foreground" data-testid="admin-instructors-subtitle">
              Only active instructors can see and send monthly reviews. Toggle access instantly.
            </p>
          </div>

          <div className="w-full sm:max-w-sm">
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">Search</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name, email, or userId…"
                data-testid="admin-instructors-search"
                className="h-12 rounded-2xl pl-9"
                type="search"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[2rem] border bg-card/70 p-6 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <div className="font-display text-2xl" data-testid="admin-instructors-table-title">
                Account activation
              </div>
            </div>
            <Badge className="rounded-2xl border bg-card/60" data-testid="admin-instructors-count">
              {filtered.length} shown
            </Badge>
          </div>

          {list.isLoading && (
            <div className="mt-4 space-y-3" data-testid="admin-instructors-loading">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 rounded-3xl border bg-card/60 shadow-sm animate-pulse" />
              ))}
            </div>
          )}

          {list.error && !list.isLoading && (
            <div className="mt-4 rounded-3xl border bg-destructive/10 p-5" data-testid="admin-instructors-error">
              <div className="flex items-start gap-3">
                <TriangleAlert className="mt-0.5 h-5 w-5 text-destructive" />
                <div>
                  <div className="font-semibold text-destructive">Couldn’t load instructors</div>
                  <div className="mt-1 text-sm text-muted-foreground">{(list.error as Error).message}</div>
                </div>
              </div>
            </div>
          )}

          {!list.isLoading && !list.error && (
            <div className="mt-4 space-y-3" data-testid="admin-instructors-list">
              {filtered.map((r) => (
                <div
                  key={r.instructorId}
                  className={cn(
                    "flex flex-col gap-3 rounded-3xl border bg-card/60 px-4 py-4 shadow-sm",
                    "transition-all duration-300 hover:-translate-y-0.5 hover:bg-card hover:shadow-lg",
                    "md:flex-row md:items-center md:justify-between",
                  )}
                  data-testid={`admin-instructor-row-${r.instructorId}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate font-semibold" data-testid={`admin-instructor-name-${r.instructorId}`}>
                        {r.name || "Instructor"}
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-2xl border px-2.5 py-1 text-xs font-semibold",
                          r.isActive
                            ? "bg-primary/10 text-primary border-primary/20"
                            : "bg-destructive/10 text-destructive border-destructive/20",
                        )}
                        data-testid={`admin-instructor-active-${r.instructorId}`}
                      >
                        {r.isActive ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                        {r.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="mt-1 truncate text-xs text-muted-foreground" data-testid={`admin-instructor-email-${r.instructorId}`}>
                      {r.email || "—"} • <span className="font-mono">{r.userId}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    {r.isActive ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="secondary"
                            data-testid={`admin-deactivate-${r.instructorId}`}
                            className="rounded-2xl border bg-card/60 hover:bg-card hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                            onClick={() => {}}
                          >
                            Deactivate
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[1.5rem] border bg-card/80 backdrop-blur">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="font-display text-2xl">Deactivate instructor?</AlertDialogTitle>
                            <AlertDialogDescription>
                              They will no longer be able to access reviews. This does not delete any historical data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-testid={`admin-deactivate-cancel-${r.instructorId}`}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              data-testid={`admin-deactivate-confirm-${r.instructorId}`}
                              onClick={() => onSetActive(r.instructorId, false)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Deactivate
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <Button
                        data-testid={`admin-activate-${r.instructorId}`}
                        onClick={() => onSetActive(r.instructorId, true)}
                        disabled={toggle.isPending}
                        className={cn(
                          "rounded-2xl bg-gradient-to-r from-primary to-primary/85 shadow-md shadow-primary/20",
                          "hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200",
                        )}
                      >
                        Activate
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="rounded-3xl border bg-card/60 p-6 text-sm text-muted-foreground" data-testid="admin-instructors-empty">
                  No instructors match your search.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
