# Submission Checklist — Forge 2 / Edition 1 (PulseDesk)
- [x] Repo is public → https://github.com/Arijit11-supernova/Forge2-Arijit
- [x] README has exact run steps; `php artisan migrate:fresh --seed` works from a fresh clone
- [x] Backend = Laravel 13 + MySQL 8 ; Frontend = React 19 + Vite + Tailwind CSS
- [x] Multi-tenancy: BelongsToOrg global scope, Acme cannot see Globex data
- [x] Hermes config committed → agents/hermes/hermes-config.yaml
- [x] OpenClaw config committed → agents/openclaw/openclaw.json
- [x] agent-log.md shows real human→Hermes→OpenClaw loop across 7 sprints
- [x] sprints/ has 7 sprint docs → sprint-01.md through sprint-07.md
- [x] Slack proof → slack-export/screenshots/ (all 5 channels)
- [x] App + CI screenshots → evidence/screenshots/
- [x] .github/workflows/ci.yml present + green on Actions
- [x] All model calls via EastRouter (z-ai/glm-5.1)

## Sprints Completed
- Sprint 1: Backend (migrations, models, seeders, Sanctum auth)
- Sprint 2: REST API (tickets, comments, multitenancy, policies)
- Sprint 3: React frontend (login, ticket list, ticket detail, new ticket)
- Sprint 4: Dashboard, activity log, claim ticket button, SLA indicator
- Sprint 5: In-app notifications (bell icon, unread count, dropdown)
- Sprint 6: CSV export (filtered ticket download)
- Sprint 7: All STRETCH features — bulk actions, CSAT rating, public rate-limited API, canned responses, ticket merge, customer portal, real-time polling, full-text comment search

## What Was Built
PulseDesk — a multi-tenant support desk SaaS with:
- Organizations, Users (admin/agent/customer roles), Tickets, Comments
- Strict tenant isolation via BelongsToOrg global scope
- Sanctum Bearer token auth
- Full Ticket + Comment CRUD API with filters, search, bulk actions
- React frontend: login, ticket list with checkboxes + CSV export, ticket detail with SLA + CSAT + merge + canned responses, dashboard, notification bell, customer portal
- 29 passing tests, CI green on GitHub Actions

## Agent Loop Summary
7 sprints. Human → Hermes (planning in #sprint-main) → OpenClaw (coding in #agent-coder) → OpenClaw reports in #agent-log → Human reviews + merges (#human-review). No bot auto-merged to main.

## Live Demo
Run locally:
```bash
cd backend && php artisan migrate:fresh --seed && php artisan serve
cd frontend && npm run dev
```
Open http://localhost:5173 — login with admin@acme.test / password
Multitenancy: login as admin@globex.test / password to see isolated data