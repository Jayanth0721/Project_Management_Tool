.ONESHELL:
SHELL := /bin/bash

.PHONY: up down build restart migrate seed test-backend test-frontend lint clean

up:
	docker compose up -d --build

down:
	docker compose down

build:
	docker compose build

restart:
	docker compose down
	docker compose up -d --build

migrate:
	docker compose exec backend alembic upgrade head

seed:
	docker compose exec backend python -m app.cli.seed

test-backend:
	docker compose exec backend pytest -v

test-frontend:
	docker compose exec frontend npx vitest run

lint:
	docker compose exec backend ruff check .
	docker compose exec frontend npx eslint src/

clean:
	docker compose down -v
	rm -rf backend/storage
	rm -rf frontend/dist