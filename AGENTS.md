# AGENTS.md

## Repo Structure
- `apps/mobile`: Expo React Native client (TypeScript).
- `apps/api`: Fastify TypeScript API, matching engine, push notifications, SQL migrations, seed scripts.
- `packages/shared`: Shared zod schemas, domain types, and scoring utilities.

## Install Dependencies
1. Ensure `pnpm` is installed (`corepack enable` recommended).
2. From repo root, run:
   - `pnpm install`

## Run Mobile App
1. Create `apps/mobile/.env` from `apps/mobile/.env.example`.
2. Start Expo:
   - `pnpm dev:mobile`
3. Run on device/emulator:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator

## Run API
1. Create `apps/api/.env` from `apps/api/.env.example`.
2. Start API:
   - `pnpm dev:api`
3. Health check:
   - `GET http://localhost:4000/health`

## Run Everything
- `pnpm dev`

## Lint, Typecheck, Tests
- Lint all workspaces: `pnpm lint`
- Typecheck all workspaces: `pnpm typecheck`
- Run tests all workspaces: `pnpm test`

## Seed Sample Data
### In-memory local dev mode
- If `DATABASE_URL` is not set, API auto-seeds demo posts at startup (`AUTO_SEED_DEMO=true` by default).

### Postgres/Supabase mode
1. Apply SQL migration at `apps/api/migrations/001_init.sql`.
2. Run:
   - `pnpm seed`

