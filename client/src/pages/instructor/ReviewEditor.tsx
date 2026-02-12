import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import AppShell from "@/components/AppShell";
import Seo from "@/components/Seo";
import { useReviewDetail, useSaveDraft, useSendReviewEmail } from "@/hooks/use-instructor";
import { useTemplates } from "@/hooks/use-templates";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError, redirectToLogin } from "@/lib/auth-utils";
import { cn } from "@/lib/utils";
import { templatePlaceholders } from "@shared/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  AtSign,
  CheckCircle2,
  ClipboardPaste,
  Clock3,
  Mail,
  Save,
  Send,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { previousMonthStartISO, monthLabel } from "@/components/MonthPicker";

function applyPlaceholders(template: string, vars: Record<string, string>) {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(k, v);
  }
  return out;
}

export default function ReviewEditor() {
  const { toast } = useToast();
  const params = useParams<{ reviewId: string }>();
  const reviewId = Number(params.reviewId);

  const detail = useReviewDetail(reviewId);
  const templates = useTemplates();

  const saveDraft = useSaveDraft();
  const send = useSendReviewEmail();

  const [templateId, setTemplateId] = useState<number | "none">("none");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const [toEmail, setToEmail] = useState("");
  const [ccAccountManager, setCcAccountManager] = useState(true);

  useEffect(() => {
    const err = (detail.error ?? templates.error) as unknown;
    if (err instanceof Error && isUnauthorizedError(err)) {
      redirectToLogin((o) => toast(o));
    }
  }, [detail.error, templates.error, toast]);

  useEffect(() => {
    const data = detail.data;
    if (!data) return;
    setSubject(data.monthlyReview.subject ?? "");
    setBody(data.monthlyReview.body ?? "");

    const suggested = data.student.guardianEmail || data.student.accountManagerEmail || "";
    setToEmail(suggested);
    setCcAccountManager(true);
  }, [detail.data]);

  const monthIso = detail.data?.monthlyReview.month
    ? new Date(detail.data.monthlyReview.month as any).toISOString().slice(0, 10)
    : previousMonthStartISO();

  const status = detail.data?.monthlyReview.status ?? "pending";

  const templateOptions = templates.data ?? [];

  const placeholderVars = useMemo(() => {
    const studentName = detail.data?.student.fullName ?? "Student";
    const month = monthLabel(monthIso);
    // Instructor name unknown in schema; keep generic.
    return {
      [templatePlaceholders.studentName]: studentName,
      [templatePlaceholders.month]: month,
      [templatePlaceholders.instructorName]: "Your Instructor",
      [templatePlaceholders.progressSummary]: "Progress summary goes here…",
      [templatePlaceholders.nextSteps]: "Next steps go here…",
    };
  }, [detail.data, monthIso]);

  const selectedTemplate = useMemo(() => {
    if (templateId === "none") return null;
    return templateOptions.find((t) => t.id === templateId) ?? null;
  }, [templateId, templateOptions]);

  const canEdit = status !== "sent";

  const onApplyTemplate = () => {
    if (!selectedTemplate) return;

    const nextSubject = applyPlaceholders(selectedTemplate.subject, placeholderVars);
    const nextBody = applyPlaceholders(selectedTemplate.body, placeholderVars);

    setSubject(nextSubject);
    setBody(nextBody);

    toast({
      title: "Template applied",
      description: "Subject and body updated with placeholders.",
    });
  };

  const feedbackLink = useMemo(() => {
    const origin = window.location.origin;
    return `${origin}/feedback/${reviewId}`;
  }, [reviewId]);

  const onInsertFeedbackLink = () => {
    const footer =
      `\n\n—\nWe’d love your feedback:\n${feedbackLink}\n`;
    setBody((b) => (b.includes(feedbackLink) ? b : `${b}${footer}`));
    toast({ title: "Link inserted", description: "Feedback link appended to the email body." });
  };

  const onSave = async () => {
    try {
      await saveDraft.mutateAsync({
        reviewId,
        updates: {
          subject: subject.trim() ? subject : undefined,
          body: body.trim() ? body : undefined,
          status: "draft",
        },
      } as any);
      toast({ title: "Draft saved", description: "Your changes are stored for this month." });
    } catch (e) {
      toast({
        title: "Couldn’t save draft",
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  };

  const onSend = async () => {
    try {
      if (!toEmail.trim()) {
        toast({ title: "Missing recipient", description: "Enter a valid To email.", variant: "destructive" });
        return;
      }

      // Ensure latest content saved before send.
      await saveDraft.mutateAsync({
        reviewId,
        updates: {
          subject: subject.trim() ? subject : undefined,
          body: body.trim() ? body : undefined,
          status: "draft",
        },
      } as any);

      await send.mutateAsync({ reviewId, toEmail: toEmail.trim(), ccAccountManager });
      toast({ title: "Sent", description: "Email sent and status updated to sent." });
    } catch (e) {
      toast({
        title: "Couldn’t send",
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <AppShell variant="instructor">
      <Seo title="Review Editor — LEAGUE Reviews" description="Draft and send a monthly review email." />

      <div className="animate-in">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <Link
              href="/instructor/reviews"
              data-testid="review-back"
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl border bg-card/60 px-3 py-2 text-sm font-semibold shadow-sm",
                "hover:bg-card hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200",
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to reviews
            </Link>

            <h1 className="mt-4 truncate font-display text-3xl" data-testid="review-editor-title">
              {detail.data?.student.fullName ?? "Review"}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span data-testid="review-editor-month">{monthLabel(monthIso)}</span>
              <span>•</span>
              <Badge
                data-testid="review-editor-status"
                className={cn(
                  "rounded-2xl border capitalize",
                  status === "sent"
                    ? "bg-primary/10 text-primary border-primary/20"
                    : status === "draft"
                    ? "bg-accent/10 text-accent border-accent/20"
                    : "bg-destructive/10 text-destructive border-destructive/20",
                )}
              >
                {status}
              </Badge>
              {detail.data?.monthlyReview.sentAt && (
                <>
                  <span>•</span>
                  <span data-testid="review-editor-sentAt">
                    Sent {new Date(detail.data.monthlyReview.sentAt as any).toLocaleString()}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              variant="secondary"
              onClick={onInsertFeedbackLink}
              disabled={!canEdit}
              data-testid="review-insert-feedback-link"
              className="rounded-2xl border bg-card/60 hover:bg-card hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              <ClipboardPaste className="mr-2 h-4 w-4" />
              Insert feedback link
            </Button>

            <Button
              onClick={onSave}
              disabled={!canEdit || saveDraft.isPending}
              data-testid="review-save-draft"
              className={cn(
                "rounded-2xl bg-gradient-to-r from-primary to-primary/85 shadow-md shadow-primary/20",
                "hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200",
              )}
            >
              <Save className="mr-2 h-4 w-4" />
              {saveDraft.isPending ? "Saving…" : "Save draft"}
            </Button>

            <Button
              onClick={onSend}
              disabled={!canEdit || send.isPending}
              data-testid="review-send"
              className={cn(
                "rounded-2xl bg-gradient-to-r from-accent to-accent/85 text-accent-foreground shadow-md shadow-accent/20",
                "hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200",
              )}
            >
              <Send className="mr-2 h-4 w-4" />
              {send.isPending ? "Sending…" : "Send email"}
            </Button>
          </div>
        </div>

        {(detail.isLoading || templates.isLoading) && (
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3" data-testid="review-editor-loading">
            <div className="h-64 rounded-[2rem] border bg-card/60 shadow-sm animate-pulse" />
            <div className="h-64 rounded-[2rem] border bg-card/60 shadow-sm animate-pulse lg:col-span-2" />
          </div>
        )}

        {detail.error && !detail.isLoading && (
          <div className="mt-6 rounded-[2rem] border bg-destructive/10 p-6" data-testid="review-editor-error">
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 h-5 w-5 text-destructive" />
              <div>
                <div className="font-semibold text-destructive">Review not available</div>
                <div className="mt-1 text-sm text-muted-foreground">{(detail.error as Error).message}</div>
              </div>
            </div>
          </div>
        )}

        {!detail.isLoading && detail.data && (
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-[2rem] border bg-card/70 p-6 shadow-sm backdrop-blur">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <div className="font-display text-xl">Template</div>
              </div>

              <div className="mt-4">
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Choose</label>
                <select
                  value={templateId === "none" ? "none" : String(templateId)}
                  onChange={(e) => setTemplateId(e.target.value === "none" ? "none" : Number(e.target.value))}
                  disabled={!canEdit}
                  data-testid="review-template-select"
                  className={cn(
                    "w-full rounded-2xl border bg-card/60 px-3 py-3 text-sm font-semibold shadow-sm",
                    "focus:outline-none focus:ring-4 focus:ring-ring/15 focus:border-ring transition-all duration-200",
                  )}
                >
                  <option value="none">No template</option>
                  {templateOptions.map((t) => (
                    <option key={t.id} value={t.id} data-testid={`review-template-option-${t.id}`}>
                      {t.name}
                    </option>
                  ))}
                </select>

                <Button
                  variant="secondary"
                  onClick={onApplyTemplate}
                  disabled={!canEdit || !selectedTemplate}
                  data-testid="review-apply-template"
                  className="mt-3 w-full rounded-2xl border bg-card/60 hover:bg-card hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Apply to editor
                </Button>
              </div>

              <div className="mt-6 rounded-3xl border bg-card/60 p-4">
                <div className="text-xs font-semibold text-muted-foreground">Placeholders</div>
                <div className="mt-2 space-y-1 text-xs">
                  {Object.values(templatePlaceholders).map((ph) => (
                    <div key={ph} className="flex items-center justify-between gap-2" data-testid={`placeholder-${ph}`}>
                      <span className="rounded-xl border bg-muted px-2 py-1 font-mono text-[11px]">{ph}</span>
                      <span className="truncate text-muted-foreground">{placeholderVars[ph] ?? ""}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-3xl border bg-card/60 p-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 font-semibold text-foreground/80">
                  {status === "sent" ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Clock3 className="h-4 w-4 text-accent" />}
                  Status behavior
                </div>
                <div className="mt-2">
                  {status === "sent"
                    ? "This review has been sent. Editing is locked for audit consistency."
                    : "Save draft to mark progress. Sending will mark status as sent."}
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border bg-card/70 p-6 shadow-sm backdrop-blur lg:col-span-2">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground">Subject</label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={!canEdit}
                    data-testid="review-subject"
                    className="h-12 rounded-2xl"
                    placeholder="Monthly Progress Update — {{student_name}}"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground">Body</label>
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    disabled={!canEdit}
                    data-testid="review-body"
                    className="min-h-[300px] rounded-2xl leading-relaxed"
                    placeholder="Write a thoughtful progress note…"
                  />
                  <div className="mt-2 text-xs text-muted-foreground" data-testid="review-body-hint">
                    Tip: Keep it specific—what improved, what’s next, and one encouraging sentence.
                  </div>
                </div>

                <div className="rounded-3xl border bg-card/60 p-5">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <div className="font-display text-xl">Send settings</div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-semibold text-muted-foreground">To</label>
                      <div className="relative">
                        <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={toEmail}
                          onChange={(e) => setToEmail(e.target.value)}
                          disabled={!canEdit}
                          data-testid="review-to-email"
                          className="h-12 rounded-2xl pl-9"
                          placeholder="guardian@example.com"
                        />
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground" data-testid="review-to-hint">
                        Suggested from student record (guardian or account manager).
                      </div>
                    </div>

                    <label className="flex items-center gap-3 rounded-3xl border bg-card/60 px-4 py-4 text-sm shadow-sm md:col-span-2">
                      <Checkbox
                        checked={ccAccountManager}
                        onCheckedChange={(v) => setCcAccountManager(Boolean(v))}
                        disabled={!canEdit}
                        data-testid="review-cc-account-manager"
                      />
                      <span className="font-semibold">CC account manager</span>
                      <span className="ml-auto text-xs text-muted-foreground">Recommended</span>
                    </label>

                    <div className="rounded-3xl border bg-muted/40 p-4 text-xs text-muted-foreground md:col-span-2">
                      Feedback link (include in email):
                      <div className="mt-1 break-all font-mono text-[11px] text-foreground/75" data-testid="review-feedback-link">
                        {feedbackLink}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border bg-card/60 p-5">
                  <div className="text-sm font-semibold">Email health check</div>
                  <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                    <li data-testid="healthcheck-subject">
                      {subject.trim() ? "✅ Subject looks good." : "⚠️ Add a subject—helps the email get opened."}
                    </li>
                    <li data-testid="healthcheck-body">
                      {body.trim().length >= 60 ? "✅ Body has substance." : "⚠️ Add a few more details—parents value specificity."}
                    </li>
                    <li data-testid="healthcheck-feedback">
                      {body.includes(feedbackLink) ? "✅ Feedback link included." : "ℹ️ Consider inserting the feedback link."}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
