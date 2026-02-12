import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { AdminInstructorRow } from "@shared/schema";
import { z } from "zod";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useAdminInstructors() {
  return useQuery({
    queryKey: [api.admin.listInstructors.path],
    queryFn: async () => {
      const res = await fetch(api.admin.listInstructors.path, { credentials: "include" });
      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }
      return parseWithLogging(api.admin.listInstructors.responses[200], await res.json(), "admin.listInstructors.200");
    },
  });
}

export function useSetInstructorActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { instructorId: number; isActive: boolean }) => {
      const url = buildUrl(api.admin.setInstructorActive.path, { instructorId: input.instructorId });
      const validated = api.admin.setInstructorActive.input.parse({ isActive: input.isActive });

      const res = await fetch(url, {
        method: api.admin.setInstructorActive.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const err = parseWithLogging(api.admin.setInstructorActive.responses[400], await res.json(), "admin.setInstructorActive.400");
          throw new Error(err.message);
        }
        if (res.status === 404) {
          const err = parseWithLogging(api.admin.setInstructorActive.responses[404], await res.json(), "admin.setInstructorActive.404");
          throw new Error(err.message);
        }
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }

      return parseWithLogging(api.admin.setInstructorActive.responses[200], await res.json(), "admin.setInstructorActive.200");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [api.admin.listInstructors.path] });
      qc.invalidateQueries({ queryKey: [api.admin.monthlyCompliance.path] });
    },
  });
}

export function useAdminCompliance(month?: string) {
  return useQuery({
    queryKey: [api.admin.monthlyCompliance.path, month ?? ""],
    queryFn: async () => {
      const url = month ? `${api.admin.monthlyCompliance.path}?month=${encodeURIComponent(month)}` : api.admin.monthlyCompliance.path;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }
      return parseWithLogging(api.admin.monthlyCompliance.responses[200], await res.json(), "admin.monthlyCompliance.200");
    },
  });
}

export type AdminInstructorsResponse = AdminInstructorRow[];
