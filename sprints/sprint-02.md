# Sprint 02 — Ticket & Comment CRUD API

**Goal:** Full Ticket + Comment CRUD API with authorization policies
**Date:** 2026-06-27

## Issues Completed
1. TicketController - full CRUD, paginated, org-scoped
2. TicketPolicy - role-aware, cross-org denial
3. Filters: status, priority, assignee_id + text search (subject/description)
4. CommentController nested under tickets, internal notes hidden from customers
5. CommentPolicy org-scoped via parent ticket

## What Shipped
- 20 new feature tests, 29 total (80 assertions) all green
- CI passing on GitHub Actions

## Assigned to: OpenClaw
## Status: DONE - merged to main