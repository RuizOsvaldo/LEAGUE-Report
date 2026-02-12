import type { ReviewTemplate } from "@shared/schema";
import { Copy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function TemplatePreviewCard({
  template,
  onUse,
  onDuplicate,
}: {
  template: ReviewTemplate;
  onUse: () => void;
  onDuplicate: () => void;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-3xl border bg-card/70 p-5 shadow-sm backdrop-blur",
        "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg",
      )}
      data-testid={`template-card-${template.id}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/12 via-accent/8 to-transparent opacity-70" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-2xl border bg-card/60 shadow-sm">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="truncate font-display text-lg leading-tight" data-testid={`template-name-${template.id}`}>
                {template.name}
              </div>
              <div className="truncate text-xs text-muted-foreground" data-testid={`template-subject-${template.id}`}>
                {template.subject}
              </div>
            </div>
          </div>

          <div className="mt-4 line-clamp-4 whitespace-pre-wrap text-sm text-foreground/85">
            {template.body}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={onUse}
            data-testid={`template-use-${template.id}`}
            className={cn(
              "rounded-2xl shadow-md shadow-primary/15",
              "bg-gradient-to-r from-primary to-primary/85",
              "hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0",
              "transition-all duration-200",
            )}
          >
            Use
          </Button>
          <Button
            variant="secondary"
            onClick={onDuplicate}
            data-testid={`template-duplicate-${template.id}`}
            className={cn(
              "rounded-2xl border bg-card/60",
              "hover:bg-card hover:-translate-y-0.5 active:translate-y-0",
              "transition-all duration-200",
            )}
          >
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </Button>
        </div>
      </div>
    </div>
  );
}
