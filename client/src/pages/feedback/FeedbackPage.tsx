import { useMemo, useState } from "react";
import { useParams } from "wouter";
import Seo from "@/components/Seo";
import Stars from "@/components/Stars";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useSubmitFeedback } from "@/hooks/use-feedback";
import { CheckCircle2, MessageSquareHeart, Sparkles, TriangleAlert } from "lucide-react";

export default function FeedbackPage() {
  const params = useParams<{ reviewId: string }>();
  const reviewId = Number(params.reviewId);

  const submit = useSubmitFeedback();
  const [stars, setStars] = useState(5);
  const [message, setMessage] = useState("");

  const canSubmit = useMemo(() => Number.isFinite(reviewId) && reviewId > 0 && stars >= 1 && stars <= 5, [reviewId, stars]);

  const onSubmit = async () => {
    try {
      await submit.mutateAsync({ reviewId, stars, message: message.trim() || undefined });
    } catch {
      // handled by UI
    }
  };

  return (
    <div className="min-h-screen bg-mesh grain">
      <Seo
        title="Service Feedback — LEAGUE Report"
        description="Rate our service and leave a message for the team."
      />

      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className={cn("glass rounded-[2rem] p-7 shadow-soft", "animate-in")}>
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border bg-card/60 shadow-sm">
              <MessageSquareHeart className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-3xl" data-testid="feedback-title">
                How did we do?
              </h1>
              <p className="mt-2 text-sm text-muted-foreground" data-testid="feedback-subtitle">
                Your feedback helps us improve our teaching experience. This takes less than a minute.
              </p>
              <div className="mt-2 text-xs text-muted-foreground">
                Review ID: <span className="font-mono" data-testid="feedback-review-id">{reviewId}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-[1.5rem] border bg-card/60 p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-semibold text-muted-foreground">Rating</div>
                <div className="mt-1 font-display text-2xl" data-testid="feedback-rating-label">
                  {stars} / 5
                </div>
              </div>
              <Stars value={stars} onChange={setStars} size="lg" testId="feedback-stars" />
            </div>

            <div className="mt-6">
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Message (optional)</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                data-testid="feedback-message"
                className="min-h-[160px] rounded-2xl"
                placeholder="Tell us what you loved—or what we can do better."
              />
              <div className="mt-2 text-xs text-muted-foreground" data-testid="feedback-message-hint">
                Max 2000 characters. Be as specific as you’d like.
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                onClick={onSubmit}
                disabled={!canSubmit || submit.isPending}
                data-testid="feedback-submit"
                className={cn(
                  "rounded-2xl bg-gradient-to-r from-primary to-primary/85 shadow-md shadow-primary/20",
                  "hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200",
                )}
              >
                {submit.isPending ? "Submitting…" : "Submit feedback"}
                <Sparkles className="ml-2 h-4 w-4" />
              </Button>

              <div className="text-xs text-muted-foreground" data-testid="feedback-privacy">
                Feedback is shared with our team to improve service quality.
              </div>
            </div>

            {submit.isSuccess && (
              <div className="mt-6 rounded-3xl border bg-primary/10 p-5" data-testid="feedback-success">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <div className="font-semibold text-primary">Thank you!</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Your feedback has been submitted. You may close this page.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {submit.error && (
              <div className="mt-6 rounded-3xl border bg-destructive/10 p-5" data-testid="feedback-error">
                <div className="flex items-start gap-3">
                  <TriangleAlert className="mt-0.5 h-5 w-5 text-destructive" />
                  <div>
                    <div className="font-semibold text-destructive">Submission failed</div>
                    <div className="mt-1 text-sm text-muted-foreground">{(submit.error as Error).message}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} LEAGUE of Amazing Programmers
          </div>
        </div>
      </div>
    </div>
  );
}
