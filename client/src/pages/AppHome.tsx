import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import Seo from "@/components/Seo";
import Landing from "@/pages/Landing";
import PendingActivation from "@/pages/PendingActivation";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { useInstructorStatus } from "@/hooks/use-instructor";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError, redirectToLogin } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield } from "lucide-react";

export default function AppHome() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const status = useInstructorStatus();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (status.error && status.error instanceof Error && isUnauthorizedError(status.error)) {
      redirectToLogin((o) => toast({
        title: o.title,
        description: o.description,
        variant: "destructive"
      }));
    }
  }, [status.error, toast]);

  const isActive = status.data?.isActive ?? false;

  const roleGuess = useMemo(() => {
    // We don't have a role claim; default to instructor. Admin pages will 403 if not admin.
    return "instructor" as const;
  }, []);

  if (isLoading) return <Landing />;
  if (!isAuthenticated) return <Landing />;

  if (status.isLoading) {
    return (
      <div className="min-h-screen bg-mesh grain">
        <Seo title="Loading — LEAGUE Reviews" />
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="glass rounded-[2rem] p-7 shadow-soft animate-in">
            <div className="h-6 w-52 rounded-xl bg-muted animate-pulse" />
            <div className="mt-4 h-4 w-full rounded-xl bg-muted animate-pulse" />
            <div className="mt-2 h-4 w-5/6 rounded-xl bg-muted animate-pulse" />
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="h-24 rounded-3xl border bg-card/60 shadow-sm animate-pulse" />
              <div className="h-24 rounded-3xl border bg-card/60 shadow-sm animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isActive) {
    return <PendingActivation onRefresh={() => status.refetch()} isRefreshing={status.isRefetching} />;
  }

  // Active user: provide a welcoming choice (instructor vs admin).
  return (
    <div className="min-h-screen bg-mesh grain">
      <Seo title="Home — LEAGUE Reviews" description="Choose your workspace." />
      <AppShell variant={roleGuess}>
        <div className="animate-in">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-3xl">Welcome back</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Jump into your instructor dashboard to draft and send monthly student progress reviews. If you’re an admin,
                open the console to manage instructor activation and monitor compliance.
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="group relative overflow-hidden rounded-[2rem] border bg-card/70 p-6 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/16 via-accent/10 to-transparent" />
              <div className="relative">
                <div className="font-display text-2xl">Instructor Workspace</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Review assigned students, use templates, save drafts, and send emails—status tracked automatically.
                </p>
                <div className="mt-6">
                  <Button
                    data-testid="home-go-instructor"
                    onClick={() => setLocation("/instructor")}
                    className="rounded-2xl bg-gradient-to-r from-primary to-primary/85 shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                  >
                    Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-[2rem] border bg-card/70 p-6 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-foreground/8 via-primary/10 to-transparent" />
              <div className="relative">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <div className="font-display text-2xl">Admin Console</div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Activate instructors and watch monthly compliance roll up in a clean, audit-friendly view.
                </p>
                <div className="mt-6">
                  <Button
                    data-testid="home-go-admin"
                    variant="secondary"
                    onClick={() => setLocation("/admin")}
                    className="rounded-2xl border bg-card/60 hover:bg-card hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                  >
                    Open Admin <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  If you’re not an admin, this will show a permission error (403).
                </p>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </div>
  );
}
