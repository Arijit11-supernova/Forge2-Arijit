\# Architecture — PulseDesk



\## Multi-tenancy Approach

Every record belongs to an `organization\_id`. The `BelongsToOrg` global scope is auto-applied to `Ticket` and `Comment` models, filtering all queries by `Auth::user()->organization\_id`. Tenant is derived ONLY from the authenticated user's session — never from client-supplied data.



\## Data Model

\- `organizations` — id, name, slug, timestamps

\- `users` — id, organization\_id, name, email, password, role (admin/agent/customer), timestamps

\- `tickets` — id, organization\_id, subject, description, status, priority, requester\_id, assignee\_id, timestamps

\- `comments` — id, ticket\_id, organization\_id, author\_id, body, is\_internal, timestamps

\- `sla\_policies` — id, organization\_id, name, priority, response\_hours, resolution\_hours

\- `activity\_logs` — id, organization\_id, ticket\_id, user\_id, action, timestamps



\## API Routes

\- POST /api/register

\- POST /api/login

\- POST /api/logout

\- GET /api/me

\- GET/POST /api/tickets

\- GET/PUT/DELETE /api/tickets/{id}

\- GET/POST /api/tickets/{ticket}/comments

\- PUT/DELETE /api/comments/{id}



\## Key Decisions

\- Laravel Sanctum token-based auth (Bearer tokens) for SPA

\- Global scope on Ticket/Comment for automatic tenant isolation

\- Role-based authorization via Laravel Policies (TicketPolicy, CommentPolicy)

\- Internal comments hidden from customers via policy

\- React Router v7 for SPA routing with protected routes

\- Centralized API client with auto Bearer token injection

