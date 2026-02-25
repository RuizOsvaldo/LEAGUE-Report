import { Link } from "wouter";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-mesh grain">
      <Seo title="404 — Page not found | JTL Reviews" />
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="glass rounded-[2rem] p-8 shadow-soft animate-in">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border bg-card/60 shadow-sm">
              <FileX className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h1 className="font-display text-3xl" data-testid="notfound-title">
                Page not found
              </h1>
              <p className="mt-2 text-sm text-muted-foreground" data-testid="notfound-subtitle">
                The link you followed doesn’t exist. Use the button below to return home.
              </p>

              <div className="mt-6">
                <Link href="/" data-testid="notfound-home-link" className="inline-flex">
                  <Button className="rounded-2xl bg-gradient-to-r from-primary to-primary/85 shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go home
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border bg-card/60 p-5 text-xs text-muted-foreground">
            If you expected something here, check the URL or return to the dashboard.
          </div>
        </div>
      </div>
    </div>
  );
}
