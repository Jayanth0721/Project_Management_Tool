# Tolab workflow

How we build Tolab — day-to-day conventions for the team.

## Branches

- `main` — always deployable. No direct commits.
- Feature branches: `feat/<short-slug>` branched from `main`.
- Bug fixes: `fix/<short-slug>` branched from `main`.
- Hotfixes: `hotfix/<short-slug>` branched from `main`, merged into `main` first, then back-merged into `develop` if we have one.

Branch names are lowercase, hyphenated. Examples: `feat/kanban-wip-limits`, `fix/issue-search-fts`.

## Commits

Follow conventional-commits:

```
<type>(<scope>): <short summary>

<optional longer body>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.

Scopes: `auth`, `workspace`, `project`, `issue`, `board`, `sprint`, `space`, `page`, `search`, `activity`, `notify`, `infra`, `ui`, `api`, `db`, `ci`.

Example:
```
feat(issue): add transition endpoint with workflow validation
```

## Pull requests

- One PR = one coherent change (feature, fix, refactor).
- PR title matches the conventional-commit subject.
- Description includes: what, why, how to test, screenshots if UI.
- At least one reviewer required before merge.
- CI must pass (lint, typecheck, backend tests, frontend tests) before merge.

Merge strategy: **squash and merge** into `main`. The squash commit message is the PR title + PR number.

## Code review

Review checklist:

- [ ] Does the code do what the PR says?
- [ ] Are there tests covering the happy path + edge cases?
- [ ] Are secrets / credentials still environment-only?
- [ ] Does an Alembic migration accompany any model change?
- [ ] Is every new endpoint documented in the OpenAPI schema (visible in `/docs`)?
- [ ] Does the frontend match the Pydantic schema shape?
- [ ] Is any `console.log` left in production code?

## Releases

- We tag releases on `main` as `v<major>.<minor>.<patch>` (semver).
- A release includes a written changelog summary appended to CHANGELOG.md (we'll add it once we ship).
- After tagging, deploy from the tag.

## Testing

- Backend: pytest with `httpx.AsyncClient` and `factory_boy` factories.
- Frontend: vitest + React Testing Library (components we ship beyond stubs).
- Every new route or service must have happy-path tests before merging.

## On-call / runbooks

Not yet written — we'll add them in `infra/runbooks.md` when we go live.

## Secrets

- Everything in `.env` — never hardcoded in source.
- `.env` is `.gitignore`d.
- `.env.example` is committed with placeholder values only.