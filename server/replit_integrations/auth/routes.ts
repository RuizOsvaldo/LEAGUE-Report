import type { Express } from "express";
import passport from "passport";
import bcrypt from "bcryptjs";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";

export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await authStorage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Register a new user
  app.post("/api/register", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const existing = await authStorage.getUserByEmail(email.toLowerCase().trim());
      if (existing) {
        return res.status(409).json({ message: "An account with that email already exists" });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await authStorage.createUserWithPassword(email.toLowerCase().trim(), passwordHash);

      // Log in immediately after registration
      const sessionUser = { claims: { sub: user.id, email: user.email } };
      req.login(sessionUser, (err) => {
        if (err) return res.status(500).json({ message: "Login after register failed" });
        res.status(201).json(user);
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login with email + password
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message ?? "Invalid email or password" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        res.json({ ok: true });
      });
    })(req, res, next);
  });

  // Google OAuth
  app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login?error=google" }),
    (_req, res) => res.redirect("/")
  );

  // Logout
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ ok: true });
    });
  });

  app.get("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.redirect("/");
    });
  });
}
