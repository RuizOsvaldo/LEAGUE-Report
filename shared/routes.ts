import { z } from "zod";
import {
  insertMonthlyReviewSchema,
  insertReviewTemplateSchema,
  insertServiceFeedbackSchema,
  insertStudentSchema,
  type AdminInstructorRow,
  type InstructorDashboardSummary,
  type MonthlyReview,
  type ReviewDetailResponse,
  type ReviewTemplate,
  type StudentReviewRow,
} from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  forbidden: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

const monthQuerySchema = z
  .object({
    month: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  })
  .optional();

export const api = {
  auth: {
    me: {
      method: "GET" as const,
      path: "/api/auth/user" as const,
      responses: {
        200: z.any(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  admin: {
    listInstructors: {
      method: "GET" as const,
      path: "/api/admin/instructors" as const,
      responses: {
        200: z.array(z.custom<AdminInstructorRow>()),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      },
    },
    setInstructorActive: {
      method: "POST" as const,
      path: "/api/admin/instructors/:instructorId/active" as const,
      input: z.object({ isActive: z.boolean() }),
      responses: {
        200: z.object({ ok: z.literal(true) }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
    monthlyCompliance: {
      method: "GET" as const,
      path: "/api/admin/compliance" as const,
      input: monthQuerySchema,
      responses: {
        200: z.array(
          z.object({
            instructorId: z.number(),
            name: z.string().nullable(),
            email: z.string().nullable(),
            month: z.string(),
            totalAssigned: z.number(),
            sent: z.number(),
            pending: z.number(),
          }),
        ),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      },
    },
  },
  instructor: {
    status: {
      method: "GET" as const,
      path: "/api/instructor/status" as const,
      responses: {
        200: z.object({
          instructorId: z.number(),
          isActive: z.boolean(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
    dashboard: {
      method: "GET" as const,
      path: "/api/instructor/dashboard" as const,
      input: monthQuerySchema,
      responses: {
        200: z.custom<InstructorDashboardSummary>(),
        401: errorSchemas.unauthorized,
      },
    },
    listAssignedStudents: {
      method: "GET" as const,
      path: "/api/instructor/reviews" as const,
      input: monthQuerySchema,
      responses: {
        200: z.array(z.custom<StudentReviewRow>()),
        401: errorSchemas.unauthorized,
      },
    },
    getReview: {
      method: "GET" as const,
      path: "/api/instructor/reviews/:reviewId" as const,
      responses: {
        200: z.custom<ReviewDetailResponse>(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    saveDraft: {
      method: "PUT" as const,
      path: "/api/instructor/reviews/:reviewId" as const,
      input: insertMonthlyReviewSchema
        .partial()
        .extend({
          subject: z.string().min(1).optional(),
          body: z.string().min(1).optional(),
        }),
      responses: {
        200: z.custom<MonthlyReview>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    sendReviewEmail: {
      method: "POST" as const,
      path: "/api/instructor/reviews/:reviewId/send" as const,
      input: z.object({
        toEmail: z.string().email(),
        ccAccountManager: z.boolean().default(true),
      }),
      responses: {
        200: z.custom<MonthlyReview>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
    listTemplates: {
      method: "GET" as const,
      path: "/api/templates" as const,
      responses: {
        200: z.array(z.custom<ReviewTemplate>()),
        401: errorSchemas.unauthorized,
      },
    },
    createTemplate: {
      method: "POST" as const,
      path: "/api/templates" as const,
      input: insertReviewTemplateSchema.extend({
        name: z.string().min(1),
        subject: z.string().min(1),
        body: z.string().min(1),
      }),
      responses: {
        201: z.custom<ReviewTemplate>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
  public: {
    submitServiceFeedback: {
      method: "POST" as const,
      path: "/api/public/feedback/:reviewId" as const,
      input: insertServiceFeedbackSchema.extend({
        stars: z.number().int().min(1).max(5),
        message: z.string().max(2000).optional(),
      }),
      responses: {
        201: z.object({ ok: z.literal(true) }),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
  },
  pike13: {
    stubSyncMyStudents: {
      method: "POST" as const,
      path: "/api/pike13/sync" as const,
      responses: {
        200: z.object({ ok: z.literal(true), message: z.string() }),
        401: errorSchemas.unauthorized,
      },
    },
  },
};

export function buildUrl(
  path: string,
  params?: Record<string, string | number>,
): string {
  let url = path;
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url = url.replace(`:${key}`, String(value));
    }
  }
  return url;
}

export type ValidationError = z.infer<typeof errorSchemas.validation>;
export type NotFoundError = z.infer<typeof errorSchemas.notFound>;
export type UnauthorizedError = z.infer<typeof errorSchemas.unauthorized>;
export type ForbiddenError = z.infer<typeof errorSchemas.forbidden>;
export type InternalError = z.infer<typeof errorSchemas.internal>;

export const studentUpsertInput = insertStudentSchema.extend({
  externalId: z.string().min(1),
  fullName: z.string().min(1),
  guardianEmail: z.string().email().optional().or(z.literal("")),
  accountManagerEmail: z.string().email().optional().or(z.literal("")),
});

export const templatePlaceholders = {
  studentName: "{{student_name}}",
  month: "{{month}}",
  instructorName: "{{instructor_name}}",
  progressSummary: "{{progress_summary}}",
  nextSteps: "{{next_steps}}",
} as const;
