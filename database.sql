-- Tolab Database Schema (PostgreSQL)
-- Run this to create the database from scratch:
--   createdb tolab
--   psql -d tolab -f database.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Users ──
CREATE TABLE users (
    id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email    VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_users_email ON users (email);

-- ── Workspaces ──
CREATE TABLE workspaces (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(255) NOT NULL,
    slug       VARCHAR(100) NOT NULL UNIQUE,
    plan       VARCHAR(50) NOT NULL DEFAULT 'free',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_workspaces_slug ON workspaces (slug);

-- ── Role enum ──
CREATE TYPE workspace_member_role AS ENUM ('owner', 'admin', 'member', 'guest');

-- ── Workspace Members (join table) ──
CREATE TABLE workspace_members (
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role         workspace_member_role NOT NULL DEFAULT 'member',
    joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (workspace_id, user_id),
    UNIQUE (workspace_id, user_id)
);

-- ── Invitations ──
CREATE TABLE invitations (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    email        VARCHAR(255) NOT NULL,
    role         workspace_member_role NOT NULL DEFAULT 'member',
    token        VARCHAR(64) NOT NULL UNIQUE,
    expires_at   TIMESTAMPTZ NOT NULL,
    accepted     BOOLEAN NOT NULL DEFAULT false,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_invitations_token ON invitations (token);

-- ── Projects ──
CREATE TABLE projects (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    key          VARCHAR(20) NOT NULL,
    name         VARCHAR(255) NOT NULL,
    type         VARCHAR(50) NOT NULL DEFAULT 'software',
    is_archived  BOOLEAN NOT NULL DEFAULT false,
    lead_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, key)
);

-- ── Sprints ──
CREATE TABLE sprints (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name       VARCHAR(255) NOT NULL,
    goal       TEXT,
    start_date DATE,
    end_date   DATE,
    state      VARCHAR(20) NOT NULL DEFAULT 'future',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Issues ──
CREATE TABLE issues (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    key            VARCHAR(20) NOT NULL,
    issue_type_id  UUID,
    status_id      VARCHAR(50),
    priority_id    VARCHAR(50),
    summary        VARCHAR(500) NOT NULL,
    description    TEXT,
    reporter_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    assignee_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    due_date       DATE,
    story_points   NUMERIC(5,1),
    sprint_id      UUID REFERENCES sprints(id) ON DELETE SET NULL,
    parent_issue_id UUID REFERENCES issues(id) ON DELETE SET NULL,
    resolution     VARCHAR(50),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Boards / Columns ──
CREATE TABLE board_columns (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name       VARCHAR(100) NOT NULL,
    position   INTEGER NOT NULL DEFAULT 0,
    UNIQUE (project_id, position)
);

-- ── Spaces (documentation) ──
CREATE TABLE spaces (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    key          VARCHAR(20) NOT NULL,
    name         VARCHAR(255) NOT NULL,
    description TEXT,
    icon         VARCHAR(50),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, key)
);

-- ── Pages (within spaces) ──
CREATE TABLE pages (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id  UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES pages(id) ON DELETE SET NULL,
    title     VARCHAR(500) NOT NULL,
    content   TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Comments ──
CREATE TABLE comments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type VARCHAR(20) NOT NULL,
    target_id   VARCHAR(50) NOT NULL,
    author_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Attachments ──
CREATE TABLE attachments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type VARCHAR(20) NOT NULL,
    target_id   VARCHAR(50) NOT NULL,
    file_name   VARCHAR(255) NOT NULL,
    file_size   INTEGER NOT NULL DEFAULT 0,
    mime_type   VARCHAR(100),
    storage_key VARCHAR(500) NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Notifications ──
CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind        VARCHAR(50) NOT NULL,
    payload_json TEXT,
    read_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_notifications_user_id ON notifications (user_id);

-- ── Activity Log ──
CREATE TABLE activities (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    actor_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    verb         VARCHAR(50) NOT NULL,
    target_type  VARCHAR(50) NOT NULL,
    target_id    VARCHAR(255) NOT NULL,
    payload_json TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_activities_workspace_id ON activities (workspace_id);
