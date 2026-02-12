import { db } from "./db";
import {
  adminSettings,
  instructorStudents,
  instructors,
  monthlyReviews,
  reviewTemplates,
  serviceFeedback,
  students,
  type AdminInstructorRow,
  type Instructor,
  type InstructorDashboardSummary,
  type MonthlyReview,
  type ReviewStatus,
  type ReviewTemplate,
  type Student,
  type StudentReviewRow,
} from "@shared/schema";
import { users as authUsers } from "@shared/models/auth";
import { and, asc, count, desc, eq, isNull, sql } from "drizzle-orm";

type MonthString = string; // yyyy-mm-01

export interface SendReviewEmailInput {
  toEmail: string;
  ccAccountManager: boolean;
}

export interface DraftUpdateInput {
  subject?: string;
  body?: string;
  status?: ReviewStatus;
}

export interface ServiceFeedbackInput {
  stars: number;
  message: string | null;
}

export interface IStorage {
  normalizeMonth(input?: string): MonthString;
  seedIfEmpty(): Promise<void>;

  isAdminUser(userId: string): Promise<boolean>;
  ensureInstructorForUser(userId: string): Promise<Instructor>;
  setInstructorActive(instructorId: number, isActive: boolean): Promise<boolean>;
  listInstructorsForAdmin(): Promise<AdminInstructorRow[]>;
  getCompliance(month: MonthString): Promise<
    {
      instructorId: number;
      name: string | null;
      email: string | null;
      month: string;
      totalAssigned: number;
      sent: number;
      pending: number;
    }[]
  >;

  getInstructorDashboardSummary(
    instructorId: number,
    month: MonthString,
  ): Promise<InstructorDashboardSummary>;

  listStudentReviews(
    instructorId: number,
    month: MonthString,
  ): Promise<StudentReviewRow[]>;

  getReviewDetail(
    instructorId: number,
    reviewId: number,
  ): Promise<
    | {
        monthlyReview: MonthlyReview;
        student: Student;
        template?: ReviewTemplate;
      }
    | undefined
  >;

  updateMonthlyReviewDraft(
    instructorId: number,
    reviewId: number,
    updates: DraftUpdateInput,
  ): Promise<MonthlyReview | undefined>;

  sendReviewEmail(
    instructorId: number,
    reviewId: number,
    input: SendReviewEmailInput,
  ): Promise<MonthlyReview | undefined>;

  listTemplates(): Promise<ReviewTemplate[]>;
  createTemplate(input: {
    name: string;
    subject: string;
    body: string;
    createdByUserId?: string | null;
  }): Promise<ReviewTemplate>;

  submitServiceFeedback(
    reviewId: number,
    input: ServiceFeedbackInput,
  ): Promise<boolean>;

  seedAssignmentsForInstructor(
    instructorId: number,
    month: MonthString,
  ): Promise<void>;
}

