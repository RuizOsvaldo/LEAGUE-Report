import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpenCheck, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import Seo from "@/components/Seo";

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // If already logged in, the root route will render AppHome; this is just a nice guard.
    }
  }, [isAuthenticated, isLoading]);

  return (
    <div className="min-h-screen bg-mesh grain">
      <Seo
        title="LEAGUE Report — Monthly progress emails, simplified"
        description="Instructors write monthly student progress reviews, admins track compliance, and guardians leave service feedback."
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 overflow-hidden rounded-2xl border shadow-sm">
              <img src="/images/jtl_logo.png" alt="LEAGUE Report logo" className="h-full w-full object-cover" />
            </div>
            <div>
              <div className="font-display text-lg leading-tight">
                LEAGUE Report
              </div>
              <div className="text-xs text-muted-foreground">
                Monthly instructor-to-guardian progress updates
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/login"
              data-testid="landing-login"
              className="inline-flex"
            >
              <Button className="rounded-2xl bg-gradient-to-r from-primary to-primary/85 shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
                Log in
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </header>

        <main className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          <section className="animate-in">
            <h1 className="font-display text-4xl leading-[1.05] sm:text-5xl">
              Reviews that feel thoughtful.
              <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Tracking that feels effortless.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              Each month, instructors see their assigned students, write a
              structured progress update, send it to account managers/guardians,
              and admins get a clean compliance view—without chasing anyone.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href="/api/login"
                data-testid="landing-cta-login"
                className="inline-flex"
              >
                <Button className="w-full rounded-2xl bg-gradient-to-r from-primary to-primary/85 shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 sm:w-auto">
                  Get started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <Link
                href="/feedback/1"
                data-testid="landing-feedback-demo"
                className="inline-flex items-center justify-center rounded-2xl border bg-card/60 px-5 py-3 text-sm font-semibold shadow-sm backdrop-blur hover:bg-card hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                View feedback page demo
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border bg-card/60 p-4 shadow-sm backdrop-blur">
                <div className="flex items-center gap-2">
                  <BookOpenCheck className="h-4 w-4 text-primary" />
                  <div className="text-sm font-semibold">
                    Instructor workflow
                  </div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Draft, template, send—status updates automatically.
                </div>
              </div>
              <div className="rounded-3xl border bg-card/60 p-4 shadow-sm backdrop-blur">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <div className="text-sm font-semibold">Admin oversight</div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Activation + compliance for the month, at a glance.
                </div>
              </div>
            </div>
          </section>

          <section className="animate-in stagger-2">
            <div className="glass rounded-[2rem] p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <div className="font-display text-xl">
                  A month, in one board
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-2xl border bg-card/60 shadow-sm">
                  <Sparkles className="h-4 w-4 text-accent" />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  { label: "Assigned", value: "18" },
                  { label: "Sent", value: "12" },
                  { label: "Draft", value: "3" },
                  { label: "Pending", value: "3" },
                ].map((m, idx) => (
                  <div
                    key={m.label}
                    data-testid={`landing-metric-${idx}`}
                    className="rounded-3xl border bg-card/70 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="text-xs font-semibold text-muted-foreground">
                      {m.label}
                    </div>
                    <div className="mt-2 font-display text-3xl">{m.value}</div>
                    <div className="mt-2 h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-primary to-accent"
                        style={{ width: `${Math.min(100, (idx + 1) * 22)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-3xl border bg-card/60 p-4 shadow-sm">
                <div className="text-sm font-semibold">
                  Template placeholders supported
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {[
                    "{{student_name}}",
                    "{{month}}",
                    "{{instructor_name}}",
                    "{{progress_summary}}",
                    "{{next_steps}}",
                  ].map((t) => (
                    <span
                      key={t}
                      className="rounded-2xl border bg-muted px-3 py-1 font-mono text-[11px] text-foreground/80"
                      data-testid={`landing-placeholder-${t}`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="mt-12 border-t pt-6 text-xs text-muted-foreground">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              © {new Date().getFullYear()} LEAGUE of Amazing Programmers
            </div>
            <div className="flex items-center gap-4">
              <a
                className="hover:underline"
                href="/api/login"
                data-testid="landing-footer-login"
              >
                Login
              </a>
              <Link
                className="hover:underline"
                href="/admin"
                data-testid="landing-footer-admin"
              >
                Admin
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
