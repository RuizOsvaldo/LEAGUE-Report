## Packages
(none needed)

## Notes
Uses existing shadcn/ui components already in repo.
Auth is Replit OIDC via /api/login + /api/logout; frontend uses existing useAuth() hook.
All API calls use @shared/routes (api + buildUrl) and validate with Zod at runtime.
Handle 401 by redirecting to /api/login.
