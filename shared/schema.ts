import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

export const roleEnum = pgEnum("role", ["admin", "instructor"]);
export const reviewStatusEnum = pgEnum("review_status", [
  "pending",
  "draft",
  "sent",
]);

export const instructors = pgTable(
  "instructors",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id")
      .notNull()
      .unique(),
    isActive: boolean("is_active").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("instructors_user_id_idx").on(table.userId)],
);

export const pike13Tokens = pgTable(
  "pike13_tokens",
  {
    id: serial("id").primaryKey(),
    instructorId: integer("instructor_id")
      .notNull(),
    accessToken: text("access_token").notNull(),
    tokenType: varchar("token_type"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("pike13_tokens_instructor_id_idx").on(table.instructorId)],
);

export const students = pgTable(
  "students",
  {
    id: serial("id").primaryKey(),
    externalId: varchar("external_id").notNull().unique(),
    fullName: text("full_name").notNull(),
    guardianEmail: text("guardian_email"),
    accountManagerEmail: text("account_manager_email"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("students_external_id_idx").on(table.externalId)],
);

export const instructorStudents = pgTable(
  "instructor_students",
  {
    id: serial("id").primaryKey(),
    instructorId: integer("instructor_id").notNull(),
    studentId: integer("student_id").notNull(),
    month: date("month").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("instructor_students_unique_idx").on(
      table.instructorId,
      table.studentId,
      table.month,
    ),
  ],
);

export const reviewTemplates = pgTable(
  "review_templates",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    createdByUserId: varchar("created_by_user_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
);

export const monthlyReviews = pgTable(
  "monthly_reviews",
  {
    id: serial("id").primaryKey(),
    instructorId: integer("instructor_id").notNull(),
    studentId: integer("student_id").notNull(),
    month: date("month").notNull(),
    status: reviewStatusEnum("status").notNull().default("pending"),
    subject: text("subject"),
    body: text("body"),
    sentAt: timestamp("sent_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("monthly_reviews_unique_idx").on(
      table.instructorId,
      table.studentId,
      table.month,
    ),
  ],
);

export const serviceFeedback = pgTable(
  "service_feedback",
  {
    id: serial("id").primaryKey(),
    monthlyReviewId: integer("monthly_review_id").notNull(),
    stars: integer("stars").notNull(),
    message: text("message"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("service_feedback_review_id_idx").on(table.monthlyReviewId)],
);

export const instructorConfig = pgTable("instructor_config", {
  id: serial("id").primaryKey(),
  instructorId: integer("instructor_id").notNull().unique(),
  fromEmail: text("from_email"),
  replyToEmail: text("reply_to_email"),
  accountManagerDefaultEmail: text("account_manager_default_email"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  adminUserId: varchar("admin_user_id").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertInstructorSchema = createInsertSchema(instructors).omit({
  id: true,
  createdAt: true,
});
export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
});
export const insertReviewTemplateSchema = createInsertSchema(reviewTemplates).omit({
  id: true,
  createdAt: true,
});
export const insertMonthlyReviewSchema = createInsertSchema(monthlyReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  sentAt: true,
});
export const insertServiceFeedbackSchema = createInsertSchema(serviceFeedback).omit({
  id: true,
  createdAt: true,
});

export type Instructor = typeof instructors.$inferSelect;
export type InsertInstructor = z.infer<typeof insertInstructorSchema>;

export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;

export type ReviewTemplate = typeof reviewTemplates.$inferSelect;
export type InsertReviewTemplate = z.infer<typeof insertReviewTemplateSchema>;

export type MonthlyReview = typeof monthlyReviews.$inferSelect;
export type InsertMonthlyReview = z.infer<typeof insertMonthlyReviewSchema>;

export type ServiceFeedback = typeof serviceFeedback.$inferSelect;
export type InsertServiceFeedback = z.infer<typeof insertServiceFeedbackSchema>;

export type CreateMonthlyReviewRequest = InsertMonthlyReview;
export type UpdateMonthlyReviewRequest = Partial<InsertMonthlyReview>;

export type SubmitServiceFeedbackRequest = z.infer<
  typeof insertServiceFeedbackSchema
>;

export type ReviewStatus = (typeof monthlyReviews.status.enumValues)[number];

export type InstructorDashboardSummary = {
  month: string;
  totalAssigned: number;
  sent: number;
  pending: number;
  draft: number;
};

export type AdminInstructorRow = {
  instructorId: number;
  userId: string;
  name: string | null;
  email: string | null;
  isActive: boolean;
};

export type StudentReviewRow = {
  monthlyReviewId: number;
  studentId: number;
  studentName: string;
  month: string;
  status: ReviewStatus;
  subject: string | null;
  sentAt: string | null;
};

export type ReviewDetailResponse = {
  monthlyReview: MonthlyReview;
  student: Student;
  template?: ReviewTemplate;
};

export const monthParamSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const starsSchema = z
  .number()
  .int()
  .min(1)
  .max(5);
