# JTL Reviews

## Overview

JTL Reviews is a full-stack web application for managing monthly instructor-to-guardian student progress reviews. Instructors write monthly progress emails for their assigned students, admins track compliance across instructors, and guardians can leave service feedback via public links. The app follows a multi-role pattern: instructors manage their own reviews and templates, admins oversee all instructors and compliance, and guardians interact through unauthenticated feedback pages.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure
The project uses a single-repo layout with three top-level code directories:
- **`client/`** — React SPA (Vite + TypeScript)
- **`server/`** — Express API server (TypeScript, run via tsx)
- **`shared/`** — Shared types, Zod schemas, database schema, and route definitions used by both client and server

### Frontend (`client/src/`)
- **Framework:** React 18 with TypeScript, bundled by Vite
- **Routing:** Wouter (lightweight client-side router)
- **State/Data fetching:** TanStack React Query for all server state; no Redux or global state manager
- **UI Components:** shadcn/ui (new-york style) built on Radix UI primitives + Tailwind CSS
- **Styling:** Tailwind CSS with CSS custom properties for theming (light/dark), custom fonts (Manrope body, Fraunces display)
- **Path aliases:** `@/` maps to `client/src/`, `@shared/` maps to `shared/`
- **Design language:** Premium minimal aesthetic with glassmorphism (`.glass`), mesh backgrounds (`.bg-mesh`), grain textures, rounded-3xl cards, and gradient overlays
- **Forms:** react-hook-form with @hookform/resolvers for Zod validation
- **Key pages:** Landing, AppHome (role-based redirect), InstructorDashboard, InstructorReviews, ReviewEditor, TemplatesPage, AdminOverview, AdminInstructors, AdminCompliance, FeedbackPage (public), PendingActivation, 404

### Backend (`server/`)
- **Framework:** Express.js on Node with TypeScript (run via tsx in dev, esbuild bundle in production)
- **API design:** RESTful JSON API under `/api/*`; route contracts defined in `shared/routes.ts` with Zod schemas for request/response validation
- **Route registration:** All routes registered in `server/routes.ts` via `registerRoutes()`
- **Storage layer:** `server/storage.ts` exports a `storage` object implementing `IStorage` interface — all database access goes through this abstraction
- **Dev server:** Vite dev server middleware is injected into Express for HMR; in production, static files served from `dist/public`
- **Build:** Custom `script/build.ts` runs Vite for client + esbuild for server; output goes to `dist/`

### Shared Layer (`shared/`)
- **`schema.ts`** — Drizzle ORM table definitions (PostgreSQL), Zod insert schemas via `drizzle-zod`, and TypeScript types exported for both client and server
- **`routes.ts`** — Centralized API contract: every endpoint's method, path, input schema, and response schemas defined here. Both client hooks and server handlers reference these definitions.
- **`models/auth.ts`** — Auth-related tables (`sessions`, `users`) required by Replit Auth

### Database
- **PostgreSQL** via `pg` (node-postgres) pool
- **ORM:** Drizzle ORM with PostgreSQL dialect
- **Schema push:** `drizzle-kit push` (no migration files needed for dev)
- **Key tables:** `users`, `sessions`, `instructors`, `students`, `instructor_students`, `monthly_reviews`, `review_templates`, `service_feedback`, `admin_settings`, `pike13_tokens`
- **Enums:** `role` (admin, instructor), `review_status` (pending, draft, sent)

### Authentication & Authorization
- **Replit OIDC** — OpenID Connect via Replit's identity provider
- **Session management:** `express-session` with `connect-pg-simple` storing sessions in the `sessions` PostgreSQL table
- **Passport.js** with openid-client Strategy
- **Auth flow:** `/api/login` redirects to Replit OIDC, callback upserts user into `users` table. `/api/logout` destroys session.
- **Frontend auth:** `useAuth()` hook queries `/api/auth/user`; returns user object or null
- **Role checks:** Admin status checked via `admin_settings` table (keyed by email). Instructor accounts auto-created on first login, but must be activated by admin before accessing features.
- **Middleware:** `isAuthenticated` middleware on protected routes; 401 responses trigger client-side redirect to `/api/login`

### API Pattern
All client-side data hooks follow the same pattern:
1. Import route definition from `@shared/routes`
2. Use `buildUrl()` for parameterized paths
3. Validate input with Zod before sending
4. Validate response with Zod after receiving (with `parseWithLogging`)
5. React Query handles caching, refetching, and loading states

### Key Features
- **Instructor Dashboard:** Monthly summary metrics (students assigned, reviews drafted/sent/pending)
- **Review Editor:** Draft and send monthly progress emails per student; supports email templates
- **Templates:** CRUD for reusable email templates
- **Admin Panel:** View/activate/deactivate instructors, compliance tracking by month
- **Feedback:** Public page (no auth required) where guardians rate service with stars + optional message
- **Pike13 Integration:** Stub sync endpoint for pulling student data from Pike13 (OAuth token stored in `pike13_tokens`)
- **Month Picker:** All review-related views are filterable by month

## External Dependencies

- **PostgreSQL** — Primary data store (required, connection via `DATABASE_URL` env var)
- **Replit OIDC** — Authentication provider (`ISSUER_URL` defaults to `https://replit.com/oidc`; requires `REPL_ID` and `SESSION_SECRET`)
- **Pike13 API** — External student management system (stub integration; OAuth tokens stored per instructor)
- **shadcn/ui + Radix UI** — Component library (vendored into `client/src/components/ui/`)
- **Drizzle ORM + drizzle-kit** — Database ORM and schema management
- **TanStack React Query** — Server state management
- **Zod** — Runtime schema validation (shared between client and server)
- **Google Fonts** — Manrope, Fraunces, DM Sans, Fira Code, Geist Mono, Architects Daughter