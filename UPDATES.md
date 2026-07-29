# Tolab — running changelog

Legend:

- ✅ Done (phase complete)
- 🟡 In progress
- ⬜ Not started
- ⏳ Deferred

---

## Phase 1 — Skeleton ✅

- Monorepo layout with backend + frontend + infra ✅
- docker compose: postgres, redis, backend (uvicorn), frontend (vite) ✅
- Makefile: up/down/migrate/test-backend/test-frontend/lint ✅
- `.env.example` with all variables, `.gitignore`, `.editorconfig` ✅
- Backend Dockerfile (multi-stage, python:3.12-slim, uvicorn) ✅
- Frontend Dockerfile (dev stage with vite) ✅
- Backend health: `GET /health` returns `{"status":"ok"}` ✅
- Frontend: Vite boots, renders placeholder ✅

---

## Phase 2 — Auth + Workspaces ✅

- User model (id, email, full_name, hashed_password, is_active, created_at) ✅
- Workspace model (id, name, slug, plan, created_at) ✅
- WorkspaceMember model (workspace_id, user_id, role: owner/admin/member) ✅
- Invitation model (workspace_id, email, role, token, expires_at, accepted/rejected) ✅
- Auth endpoints: POST register, POST login (returns access+refresh tokens), POST refresh, POST logout, GET /me ✅
- Workspaces CRUD: GET/POST/PATCH/DELETE /api/v1/workspaces ✅
- Workspace members: GET/POST/PATCH/DELETE /api/v1/workspaces/{id}/members ✅
- Invitations: POST /api/v1/workspaces/{id}/invitations, GET /api/v1/invitations/{token}, POST accept ✅
- Alembic initial migration — manual (no auto-generate; hand-written for Phase 2 tables) ✅
- Backend tests: auth flow, create workspace, add member, invite+accept ✅
- Frontend: TanStack Router file-based routes ✅
- Frontend: Zustand authStore with token in memory, refresh interceptor ✅
- Frontend lib/api.ts with axios, automatic Bearer injection, 401→refresh→retry ✅
- Pages: /login, /register, /forgot-password, /accept-invitation/:token, /onboarding ✅
- App shell: AppLayout with Topbar + Sidebar ✅
- Dashboard placeholder page with user greeting ✅
- Profile page: GET /me, update name ✅
- Workspace settings: members table, invite modal (hits live API) ✅
- Tailwind v4 + shadcn/ui Button/Input/Card/Modal/Spinner ✅
- TypeScript strict, eslint ✅

---

## Phase 3 — Confluence side (Spaces & Pages) ⬜

- Space model (id, workspace_id, key, name, description, icon, created_at) ⬜
- Page model (id, space_id, parent_page_id, title, slug, body, version, author_id, position, status, created_at, updated_at) ⬜
- PageVersion model (page_id, version, body, author_id, message, created_at) ⬜
- Space CRUD endpoints ⬜
- Page tree endpoints (GET tree, POST create, PATCH move/rename, DELETE) ⬜
- Page version history endpoint ⬜
- Rich text editor: TipTap with headings, tables, code blocks, @mentions ⬜
- Page view mode vs edit mode toggle ⬜
- Space sidebar with tree navigation ⬜

---

## Phase 4 — Jira side (Projects & Issues & Boards & Sprints) ⬜

- Project model (id, workspace_id, key, name, avatar, type, lead_id, visibility, created_at) ⬜
- Issue model (id, project_id, key, type_id, status_id, priority, summary, description, reporter_id, assignee_id, due_date, points, sprint_id, epic_id, resolution) ⬜
- IssueType, WorkflowStatus, Priority, Label, Component, Version models ⬜
- Project CRUD + settings sub-resources (issue-types, workflows, versions, components, categories, labels) ⬜
- Issues CRUD + transitions + comments + attachments + watchers ⬜
- Backlog page: drag-to-rank (dnd-kit), epics grouped, sprint assignment ⬜
- Kanban board: columns backed by board/board-column models, drag-to-move ⬜
- Sprint lifecycle: start / complete with velocity chart (Recharts) ⬜
- Gantt timeline (Recharts bar chart) for epics and sprints ⬜

---

## Phase 5 — Cross-cutting: Search, Activity, Notifications ⬜

- Postgres full-text search across issues (subject+description) and pages (title+body) ⬜
- Search endpoint: `GET /api/v1/search?q=&type=&project=&space=` ⬜
- Activity model (actor_id, verb, target_type, target_id, payload, created_at) ⬜
- Activity feed endpoint per workspace ⬜
- Notification model (user_id, kind, payload, read_at) ⬜
- Notifications CRUD + bulk mark-read ⬜
- Workspace-level search UI page ⬜

---

## Phase 6 — Polish & Deploy ⬜

- Dashboard charts: project status pie, sprint velocity, recent activity ⬜
- Seed CLI: `python -m app.cli.seed` creates workspace + admin user + sample project + issues ⬜
- Production Dockerfiles (nginx serving built frontend static files) ⬜
- Nginx reverse-proxy template in `infra/nginx.conf` ⬜
- README refreshed with final quick-start ⬜
- CI placeholder (`.github/workflows/ci.yml`) ⬜

---

## Known issues (current sprint)

- `make seed` works in Docker but not yet on bare Windows (needs `sh` → `pwsh` path).
- Frontend `Spinner` component imported but only two instances wired — the rest of the stub pages use text loading.
- Test coverage is ~30% (auth + workspaces only — issues/spaces/pages tests will come with Phases 3-4).

---

## Decisions log

| Date | Decision |
|---|---|
| 2026-07-02 | Monorepo (backend + frontend in one repo). PostgreSQL, not MySQL. Pydantic v2, no v1. |
| 2026-07-02 | TanStack Router + TanStack Query (not React Router + raw axios). |
| 2026-07-02 | Zustand for auth/workspace state, no Redux. |
| 2026-07-02 | Tailwind v4 + shadcn/ui (not Bootstrap 5 from the old project). |
| 2026-07-02 | Hand-written Alembic initial migration (phase-2 tables only). Auto-generate after Phase 3 models are added. |