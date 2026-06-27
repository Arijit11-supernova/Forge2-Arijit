# PulseDesk — Multi-tenant Support Desk SaaS

Built for Forge 2 · Edition 1 hackathon using Hermes + OpenClaw agents over Slack.

## Stack
- Backend: Laravel 13 + MySQL 8 + Sanctum
- Frontend: React 19 + Vite + Tailwind CSS
- Agents: Hermes (orchestrator) + OpenClaw (coder) via EastRouter (z-ai/glm-5.1)

## Run Steps

### Backend
```bash
cd backend
cp .env.example .env
# Set DB_PASSWORD in .env to your MySQL root password
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Demo Logins
- Admin: admin@acme.test / password
- Agent: agent@acme.test / password  
- Customer: customer@acme.test / password
- Globex org: admin@globex.test / password

## Models Used
- Hermes: z-ai/glm-5.1 via EastRouter
- OpenClaw: z-ai/glm-5.1 via EastRouter

## Agent Workflow
Hermes (orchestrator) planned sprints and assigned issues to OpenClaw (coder) via Slack. All communication via #sprint-main, #agent-coder, #agent-log, #ci-cd, #human-review channels.
