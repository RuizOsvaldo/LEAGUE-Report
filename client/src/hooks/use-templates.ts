import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export function useTemplates() {
  return useQuery({
    queryKey: [api.instructor.listTemplates.path],
    queryFn: async () => {
      const res = await fetch(api.instructor.listTemplates.path, { credentials: "include" });
      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }
      return parseWithLogging(api.instructor.listTemplates.responses[200], await res.json(), "templates.list.200");
    },
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: z.infer<typeof api.instructor.createTemplate.input>) => {
      const validated = api.instructor.createTemplate.input.parse(input);
      const res = await fetch(api.instructor.createTemplate.path, {
        method: api.instructor.createTemplate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const err = parseWithLogging(api.instructor.createTemplate.responses[400], await res.json(), "templates.create.400");
          throw new Error(err.message);
        }
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }

      return parseWithLogging(api.instructor.createTemplate.responses[201], await res.json(), "templates.create.201");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [api.instructor.listTemplates.path] }),
  });
}
