import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import Seo from "@/components/Seo";
import { useTemplates, useCreateTemplate } from "@/hooks/use-templates";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError, redirectToLogin } from "@/lib/auth-utils";
import TemplatePreviewCard from "@/components/TemplatePreviewCard";
import { templatePlaceholders } from "@shared/routes";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Copy, Plus, Sparkles, TriangleAlert } from "lucide-react";

export default function TemplatesPage() {
  const { toast } = useToast();
  const templates = useTemplates();
  const create = useCreateTemplate();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (templates.error instanceof Error && isUnauthorizedError(templates.error)) {
      redirectToLogin((o) => toast(o));
    }
  }, [templates.error, toast]);

  const placeholders = useMemo(() => Object.values(templatePlaceholders), []);

  const resetForm = () => {
    setName("");
    setSubject("");
    setBody("");
  };

  const onCreate = async () => {
    try {
      await create.mutateAsync({
        name: name.trim(),
        subject: subject.trim(),
        body: body.trim(),
      } as any);
      toast({ title: "Template created", description: "Ready to use in any review." });
      setOpen(false);
      resetForm();
    } catch (e) {
      toast({ title: "Couldn’t create template", description: (e as Error).message, variant: "destructive" });
    }
  };

  return (
    <AppShell variant="instructor">
      <Seo title="Templates — LEAGUE Reviews" description="Create and manage instructor review templates." />

      <div className="animate-in">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-3xl" data-testid="templates-title">
              Templates
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground" data-testid="templates-subtitle">
              Templates help you move fast while still sounding human. Use placeholders, then personalize a sentence or two.
            </p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                data-testid="templates-new"
                className={cn(
                  "rounded-2xl bg-gradient-to-r from-primary to-primary/85 shadow-md shadow-primary/20",
                  "hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200",
                )}
                onClick={() => {
                  setOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                New template
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl rounded-[1.5rem] border bg-card/80 backdrop-blur">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Create template</DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground">Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    data-testid="template-form-name"
                    className="h-12 rounded-2xl"
                    placeholder="Monthly Progress (Standard)"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground">Subject</label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    data-testid="template-form-subject"
                    className="h-12 rounded-2xl"
                    placeholder={`Progress Update — ${templatePlaceholders.studentName} — ${templatePlaceholders.month}`}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground">Body</label>
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    data-testid="template-form-body"
                    className="min-h-[240px] rounded-2xl leading-relaxed"
                    placeholder={`Hi!\n\nHere's ${templatePlaceholders.studentName}'s progress for ${templatePlaceholders.month}...\n\n${templatePlaceholders.progressSummary}\n\nNext steps:\n${templatePlaceholders.nextSteps}\n`}
                  />
                </div>

                <div className="rounded-3xl border bg-muted/40 p-4">
                  <div className="text-xs font-semibold text-muted-foreground">Placeholders</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {placeholders.map((ph) => (
                      <button
                        key={ph}
                        type="button"
                        data-testid={`template-placeholder-${ph}`}
                        onClick={() => {
                          navigator.clipboard?.writeText(ph).catch(() => {});
                          toast({ title: "Copied", description: `${ph} copied to clipboard.` });
                        }}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-2xl border bg-card/60 px-3 py-1.5",
                          "text-[11px] font-semibold transition-all duration-200",
                          "hover:-translate-y-0.5 hover:bg-card active:translate-y-0",
                        )}
                      >
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-mono">{ph}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="secondary"
                  data-testid="template-form-cancel"
                  onClick={() => {
                    setOpen(false);
                    resetForm();
                  }}
                  className="rounded-2xl border bg-card/60 hover:bg-card hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={onCreate}
                  disabled={create.isPending || !name.trim() || !subject.trim() || !body.trim()}
                  data-testid="template-form-submit"
                  className={cn(
                    "rounded-2xl bg-gradient-to-r from-primary to-primary/85 shadow-md shadow-primary/20",
                    "hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200",
                  )}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {create.isPending ? "Creating…" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-8">
          {templates.isLoading && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2" data-testid="templates-loading">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-44 rounded-[2rem] border bg-card/60 shadow-sm animate-pulse" />
              ))}
            </div>
          )}

          {templates.error && !templates.isLoading && (
            <div className="rounded-[2rem] border bg-destructive/10 p-6" data-testid="templates-error">
              <div className="flex items-start gap-3">
                <TriangleAlert className="mt-0.5 h-5 w-5 text-destructive" />
                <div>
                  <div className="font-semibold text-destructive">Couldn’t load templates</div>
                  <div className="mt-1 text-sm text-muted-foreground">{(templates.error as Error).message}</div>
                </div>
              </div>
            </div>
          )}

          {!templates.isLoading && !templates.error && (templates.data ?? []).length === 0 && (
            <div className="rounded-[2rem] border bg-card/70 p-7 shadow-sm backdrop-blur" data-testid="templates-empty">
              <div className="font-display text-2xl">No templates yet</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first template. You’ll be able to apply it directly inside the review editor.
              </p>
              <div className="mt-6">
                <Button
                  onClick={() => setOpen(true)}
                  data-testid="templates-empty-create"
                  className="rounded-2xl bg-gradient-to-r from-primary to-primary/85 shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create template
                </Button>
              </div>
            </div>
          )}

          {!templates.isLoading && !templates.error && (templates.data ?? []).length > 0 && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2" data-testid="templates-grid">
              {(templates.data ?? []).map((t) => (
                <TemplatePreviewCard
                  key={t.id}
                  template={t}
                  onUse={() => {
                    toast({
                      title: "Use template",
                      description: "Open any review, choose this template, then click Apply.",
                    });
                  }}
                  onDuplicate={() => {
                    setOpen(true);
                    setName(`${t.name} (Copy)`);
                    setSubject(t.subject);
                    setBody(t.body);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
