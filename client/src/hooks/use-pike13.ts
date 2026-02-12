import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function usePike13Sync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.pike13.stubSyncMyStudents.path, {
        method: api.pike13.stubSyncMyStudents.method,
        credentials: "include",
      });

      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }
      return parseWithLogging(api.pike13.stubSyncMyStudents.responses[200], await res.json(), "pike13.sync.200");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [api.instructor.dashboard.path] });
      qc.invalidateQueries({ queryKey: [api.instructor.listAssignedStudents.path] });
      qc.invalidateQueries({ queryKey: [api.admin.monthlyCompliance.path] });
    },
  });
}
