# Tolab

A project + documentation management platform. Think **Jira**'s issue tracking and **Confluence**'s pages, fused into one tool.

> Status: **vertical-slice MVP**. Phases 1 and 2 (auth + workspaces + members) are fully implemented end-to-end. Phases 3–6 are scaffolded with stable route shapes and stub handlers so subsequent phases fit cleanly into the same skeleton.

## Stack

**Backend** — Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, PostgreSQL, Redis, JWT auth.
**Frontend** — Vite, React 19, TypeScript, TanStack Router, TanStack Query, Zustand, Tailwind v4, shadcn/ui, TipTap.
**Infra** — Docker Compose (postgres, redis, backend, frontend), Nginx.

## Repository layout

```
nextlab/
├── README.md
├── WORKFLOW.md
├── UPDATES.md
├── Makefile
├── docker-compose.yml
├── .env.example
├── .gitignore
├── backend/         FastAPI service
├── frontend/        Vite + React TS app
└── infra/           nginx, deployment helpers
```

## Quick start (Docker)

```bash
cp .env.example .env
make up           # build + start postgres, redis, backend, frontend
make migrate      # apply alembic migrations
make seed         # create demo workspace + admin user
```

Then:

- Frontend: <http://localhost:5173>
- Backend: <http://localhost:8000>
- API docs (Swagger): <http://localhost:8000/docs>

Demo credentials after `make seed`:

- Email: `admin@tolab.dev`
- Password: `tolab-admin`

## Local dev (without Docker)

```bash
# Backend
cd backend
python -m venv .venv
.venv\Scripts\activate      # Windows
pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

Frontend reads `VITE_API_URL` (defaults to `http://localhost:8000`).

## Documentation

- [**WORKFLOW.md**](./WORKFLOW.md) — how the team works on Tolab: branching, commits, review, releases, on-call.
- [**UPDATES.md**](./UPDATES.md) — running changelog of what's been built / what's next / what's deferred.

## License

Proprietary — internal project. All rights reserved.
