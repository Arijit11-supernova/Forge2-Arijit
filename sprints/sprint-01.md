# Sprint 01 -- Multi-tenant foundation & ticket API

**Goal:** Stand up the secure, tenant-isolated backend foundation. A fresh clone must be able to
`php artisan migrate --seed`, log in as admin / agent / customer, and round-trip a tenant-scoped
ticket through the API. No frontend this sprint (frontend scaffold starts in Sprint 02).

**Models:** Hermes (planning / product owner, via EastRouter) - OpenClaw (coding, z-ai/glm-5.1, via EastRouter)
**Stack (actual, from composer.json):** Laravel 13 / PHP 8.3 / Sanctum 4 / MySQL 8 (target). React 19 + Vite + Tailwind comes later.

**Baseline at sprint open:**
- `backend/` = stock Laravel 13 skeleton. Only `App\Models\User` + default migrations
  (`users`, `cache`, `jobs`, `personal_access_tokens`). No `routes/api.php`. Sanctum installed but not wired in.
- `frontend/` = empty (`.gitkeep` only).
- `config/database.php` defaults to sqlite (`database/database.sqlite` exists); **must switch target to MySQL 8**.

## Issues
- [ ] **#1 Backend foundation: models + migrations + Sanctum auth + tenant scope + seeder** *(assigned to @OpenClaw)*
- [ ] #2 Ticket + Comment CRUD API with authorization policies (tenant-scoped)
- [ ] #3 Feature tests proving auth + Org-A-cannot-see-Org-B isolation
- [ ] #4 README run steps + demo logins filled in (verify `migrate --seed` from a clean clone)

## Definition of Done (applies to every issue)
1. Branch from `main`; Open a PR to `main`; **Arijit (human) merges.** Commit author = OpenClaw.
2. `php artisan test` is green; `php artisan migrate:fresh --seed` runs clean from a fresh checkout.
3. All endpoints live under `/api`. The tenant is derived from the **authenticated Sanctum session**, never from a client-supplied `org_id`.
4. No secrets in git; `.env` stays gitignored; only `.env.example` is committed.
5. Code follows Laravel Pint formatting (`./vendor/bin/pint`).

## Outcome (fill in at sprint close)
- **Shipped:** ...
- **Slipped / moved to Sprint 02:** ...
- **PRs:** #... (merged by Arijit)
