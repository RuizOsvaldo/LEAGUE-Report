# LEAGUE Report — Spec

## Overview

LEAGUE Report is a full-stack web app for managing monthly instructor-to-guardian student progress reviews. Instructors write monthly progress emails for their assigned students, admins track compliance across instructors, and guardians leave service feedback via public links.

**Roles:**
- **Instructors** — manage their own reviews and templates
- **Admins** — oversee all instructors and compliance
- **Guardians** — interact through unauthenticated feedback pages

---

## Architecture

Single repo with three top-level code directories:

- `client/` — React SPA (Vite + TypeScript)
- `server/` — Express API server (TypeScript)
- `shared/` — Types, Zod schemas, DB schema, and route definitions used by both client and server

---

## Frontend

- React 18, Wouter routing, TanStack React Query, shadcn/ui + Tailwind CSS
- Path aliases: `@/` → `client/src/`, `@shared/` → `shared/`
- Forms via react-hook-form with Zod validation
- Design: glassmorphism, mesh backgrounds, rounded cards, gradient overlays

**Pages:** Landing, AppHome, InstructorDashboard, InstructorReviews, ReviewEditor, TemplatesPage, AdminOverview, AdminInstructors, AdminCompliance, FeedbackPage (public), PendingActivation, 404

---

## Backend

- Express.js + TypeScript; RESTful JSON API under `/api/*`
- Route contracts defined in `shared/routes.ts` with Zod request/response schemas
- All DB access goes through `server/storage.ts` (`IStorage` interface)
- Dev: Vite middleware injected into Express for HMR. Prod: static files from `dist/public`

---

## Shared Layer

- `shared/schema.ts` — Drizzle ORM table definitions, Zod insert schemas, TypeScript types
- `shared/routes.ts` — Every endpoint's method, path, input schema, and response schemas. Both client hooks and server handlers reference these.
- `shared/models/auth.ts` — Auth tables (`users`, `sessions`)

---

## Database

PostgreSQL via Drizzle ORM.

**Tables:** `users`, `sessions`, `instructors`, `students`, `instructor_students`, `monthly_reviews`, `review_templates`, `service_feedback`, `admin_settings`, `pike13_tokens`

**Enums:** `role` (admin, instructor), `review_status` (pending, draft, sent)

---

## Authentication & Authorization

- Passport.js with Local and Google OAuth strategies
- Sessions stored in PostgreSQL via `connect-pg-simple`
- Admin status checked via `admin_settings` table (keyed by email)
- Instructors auto-created on first login but must be activated by an admin
- `isAuthenticated` middleware on protected routes; 401 → client redirects to `/login`

---

## Key Features

- **Instructor Dashboard** — monthly summary: students assigned, reviews drafted/sent/pending
- **Review Editor** — draft and send monthly progress emails per student with template support
- **Templates** — create and reuse email templates with placeholder variables
- **Admin Panel** — activate/deactivate instructors, view monthly compliance
- **Feedback** — public star-rating page for guardians (no auth required)
- **Pike13 Integration** — stub sync for pulling student assignments; OAuth tokens stored per instructor
- **Month Picker** — all review views filterable by month

---

## External Dependencies

- **PostgreSQL** — primary data store (`DATABASE_URL`)
- **Pike13 API** — external student management system (stub; OAuth tokens per instructor)
- **Google OAuth** — authentication option (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
- **Drizzle ORM + drizzle-kit** — schema management
- **TanStack React Query** — server state
- **Zod** — runtime validation shared across client and server
