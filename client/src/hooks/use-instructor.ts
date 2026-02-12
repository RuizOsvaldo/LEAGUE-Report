import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import type { InstructorDashboardSummary, MonthlyReview, ReviewDetailResponse, StudentReviewRow } from "@shared/schema";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useInstructorStatus() {
  return useQuery({
    queryKey: [api.instructor.status.path],
    queryFn: async () => {
      const res = await fetch(api.instructor.status.path, { credentials: "include" });
      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }
      return parseWithLogging(api.instructor.status.responses[200], await res.json(), "instructor.status.200");
    },
  });
}

export function useInstructorDashboard(month?: string) {
  return useQuery({
    queryKey: [api.instructor.dashboard.path, month ?? ""],
    queryFn: async () => {
      const url = month ? `${api.instructor.dashboard.path}?month=${encodeURIComponent(month)}` : api.instructor.dashboard.path;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }
      return parseWithLogging(api.instructor.dashboard.responses[200], await res.json(), "instructor.dashboard.200");
    },
  });
}

export function useAssignedReviews(month?: string) {
  return useQuery({
    queryKey: [api.instructor.listAssignedStudents.path, month ?? ""],
    queryFn: async () => {
      const url = month
        ? `${api.instructor.listAssignedStudents.path}?month=${encodeURIComponent(month)}`
        : api.instructor.listAssignedStudents.path;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }
      return parseWithLogging(api.instructor.listAssignedStudents.responses[200], await res.json(), "instructor.listAssignedStudents.200");
    },
  });
}

export function useReviewDetail(reviewId: number) {
  return useQuery({
    queryKey: [api.instructor.getReview.path, reviewId],
    queryFn: async () => {
      const url = buildUrl(api.instructor.getReview.path, { reviewId });
      const res = await fetch(url, { credentials: "include" });

      if (res.status === 404) return null;

      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }
      return parseWithLogging(api.instructor.getReview.responses[200], await res.json(), "instructor.getReview.200");
    },
  });
}

export function useSaveDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { reviewId: number; updates: z.infer<typeof api.instructor.saveDraft.input> }) => {
      const url = buildUrl(api.instructor.saveDraft.path, { reviewId: input.reviewId });
      const validated = api.instructor.saveDraft.input.parse(input.updates);

      const res = await fetch(url, {
        method: api.instructor.saveDraft.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const err = parseWithLogging(api.instructor.saveDraft.responses[400], await res.json(), "instructor.saveDraft.400");
          throw new Error(err.message);
        }
        if (res.status === 404) {
          const err = parseWithLogging(api.instructor.saveDraft.responses[404], await res.json(), "instructor.saveDraft.404");
          throw new Error(err.message);
        }
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }

      return parseWithLogging(api.instructor.saveDraft.responses[200], await res.json(), "instructor.saveDraft.200");
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [api.instructor.listAssignedStudents.path] });
      qc.invalidateQueries({ queryKey: [api.instructor.getReview.path, vars.reviewId] });
      qc.invalidateQueries({ queryKey: [api.instructor.dashboard.path] });
    },
  });
}

export function useSendReviewEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { reviewId: number; toEmail: string; ccAccountManager: boolean }) => {
      const url = buildUrl(api.instructor.sendReviewEmail.path, { reviewId: input.reviewId });
      const validated = api.instructor.sendReviewEmail.input.parse({
        toEmail: input.toEmail,
        ccAccountManager: input.ccAccountManager,
      });

      const res = await fetch(url, {
        method: api.instructor.sendReviewEmail.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const err = parseWithLogging(api.instructor.sendReviewEmail.responses[400], await res.json(), "instructor.sendReviewEmail.400");
          throw new Error(err.message);
        }
        if (res.status === 403) {
          const err = parseWithLogging(api.instructor.sendReviewEmail.responses[403], await res.json(), "instructor.sendReviewEmail.403");
          throw new Error(err.message);
        }
        if (res.status === 404) {
          const err = parseWithLogging(api.instructor.sendReviewEmail.responses[404], await res.json(), "instructor.sendReviewEmail.404");
          throw new Error(err.message);
        }
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }

      return parseWithLogging(api.instructor.sendReviewEmail.responses[200], await res.json(), "instructor.sendReviewEmail.200");
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [api.instructor.listAssignedStudents.path] });
      qc.invalidateQueries({ queryKey: [api.instructor.getReview.path, vars.reviewId] });
      qc.invalidateQueries({ queryKey: [api.instructor.dashboard.path] });
      qc.invalidateQueries({ queryKey: [api.admin.monthlyCompliance.path] });
    },
  });
}

export type InstructorDashboardSummaryResponse = InstructorDashboardSummary;
export type AssignedReviewsResponse = StudentReviewRow[];
export type ReviewDetail = ReviewDetailResponse;
export type MonthlyReviewResponse = MonthlyReview;
