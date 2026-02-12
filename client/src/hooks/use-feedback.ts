import { useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useSubmitFeedback() {
  return useMutation({
    mutationFn: async (input: { reviewId: number; stars: number; message?: string }) => {
      const url = buildUrl(api.public.submitServiceFeedback.path, { reviewId: input.reviewId });
      const validated = api.public.submitServiceFeedback.input.parse({
        monthlyReviewId: input.reviewId,
        stars: input.stars,
        message: input.message,
      });

      const res = await fetch(url, {
        method: api.public.submitServiceFeedback.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const err = parseWithLogging(api.public.submitServiceFeedback.responses[400], await res.json(), "public.feedback.400");
          throw new Error(err.message);
        }
        if (res.status === 404) {
          const err = parseWithLogging(api.public.submitServiceFeedback.responses[404], await res.json(), "public.feedback.404");
          throw new Error(err.message);
        }
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }

      return parseWithLogging(api.public.submitServiceFeedback.responses[201], await res.json(), "public.feedback.201");
    },
  });
}
