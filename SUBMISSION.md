# Submission Checklist — Forge 2 / Edition 1 (PulseDesk)

- [x] Repo is public, named forge2-arijit → https://github.com/Arijit11-supernova/Forge2-Arijit
- [x] README has exact run steps; `php artisan migrate:fresh --seed` works from a fresh clone
- [x] Backend = Laravel 13 + MySQL 8 ; Frontend = React 19 + Vite + Tailwind CSS
- [x] Multi-tenancy: Org A cannot see Org B data — BelongsToOrg global scope derives tenant strictly from Auth::user()->organization_id, never from client-supplied data. Adversarial probe: Acme user cannot read Globex tickets.
- [x] Hermes config committed → agents/hermes/hermes-config.yaml (secrets redacted to ${ENV_VAR})
- [x] OpenClaw config committed → agents/openclaw/openclaw.json (secrets redacted to ${ENV_VAR})
- [x] agent-log.md shows the real human→Hermes→OpenClaw loop across 3 sprints
- [x] sprints/ has 3 sprint docs → sprints/sprint-01.md, sprint-02.md, sprint-03.md
- [x] Slack proof → slack-export/screenshots/ (per-channel screenshots, all 5 channels)
- [x] App / agents-running / CI screenshots → evidence/screenshots/
- [x] .github/workflows/ci.yml present + green run on Actions tab
- [x] PRs merged by ME (Arijit, human); commit authors are the agents (OpenClaw)
- [x] All model calls went through EastRouter (z-ai/glm-5.1)
- [x] Models used: z-ai/glm-5.1 (OpenClaw coder), z-ai/glm-5.1 (Hermes orchestrator) via EastRouter
- [x] Sprints run: 3 (sprint-01 backend foundation, sprint-02 CRUD API, sprint-03 React frontend)

## What Was Built
PulseDesk — a multi-tenant support desk SaaS with:
- Organizations, Users (admin/agent/customer roles), Tickets, Comments
- Strict tenant isolation via BelongsToOrg global scope
- Sanctum Bearer token auth
- Full Ticket + Comment CRUD API with policies, filters, search
- React frontend: login, ticket list, ticket detail with threaded comments, new ticket form
- 29 passing tests (80 assertions), CI green on GitHub Actions

## Agent Loop Summary
3 real sprints. Human → Hermes (planning in #sprint-main) → OpenClaw (coding in #agent-coder) → OpenClaw reports (in #agent-log) → Human reviews + merges PR (#human-review). All communication via Slack. No bot auto-merged to main.

## Live Demo
Run locally:
```bash
cd backend && php artisan migrate:fresh --seed && php artisan serve
cd frontend && npm run dev
```
Open http://localhost:5173 — login with admin@acme.test / password