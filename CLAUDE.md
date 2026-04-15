# Proyecto Teflon — Claude Code Guidelines

## Superpowers Skills — MANDATORY RULES

This project uses the [Superpowers](https://github.com/obra/superpowers) skills framework.
Skills live in `.claude/skills/`. **These rules are non-negotiable. No exceptions.**

### BEFORE building any new feature or functionality:
**MUST invoke `brainstorming` skill FIRST** — clarify requirements before writing a single line of code.
Triggers: "agregar", "crear", "nueva feature", "implementar", "quiero que", "añadir", "build", "new", "feature".

### BEFORE touching any bug, error, or unexpected behavior:
**MUST invoke `systematic-debugging` skill FIRST** — find root cause before proposing any fix.
Triggers: "bug", "error", "no funciona", "falla", "arreglar", "fix", "crash", "problema", "issue", "roto".

### BEFORE implementing anything non-trivial (> 1 file or > 20 lines):
**MUST invoke `writing-plans` skill FIRST** — produce a plan, get alignment, then code.
Triggers: "implementar", "refactorizar", "migrar", "rediseñar", "plan", "arquitectura", complex multi-step tasks.

### WHEN writing or modifying tests:
**MUST invoke `test-driven-development` skill** — Red-Green-Refactor, always write the failing test first.
Triggers: "test", "prueba", "tdd", "spec", "testing", "unit test".

### BEFORE declaring any task complete:
**MUST invoke `verification-before-completion` skill** — verify the change actually works before saying "done".
Triggers: finishing any implementation, about to say "listo", "terminé", "done", "completado".

### All available skills:
- `using-superpowers` — How the skills system works
- `brainstorming` — Requirements clarification (**mandatory before any feature**)
- `writing-plans` — Implementation planning (**mandatory for complex tasks**)
- `executing-plans` — Execute plans with subagents
- `systematic-debugging` — Root-cause analysis (**mandatory before any fix**)
- `test-driven-development` — Red-Green-Refactor TDD (**mandatory for tests**)
- `verification-before-completion` — Verify before done (**mandatory before finishing**)
- `dispatching-parallel-agents` — Parallel subagent work
- `subagent-driven-development` — Subagent-driven implementation
- `requesting-code-review` — How to request code review
- `receiving-code-review` — How to handle code review feedback
- `finishing-a-development-branch` — Branch cleanup and PR prep
- `using-git-worktrees` — Git worktree management

## Project Overview

**Proyecto Teflon** — Full-stack e-commerce SaaS for "Sanitarios El Teflon".

- **Backend:** Node.js + Express (ES modules), port 4000 — `server/`
- **Frontend:** React 18 + Vite, port 5173 — `web/`
- **Database:** PostgreSQL 15+ — `db/`

## Key Conventions

- All DB queries must filter by `tenant_id` (multi-tenant architecture)
- Frontend requires `VITE_TENANT_ID` env var
- Auth disabled in dev with `DISABLE_AUTH=true`
- Startup migrations run automatically on server boot
- File uploads: images (5MB), payment proofs (10MB) via Multer
