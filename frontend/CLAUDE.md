Frontend (frontend/) — CLAUDE.md

Purpose

This document describes the frontend app in this repository (frontend/). It summarizes how to run the project, important files, environment variables, conventions, and security/testing expectations for future contributors.

Quick start

- Install dependencies: npm install
- Run dev server: npm run dev
- Build: npm run build
- Start production: npm run start

Key facts

- Framework: Next.js 16 ([frontend/package.json])
- React: 19 ([frontend/package.json])
- Styling: Tailwind CSS (v4) configured via [frontend/postcss.config.mjs]
- Entry points: Next app directory under [frontend/app] (standard Next.js layout) and UI components in [frontend/components]
- Static assets: [frontend/public]

Important files and folders

- [frontend/package.json] — scripts and dependencies
- [frontend/next.config.mjs] — Next.js config
- [frontend/lib/supabase.ts] — Supabase client (uses env vars NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY)
- [frontend/lib/hooks/useGridLayout.ts] — Main grid/widget layout hook used across pages
- [frontend/lib/] — utility functions, types, and smaller hooks
- [frontend/components/] — UI components, organized by feature
- [frontend/public/] — images and static assets

Environment variables

The app expects the following environment variables (use .env.local for local development):

- NEXT_PUBLIC_SUPABASE_URL — Supabase project URL (public)
- NEXT_PUBLIC_SUPABASE_ANON_KEY — Supabase anon key (public-facing key)

Security note: Do NOT commit any private keys or secrets. Only public keys prefixed NEXT_PUBLIC_ should be exposed to the browser. Put server-only secrets (if any) in server-side env vars (no NEXT_PUBLIC_ prefix) and never commit .env files.

Conventions and expectations

- Immutability: Do not mutate objects in-place — always return new copies (see global coding-style rules).
- Small files: Prefer many small focused files (200–400 lines), keep files <800 lines.
- Error handling: Validate inputs at boundaries and handle errors explicitly.
- No hardcoded secrets: Use env vars or a secret manager.
- Accessibility: Keep components accessible (semantic elements, aria where needed).

Testing and workflow

- Follow TDD: write tests first. Project currently has no tests; add unit and integration tests where features are added.
- Minimum test coverage target: 80% (see global testing rules).
- Git commits: Follow conventional commit format (feat/fix/docs/etc.). Run code review and security checks before pushing.

Notes for contributors

- If you add new persistent settings, prefer schema-based validation and store only non-sensitive data in localStorage.
- When adding new widgets/components, register and document default layout/text in [frontend/lib/hooks/useGridLayout.ts].
- Run lint/format hooks (if configured) and ensure you don't introduce eslint/format violations.

Where to look for help

- Look at the lib/ folder and the main layout hooks for patterns used across the app.
- If you need to change supabase usage, update [frontend/lib/supabase.ts] and ensure environment variables are handled correctly.

This file is a living document — please update it when you add new conventions, env vars, or major architectural changes.