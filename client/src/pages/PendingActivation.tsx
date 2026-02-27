import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Clock, LogOut, RefreshCcw, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export default function PendingActivation({
  onRefresh,
  isRefreshing,
}: {
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  const { user, logout, isLoggingOut } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-mesh grain">
      <Seo title="Pending Activation — LEAGUE Report" description="Your account is pending admin activation." />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="glass rounded-[2rem] p-7 shadow-soft">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border bg-card/60 shadow-sm">
              <Clock className="h-5 w-5 text-accent" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-2xl">Pending activation</h1>
              <p className="mt-1 text-sm text-muted-foreground" data-testid="pending-activation-message">
                An admin needs to activate your instructor account before you can access monthly reviews.
                If you believe this is a mistake, please contact your program administrator.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  data-testid="pending-activation-refresh"
                  className="rounded-2xl bg-gradient-to-r from-primary to-primary/85 shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  {isRefreshing ? "Checking…" : "Check again"}
                </Button>

                {user?.isAdmin && (
                  <Button
                    variant="outline"
                    onClick={() => setLocation("/admin")}
                    className="rounded-2xl border-primary text-primary hover:bg-primary/5 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Go to Admin Dashboard
                  </Button>
                )}

                <Button
                  variant="secondary"
                  onClick={() => logout()}
                  disabled={isLoggingOut}
                  data-testid="pending-activation-logout"
                  className="rounded-2xl border bg-card/60 hover:bg-card hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {isLoggingOut ? "Signing out…" : "Sign out"}
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border bg-card/60 p-5 shadow-sm">
            <div className="text-sm font-semibold">What happens next?</div>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Admin toggles your account to <span className="font-semibold text-foreground/80">Active</span>.</li>
              <li>You sync assigned students for the month (Pike13 stub for MVP).</li>
              <li>You draft reviews, send emails, and track completion.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
