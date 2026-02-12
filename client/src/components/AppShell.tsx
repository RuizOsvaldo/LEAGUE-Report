import { ReactNode, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  BookOpenCheck,
  ClipboardList,
  Gauge,
  LayoutGrid,
  LogOut,
  Shield,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

function UserPill({
  name,
  email,
  avatarUrl,
}: {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}) {
  const initials = useMemo(() => {
    const n = (name || email || "User").trim();
    const parts = n.split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase()).join("");
  }, [name, email]);

  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card/60 px-3 py-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div
        className={cn(
          "relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl border",
          "bg-gradient-to-br from-primary/20 via-accent/10 to-transparent",
        )}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={name || "User"} className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm font-semibold text-foreground/80">{initials}</span>
        )}
        <span className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/20 dark:ring-white/10" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold" data-testid="current-user-name">
          {name || "Signed in"}
        </div>
        <div className="truncate text-xs text-muted-foreground" data-testid="current-user-email">
          {email || " "}
        </div>
      </div>
    </div>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
  active,
  testId,
}: {
  href: string;
  icon: any;
  label: string;
  active: boolean;
  testId: string;
}) {
  return (
    <Link
      href={href}
      data-testid={testId}
      className={cn(
        "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        active ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" : "text-sidebar-foreground/80",
      )}
    >
      <span
        className={cn(
          "grid h-9 w-9 place-items-center rounded-xl border transition-all duration-200",
          "bg-gradient-to-br from-transparent via-transparent to-transparent",
          active
            ? "border-sidebar-border bg-gradient-to-br from-primary/14 via-accent/10 to-transparent"
            : "border-sidebar-border/70 group-hover:border-sidebar-border",
        )}
      >
        <Icon className={cn("h-4.5 w-4.5", active ? "text-primary" : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground")} />
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

export default function AppShell({
  children,
  variant,
}: {
  children: ReactNode;
  variant: "instructor" | "admin";
}) {
  const [location] = useLocation();
  const { user, logout, isLoggingOut } = useAuth();

  const displayName =
    (user?.firstName || user?.lastName
      ? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()
      : null) ?? null;

  const links =
    variant === "admin"
      ? [
          { href: "/admin", label: "Overview", icon: Shield, testId: "nav-admin-overview" },
          { href: "/admin/instructors", label: "Instructors", icon: LayoutGrid, testId: "nav-admin-instructors" },
          { href: "/admin/compliance", label: "Compliance", icon: ClipboardList, testId: "nav-admin-compliance" },
        ]
      : [
          { href: "/instructor", label: "Dashboard", icon: Gauge, testId: "nav-instructor-dashboard" },
          { href: "/instructor/reviews", label: "Reviews", icon: BookOpenCheck, testId: "nav-instructor-reviews" },
          { href: "/templates", label: "Templates", icon: Sparkles, testId: "nav-instructor-templates" },
        ];

  const isActive = (href: string) => (href === "/" ? location === "/" : location.startsWith(href));

  return (
    <SidebarProvider>
      <div className="relative z-0 min-h-screen bg-mesh grain">
        <div className="relative z-10">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="glass rounded-3xl shadow-soft">
              <div className="flex flex-col lg:flex-row">
                <aside className="w-full lg:w-[320px]">
                  <div className="flex items-center justify-between px-5 py-5 lg:justify-start lg:gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative grid h-10 w-10 place-items-center rounded-2xl border bg-gradient-to-br from-primary/20 via-accent/10 to-transparent shadow-sm">
                        <span className="font-display text-lg" aria-hidden>
                          Λ
                        </span>
                        <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20 dark:ring-white/10" />
                      </div>
                      <div className="leading-tight">
                        <div className="font-display text-base" data-testid="app-brand-title">
                          LEAGUE Reviews
                        </div>
                        <div className="text-xs text-muted-foreground" data-testid="app-brand-subtitle">
                          Monthly progress, beautifully tracked
                        </div>
                      </div>
                    </div>

                    <div className="lg:hidden">
                      <SidebarTrigger data-testid="sidebar-trigger" />
                    </div>
                  </div>

                  <div className="px-5 pb-5">
                    <UserPill name={displayName} email={user?.email ?? null} avatarUrl={user?.profileImageUrl ?? null} />
                  </div>

                  <nav className="px-3 pb-5">
                    <div className="space-y-1">
                      {links.map((l) => (
                        <NavItem
                          key={l.href}
                          href={l.href}
                          icon={l.icon}
                          label={l.label}
                          active={isActive(l.href)}
                          testId={l.testId}
                        />
                      ))}
                    </div>

                    <div className="px-2 pt-5">
                      <Separator className="bg-sidebar-border/70" />
                    </div>

                    <div className="px-2 pt-4">
                      <Button
                        variant="secondary"
                        onClick={() => logout()}
                        disabled={isLoggingOut}
                        data-testid="logout-button"
                        className={cn(
                          "w-full justify-start rounded-2xl border bg-sidebar-accent/40 shadow-sm",
                          "hover:bg-sidebar-accent hover:-translate-y-0.5 active:translate-y-0",
                          "transition-all duration-200",
                        )}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        {isLoggingOut ? "Signing out…" : "Sign out"}
                      </Button>
                    </div>
                  </nav>
                </aside>

                <SidebarInset className="w-full">
                  <header className="flex items-center justify-between gap-3 border-b bg-card/30 px-5 py-4 backdrop-blur">
                    <div className="flex items-center gap-3">
                      <div className="hidden lg:block">
                        <SidebarTrigger data-testid="sidebar-trigger-desktop" />
                      </div>
                      <div>
                        <div className="font-display text-xl" data-testid="page-shell-title">
                          {variant === "admin" ? "Admin Console" : "Instructor Workspace"}
                        </div>
                        <div className="text-xs text-muted-foreground" data-testid="page-shell-subtitle">
                          {variant === "admin"
                            ? "Activation, compliance, and oversight"
                            : "Write reviews, send emails, track completion"}
                        </div>
                      </div>
                    </div>

                    <div className="hidden md:flex items-center gap-2">
                      <Link
                        href={variant === "admin" ? "/instructor" : "/admin"}
                        data-testid="switch-role-link"
                        className={cn(
                          "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold",
                          "bg-gradient-to-br from-card to-card/60 shadow-sm",
                          "hover:-translate-y-0.5 hover:shadow-md transition-all duration-200",
                        )}
                      >
                        <LayoutGrid className="h-4 w-4 text-primary" />
                        <span>{variant === "admin" ? "Go to Instructor" : "Go to Admin"}</span>
                      </Link>
                    </div>
                  </header>

                  <main className="px-5 py-6 sm:px-6 lg:px-8">{children}</main>
                </SidebarInset>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
