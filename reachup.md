# Tolab — Production Readiness Roadmap

Current status: **Vertical-slice MVP** → Target: **Production**

---

## P0 — Critical (blocker for any deployment)

- [ ] **Alembic migrations for all tables** — Replace `Base.metadata.create_all` with proper migrations for boards, sprints, spaces, pages, issues, comments, attachments, activity, notifications
- [ ] **Switch to PostgreSQL** — Remove SQLite as default; update config, CI, and dev workflow to use PostgreSQL exclusively
- [ ] **Handle empty catch blocks** — 18+ `.catch(() => {})` across frontend files (BoardPage, ProjectDetailPage, ProfilePage, AttachmentSection, CommentSection, SearchPage, NotificationsPage, PageCreatePage, SpacePage). Show toasts or log errors
- [ ] **Password reset** — Backend endpoint + email integration; frontend forgot-password page is a stub

## P1 — Beta Readiness

### Testing
- [ ] **Frontend tests** — Add Vitest, test all 14 pages (at minimum smoke + interaction tests)
- [ ] **Backend test coverage** — Tests for issues, boards, sprints, spaces, pages, comments, attachments, search, notifications, activity
- [ ] **CI pipeline** — Run frontend tests (`vitest run`), add lint step (`ruff check`), verify migrations

### Data Integrity
- [ ] **Gitignore `tolab.db`** — Prevent SQLite dev database from being committed
- [ ] **Pagination on all list endpoints** — Projects, issues, sprints, spaces, pages, comments, activity, notifications, members
- [ ] **Slug validation on backend** — Validate workspace/space/page slug format (ASCII, max length, no special chars)

### UX & Bugs
- [ ] **Dashboard Spaces & User stat cards** — Replace hardcoded `null` with live API counts (spaces count, workspace member count)
- [ ] **Status pie chart labels** — Replace raw `status_id` UUIDs with human-readable status names (fetch workflow statuses and map)
- [ ] **BoardPage assignee filter** — `.includes()` on UUID never matches; use proper equality comparison
- [ ] **ProjectDetailPage keyword filter** — Fix filter logic that always returns the full issue list
- [ ] **Notification badge auto-refresh** — Poll unread count periodically (or use SSE)

### Infrastructure
- [ ] **SMTP integration** — Wire up email sending for invitations and notifications
- [ ] **Redis integration** — Cache tokens, rate-limit auth endpoints, session store (Redis is already in docker-compose but unused)
- [ ] **Nginx production config** — Serve built frontend static files, proxy `/api` to backend, enable gzip, set security headers

### Code Quality
- [ ] **Replace `body: dict` with Pydantic schemas** — Backend endpoints for projects, issues, spaces, pages, boards, sprints currently accept raw dicts; define request models
- [ ] **Remove dead `deps.get_current_workspace_admin`** — Never imported; auth logic is duplicated inline
- [ ] **Remove empty `models/issue.py`** — Confusing dead file; Issue model lives in `project.py`
- [ ] **Fix `useEffect` missing dependencies** — App.tsx, BoardPage.tsx, ProjectDetailPage.tsx have stale closure risks
- [ ] **Enable `noUnusedLocals` and `noUnusedParameters` in tsconfig** — Catch dead code at compile time

## P2 — Production Hardening

### Performance
- [ ] **PostgreSQL full-text search** — Replace `LIKE` with `tsvector`/`tsquery` in search_service.py
- [ ] **Add database indexes** — Review query patterns and add composite indexes for common filters (e.g., `(workspace_id, key)`, `(project_id, status_id)`)
- [ ] **N+1 query audit** — Profile and optimize eager-loading relationships (e.g., issues + comments, pages + versions)
- [ ] **Rate limiting** — Add per-user rate limits to auth endpoints and public API

### Security
- [ ] **Remove hardcoded demo credentials** — Move to env vars or seed script only (not in frontend source)
- [ ] **CSRF protection** — Add stateful CSRF tokens or SameSite cookie strategy
- [ ] **Input validation** — Ensure all Pydantic models have proper constraints (min/max length, regex patterns)
- [ ] **Audit logging** — Log admin actions (delete workspace, remove member, delete project) to a separate audit table

### Monitoring & Ops
- [ ] **Health check endpoint** — Add DB connectivity check, Redis connectivity, disk space
- [ ] **Structured logging** — Replace `print()` with structured JSON logging (loguru or structlog)
- [ ] **Container health checks** — Add `healthcheck` to docker-compose services
- [ ] **Backup/restore** — Document pg_dump procedure and add a Makefile target
- [ ] **Sentry or APM** — Error tracking for both backend and frontend

## P3 — Nice-to-Have

- [ ] **WebSocket/SSE for real-time** — Live notifications, board updates when other users move cards
- [ ] **Issue type/priority/label management UI** — Backend models exist; need CRUD routes and settings pages
- [ ] **Backlog page** — Drag-to-rank issues in backlog, assign to sprints
- [ ] **Sprint velocity chart** — Recharts bar chart on project detail
- [ ] **TipTap tables, code blocks, @mentions** — Upgrade from StarterKit to full editor
- [ ] **Dark mode fixes** — Audit all pages for dark mode consistency
- [ ] **Keyboard shortcuts** — `c` to create issue, `s` to search, `?` for help
- [ ] **Mobile responsive** — Sidebar collapse, responsive grid for Kanban
- [ ] **File/image preview** — Inline preview for attachments (images, PDFs)
- [ ] **Email notifications** — Send emails for @mentions, issue assignments, sprint starts

---

## Effort Estimate

| Phase | Effort | Timeline |
|---|---|---|
| P0 — Critical | ~3 days | Week 1 |
| P1 — Beta | ~2 weeks | Weeks 1–2 |
| P2 — Production | ~2 weeks | Weeks 3–4 |
| P3 — Nice-to-have | ~1 week | Week 5 |

**Total for Production**: ~4–5 weeks with 1 full-time developer.