function firstOfMonth(date: Date): MonthString {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}-01`;
}

function previousMonthFirst(): MonthString {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return firstOfMonth(d);
}

export class DatabaseStorage implements IStorage {
  normalizeMonth(input?: string): MonthString {
    if (!input) return previousMonthFirst();
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
    if (!match) return previousMonthFirst();
    return `${match[1]}-${match[2]}-01`;
  }

  async seedIfEmpty(): Promise<void> {
    const existingTemplates = await db.select({ c: count() }).from(reviewTemplates);
    if ((existingTemplates[0]?.c ?? 0) === 0) {
      await db.insert(reviewTemplates).values([
        {
          name: "Monthly progress update",
          subject: "Monthly progress update for {{student_name}}",
          body:
            "Hello,\\n\\nHere is {{student_name}}'s progress update for {{month}}.\\n\\nProgress summary:\\n{{progress_summary}}\\n\\nNext steps:\\n{{next_steps}}\\n\\nThank you,\\n{{instructor_name}}\\n\\nFeedback: {{feedback_link}}",
        },
        {
          name: "Short update",
          subject: "{{student_name}} - {{month}} progress",
          body:
            "Hello,\\n\\nQuick update for {{student_name}} ({{month}}):\\n\\n{{progress_summary}}\\n\\nNext steps:\\n{{next_steps}}\\n\\nThank you,\\n{{instructor_name}}\\n\\nFeedback: {{feedback_link}}",
        },
      ]);
    }

    const existingStudents = await db.select({ c: count() }).from(students);
    if ((existingStudents[0]?.c ?? 0) === 0) {
      await db.insert(students).values([
        {
          externalId: "pike13-student-1001",
          fullName: "Alex Johnson",
          guardianEmail: "guardian.alex@example.com",
          accountManagerEmail: "account.manager@example.com",
        },
        {
          externalId: "pike13-student-1002",
          fullName: "Maya Patel",
          guardianEmail: "guardian.maya@example.com",
          accountManagerEmail: "account.manager@example.com",
        },
        {
          externalId: "pike13-student-1003",
          fullName: "Jordan Lee",
          guardianEmail: "guardian.jordan@example.com",
          accountManagerEmail: "account.manager@example.com",
        },
      ]);
    }
  }

  async isAdminUser(userId: string): Promise<boolean> {
    const [row] = await db
      .select()
      .from(adminSettings)
      .where(eq(adminSettings.adminUserId, userId));
    return !!row;
  }

  async ensureInstructorForUser(userId: string): Promise<Instructor> {
    const [existing] = await db
      .select()
      .from(instructors)
      .where(eq(instructors.userId, userId));
    if (existing) return existing;

    const [created] = await db
      .insert(instructors)
      .values({ userId, isActive: false })
      .returning();
    return created;
  }

  async setInstructorActive(instructorId: number, isActive: boolean): Promise<boolean> {
    const [updated] = await db
      .update(instructors)
      .set({ isActive })
      .where(eq(instructors.id, instructorId))
      .returning();
    return !!updated;
  }

  async listInstructorsForAdmin(): Promise<AdminInstructorRow[]> {
    const rows = await db
      .select({
        instructorId: instructors.id,
        userId: instructors.userId,
        isActive: instructors.isActive,
        email: authUsers.email,
        firstName: authUsers.firstName,
        lastName: authUsers.lastName,
      })
      .from(instructors)
      .leftJoin(authUsers, eq(authUsers.id, instructors.userId))
      .orderBy(desc(instructors.createdAt));

    return rows.map((r) => ({
      instructorId: r.instructorId,
      userId: r.userId,
      isActive: r.isActive,
      email: r.email ?? null,
      name:
        (r.firstName || r.lastName)
          ? `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim()
          : null,
    }));
  }

  async getCompliance(month: MonthString) {
    const rows = await db
      .select({
        instructorId: instructors.id,
        userId: instructors.userId,
        isActive: instructors.isActive,
        email: authUsers.email,
        firstName: authUsers.firstName,
        lastName: authUsers.lastName,
      })
      .from(instructors)
      .leftJoin(authUsers, eq(authUsers.id, instructors.userId))
      .orderBy(asc(instructors.id));

    const results = [];
    for (const r of rows) {
      const summary = await this.getInstructorDashboardSummary(r.instructorId, month);
      results.push({
        instructorId: r.instructorId,
        name:
          (r.firstName || r.lastName)
            ? `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim()
            : null,
        email: r.email ?? null,
        month: summary.month,
        totalAssigned: summary.totalAssigned,
        sent: summary.sent,
        pending: summary.pending,
      });
    }
    return results;
  }

  async getInstructorDashboardSummary(
    instructorId: number,
    month: MonthString,
  ): Promise<InstructorDashboardSummary> {
    const [assignedRow] = await db
      .select({ c: count() })
      .from(instructorStudents)
      .where(and(eq(instructorStudents.instructorId, instructorId), eq(instructorStudents.month, month)));

    const [sentRow] = await db
      .select({ c: count() })
      .from(monthlyReviews)
      .where(
        and(
          eq(monthlyReviews.instructorId, instructorId),
          eq(monthlyReviews.month, month),
          eq(monthlyReviews.status, "sent"),
        ),
      );

    const [draftRow] = await db
      .select({ c: count() })
      .from(monthlyReviews)
      .where(
        and(
          eq(monthlyReviews.instructorId, instructorId),
          eq(monthlyReviews.month, month),
          eq(monthlyReviews.status, "draft"),
        ),
      );

    const totalAssigned = Number(assignedRow?.c ?? 0);
    const sent = Number(sentRow?.c ?? 0);
    const draft = Number(draftRow?.c ?? 0);
    const pending = Math.max(totalAssigned - sent - draft, 0);

    return {
      month,
      totalAssigned,
      sent,
      draft,
      pending,
    };
  }

  async ensureMonthlyReview(
    instructorId: number,
    studentId: number,
    month: MonthString,
  ): Promise<MonthlyReview> {
    const [existing] = await db
      .select()
      .from(monthlyReviews)
      .where(
        and(
          eq(monthlyReviews.instructorId, instructorId),
          eq(monthlyReviews.studentId, studentId),
          eq(monthlyReviews.month, month),
        ),
      );
    if (existing) return existing;

    const [created] = await db
      .insert(monthlyReviews)
      .values({
        instructorId,
        studentId,
        month,
        status: "pending",
      })
      .returning();
    return created;
  }

  async listStudentReviews(
    instructorId: number,
    month: MonthString,
  ): Promise<StudentReviewRow[]> {
    const assigned = await db
      .select({
        studentId: students.id,
        studentName: students.fullName,
      })
      .from(instructorStudents)
      .innerJoin(students, eq(students.id, instructorStudents.studentId))
      .where(and(eq(instructorStudents.instructorId, instructorId), eq(instructorStudents.month, month)))
      .orderBy(asc(students.fullName));

    const rows: StudentReviewRow[] = [];
    for (const a of assigned) {
      const review = await this.ensureMonthlyReview(instructorId, a.studentId, month);
      rows.push({
        monthlyReviewId: review.id,
        studentId: a.studentId,
        studentName: a.studentName,
        month,
        status: review.status,
        subject: review.subject ?? null,
        sentAt: review.sentAt ? review.sentAt.toISOString() : null,
      });
    }
    return rows;
  }

  async getReviewDetail(
    instructorId: number,
    reviewId: number,
  ): Promise<
    | {
        monthlyReview: MonthlyReview;
        student: Student;
        template?: ReviewTemplate;
      }
    | undefined
  > {
    const [review] = await db
      .select()
      .from(monthlyReviews)
      .where(and(eq(monthlyReviews.id, reviewId), eq(monthlyReviews.instructorId, instructorId)));
    if (!review) return undefined;

    const [student] = await db.select().from(students).where(eq(students.id, review.studentId));
    if (!student) return undefined;

    return { monthlyReview: review, student };
  }

  async updateMonthlyReviewDraft(
    instructorId: number,
    reviewId: number,
    updates: DraftUpdateInput,
  ): Promise<MonthlyReview | undefined> {
    const [updated] = await db
      .update(monthlyReviews)
      .set({
        ...updates,
        status: updates.status ?? "draft",
        updatedAt: new Date(),
      })
      .where(and(eq(monthlyReviews.id, reviewId), eq(monthlyReviews.instructorId, instructorId)))
      .returning();
    return updated ?? undefined;
  }

  async sendReviewEmail(
    instructorId: number,
    reviewId: number,
    input: SendReviewEmailInput,
  ): Promise<MonthlyReview | undefined> {
    const [review] = await db
      .select()
      .from(monthlyReviews)
      .where(and(eq(monthlyReviews.id, reviewId), eq(monthlyReviews.instructorId, instructorId)));
    if (!review) return undefined;

    const [student] = await db.select().from(students).where(eq(students.id, review.studentId));
    if (!student) return undefined;

    const feedbackLink = `${process.env.REPLIT_DEPLOYMENT_URL ?? ""}/feedback/${reviewId}`;
    const subject = (review.subject ?? `Monthly progress update for ${student.fullName}`).trim();
    const body = (review.body ?? "").trim();

    const renderedBody = body.includes("{{feedback_link}}")
      ? body.replaceAll("{{feedback_link}}", feedbackLink)
      : `${body}\\n\\nFeedback: ${feedbackLink}`;

    await this.updateMonthlyReviewDraft(instructorId, reviewId, {
      subject,
      body: renderedBody,
      status: "sent",
    });

    const [sent] = await db
      .update(monthlyReviews)
      .set({
        status: "sent",
        subject,
        body: renderedBody,
        sentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(monthlyReviews.id, reviewId), eq(monthlyReviews.instructorId, instructorId)))
      .returning();

    return sent ?? undefined;
  }

  async listTemplates(): Promise<ReviewTemplate[]> {
    return await db.select().from(reviewTemplates).orderBy(asc(reviewTemplates.name));
  }

  async createTemplate(input: {
    name: string;
    subject: string;
    body: string;
    createdByUserId?: string | null;
  }): Promise<ReviewTemplate> {
    const [created] = await db
      .insert(reviewTemplates)
      .values({
        name: input.name,
        subject: input.subject,
        body: input.body,
        createdByUserId: input.createdByUserId ?? null,
      })
      .returning();
    return created;
  }

  async submitServiceFeedback(
    reviewId: number,
    input: ServiceFeedbackInput,
  ): Promise<boolean> {
    const [review] = await db.select().from(monthlyReviews).where(eq(monthlyReviews.id, reviewId));
    if (!review) return false;

    const existing = await db
      .select()
      .from(serviceFeedback)
      .where(eq(serviceFeedback.monthlyReviewId, reviewId));
    if (existing.length > 0) return true;

    await db.insert(serviceFeedback).values({
      monthlyReviewId: reviewId,
      stars: input.stars,
      message: input.message,
    });
    return true;
  }

  async seedAssignmentsForInstructor(
    instructorId: number,
    month: MonthString,
  ): Promise<void> {
    const [s1, s2, s3] = await db
      .select()
      .from(students)
      .orderBy(asc(students.id))
      .limit(3);
    const selected = [s1, s2, s3].filter(Boolean) as Student[];
    if (selected.length === 0) return;

    for (const s of selected) {
      await db
        .insert(instructorStudents)
        .values({
          instructorId,
          studentId: s.id,
          month,
        })
        .onConflictDoNothing();
      await this.ensureMonthlyReview(instructorId, s.id, month);
    }
  }
}

export const storage = new DatabaseStorage();
