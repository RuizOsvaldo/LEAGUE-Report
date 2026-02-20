import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  await storage.seedIfEmpty();

  app.get(api.instructor.status.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub as string | undefined;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const instructor = await storage.ensureInstructorForUser(userId);
    res.json({ instructorId: instructor.id, isActive: instructor.isActive });
  });

  app.get(api.instructor.dashboard.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub as string | undefined;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const instructor = await storage.ensureInstructorForUser(userId);

    const month = storage.normalizeMonth((req.query?.month as string | undefined) ?? undefined);
    const summary = await storage.getInstructorDashboardSummary(instructor.id, month);
    res.json(summary);
  });

  app.get(api.instructor.listAssignedStudents.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub as string | undefined;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const instructor = await storage.ensureInstructorForUser(userId);

    const month = storage.normalizeMonth((req.query?.month as string | undefined) ?? undefined);
    const rows = await storage.listStudentReviews(instructor.id, month);
    res.json(rows);
  });

  app.get(api.instructor.getReview.path, isAuthenticated, async (req: any, res) => {
    const reviewId = Number(req.params.reviewId);
    if (!Number.isFinite(reviewId)) return res.status(404).json({ message: "Not found" });

    const userId = req.user?.claims?.sub as string | undefined;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const instructor = await storage.ensureInstructorForUser(userId);

    const detail = await storage.getReviewDetail(instructor.id, reviewId);
    if (!detail) return res.status(404).json({ message: "Not found" });
    res.json(detail);
  });

  app.put(api.instructor.saveDraft.path, isAuthenticated, async (req: any, res) => {
    try {
      const reviewId = Number(req.params.reviewId);
      const input = api.instructor.saveDraft.input.parse(req.body);

      const userId = req.user?.claims?.sub as string | undefined;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const instructor = await storage.ensureInstructorForUser(userId);

      const updated = await storage.updateMonthlyReviewDraft(instructor.id, reviewId, input);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0]?.message ?? "Invalid input",
          field: err.errors[0]?.path?.join("."),
        });
      }
      throw err;
    }
  });

  app.post(api.instructor.sendReviewEmail.path, isAuthenticated, async (req: any, res) => {
    try {
      const reviewId = Number(req.params.reviewId);
      const input = api.instructor.sendReviewEmail.input.parse(req.body);

      const userId = req.user?.claims?.sub as string | undefined;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const instructor = await storage.ensureInstructorForUser(userId);

      if (!instructor.isActive) {
        return res.status(403).json({ message: "Instructor not active" });
      }

      const sent = await storage.sendReviewEmail(instructor.id, reviewId, input);
      if (!sent) return res.status(404).json({ message: "Not found" });
      res.json(sent);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0]?.message ?? "Invalid input",
          field: err.errors[0]?.path?.join("."),
        });
      }
      throw err;
    }
  });

  app.get(api.instructor.listTemplates.path, isAuthenticated, async (_req, res) => {
    const templates = await storage.listTemplates();
    res.json(templates);
  });

  app.post(api.instructor.createTemplate.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub as string | undefined;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const input = api.instructor.createTemplate.input.parse(req.body);
      const created = await storage.createTemplate({ ...input, createdByUserId: userId });
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0]?.message ?? "Invalid input",
          field: err.errors[0]?.path?.join("."),
        });
      }
      throw err;
    }
  });

  app.post(api.public.submitServiceFeedback.path, async (req, res) => {
    try {
      const reviewId = Number((req as any).params.reviewId);
      const input = api.public.submitServiceFeedback.input.parse(req.body);

      const ok = await storage.submitServiceFeedback(reviewId, {
        stars: input.stars,
        message: input.message ?? null,
      });
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.status(201).json({ ok: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0]?.message ?? "Invalid input",
          field: err.errors[0]?.path?.join("."),
        });
      }
      throw err;
    }
  });

  app.post(api.pike13.stubSyncMyStudents.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub as string | undefined;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const instructor = await storage.ensureInstructorForUser(userId);

    // REAL INTEGRATION POINT:
    // In a production app, you would redirect the user to Pike13's OAuth page here
    // if you don't already have a valid token for them.
    // Once the token is obtained and stored in the `pike13_tokens` table,
    // this endpoint would use that token to fetch real data from Pike13.

    const month = storage.normalizeMonth();
    await storage.seedAssignmentsForInstructor(instructor.id, month);
    res.json({ ok: true, message: "Synced (stub) and refreshed assignments." });
  });

  // === Admin routes ===
  app.post("/api/admin/seed-admin-direct-db-access-only", async (req, res) => {
    try {
      const { adminUserId } = req.body;
      console.log(`[ADMIN SEED] Received request for: ${adminUserId}`);
      if (!adminUserId) return res.status(400).json({ message: "Missing adminUserId" });
      const normalized = adminUserId.toLowerCase().trim();
      await storage.createAdminSetting({ adminUserId: normalized });
      console.log(`[ADMIN SEED] Successfully seeded: ${normalized}`);
      res.json({ ok: true, message: `Admin ${normalized} seeded` });
    } catch (err: any) {
      console.error(`[ADMIN SEED] Error: ${err.message}`);
      res.status(500).json({ message: "Failed to seed admin", error: err.message });
    }
  });

  app.get(api.admin.listInstructors.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub as string | undefined;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const isAdmin = await storage.isAdminUser(userId);
    if (!isAdmin) return res.status(403).json({ message: "Forbidden" });

    const rows = await storage.listInstructorsForAdmin();
    res.json(rows);
  });

  app.post(api.admin.setInstructorActive.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub as string | undefined;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const isAdmin = await storage.isAdminUser(userId);
      if (!isAdmin) return res.status(403).json({ message: "Forbidden" });

      const instructorId = Number(req.params.instructorId);
      if (!Number.isFinite(instructorId)) return res.status(404).json({ message: "Not found" });

      const input = api.admin.setInstructorActive.input.parse(req.body);
      const ok = await storage.setInstructorActive(instructorId, input.isActive);
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.json({ ok: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0]?.message ?? "Invalid input",
          field: err.errors[0]?.path?.join("."),
        });
      }
      throw err;
    }
  });

  app.get(api.admin.monthlyCompliance.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub as string | undefined;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const isAdmin = await storage.isAdminUser(userId);
    if (!isAdmin) return res.status(403).json({ message: "Forbidden" });

    const month = storage.normalizeMonth((req.query?.month as string | undefined) ?? undefined);
    const rows = await storage.getCompliance(month);
    res.json(rows);
  });

  return httpServer;
}
