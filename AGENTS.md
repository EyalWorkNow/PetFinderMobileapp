# AGENTS.md — PetFind Developer Reference

## Repo Structure

```
petfined/
├── apps/
│   ├── api/          # Fastify (Node.js/TypeScript) REST API
│   │   ├── src/
│   │   │   ├── app.ts             # All route definitions
│   │   │   ├── config.ts          # Zod-parsed environment config
│   │   │   ├── auth/              # JWT auth service (Supabase + dev-bypass)
│   │   │   ├── db/                # Repository interface + InMemory + Postgres impls
│   │   │   ├── embeddings/        # Mock + OpenAI embedding providers
│   │   │   ├── notifications/     # Expo Push notification service
│   │   │   ├── services/          # PostService (business logic, matching)
│   │   │   ├── seed-data.ts       # Demo data definitions
│   │   │   └── seed.ts            # Seed script entry point
│   │   ├── migrations/
│   │   │   └── 001_init.sql       # Full Supabase-compatible migration
│   │   └── test/
│   │       └── posts.integration.test.ts
│   │
│   └── mobile/       # Expo React Native app (TypeScript)
│       ├── App.tsx                # Root: auth-gate + push setup
│       ├── src/
│       │   ├── components/ui.tsx  # AppButton, AppCard, AppInput, colors
│       │   ├── context/           # AuthContext, SettingsContext
│       │   ├── lib/               # api.ts, config.ts, push.ts, supabase.ts
│       │   ├── navigation/        # AppNavigator, route types
│       │   ├── screens/           # All 9 screens
│       │   └── types/models.ts    # TypeScript shapes for API responses
│       └── .env.example
│
└── packages/
    └── shared/       # Shared Zod schemas, types, scoring engine
        ├── src/
        │   ├── schemas.ts  # createPostSchema, queryPostsSchema, etc.
        │   ├── types.ts    # PostType, PetType, PostStatus, etc.
        │   └── scoring.ts  # scoreMatch + component functions
        └── test/
            └── scoring.test.ts
```

---

## Prerequisites

- **Node.js 20+** (`nvm use 20` or `brew install node@20`)
- **pnpm 10+** (`npm install -g pnpm`)
- **Expo Go** app (iOS App Store / Google Play) — SDK 54

---

## Installation

```bash
pnpm install
```

---

## Running the API

```bash
# In-memory mode (no DB needed, auto-seeds demo data)
pnpm dev:api

# Verify: curl http://localhost:4000/health
# Expected: {"ok":true}
```

---

## Running the Mobile App

> **Requires Node 20** due to `Array.prototype.toReversed` (Metro bundler dependency).

```bash
# From repo root
source ~/.nvm/nvm.sh && nvm use 20 && cd apps/mobile && echo "y" | npx expo start --tunnel
```

- Scan QR with **Expo Go** on your device
- In demo mode (no Supabase keys), tap **"Continue in demo mode"** on the Auth screen

### iOS Simulator
```bash
cd apps/mobile && npx expo start --tunnel
# Press `i` in the terminal to open iOS simulator
```

---

## Running Tests

```bash
# All packages
pnpm test

# Shared scoring unit tests (4 tests)
pnpm --filter @petfind/shared test

# API integration test (creates posts → generates matches)
pnpm --filter @petfind/api test
```

---

## Lint / Typecheck

```bash
# All packages
pnpm typecheck

# Individual
pnpm --filter @petfind/api lint
pnpm --filter @petfind/mobile lint
```

---

## Seeding Demo Data

```bash
# Seed with in-memory API running (auto-seeds on startup in dev mode)
pnpm seed
```

> In dev mode without `DATABASE_URL`, the API auto-seeds demo data on startup (`AUTO_SEED_DEMO=true`).

---

## Environment Variables

### `apps/api/.env`
```env
PORT=4000
DATABASE_URL=                      # leave blank for in-memory mode
SUPABASE_URL=                      # optional; enables JWT verification
SUPABASE_JWT_AUDIENCE=authenticated
OPENAI_API_KEY=                    # optional; enables real embeddings
EMBEDDING_PROVIDER=auto            # auto | openai | mock
DEV_AUTH_BYPASS=true               # send x-user-id header for auth in dev
AUTO_SEED_DEMO=true                # seed demo posts on startup (in-memory only)
```

### `apps/mobile/.env`
```env
EXPO_PUBLIC_API_URL=http://localhost:4000
EXPO_PUBLIC_SUPABASE_URL=          # optional; enables Supabase auth
EXPO_PUBLIC_SUPABASE_ANON_KEY=     # optional
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY= # optional; fallback text label used
```

---

## Supabase Setup (Production)

1. Create a project at [supabase.com](https://supabase.com)
2. Enable the `pgvector` extension: **Database → Extensions → vector**
3. Run the migration: **SQL Editor → paste `apps/api/migrations/001_init.sql`**
4. Enable Auth providers (Email, Phone/SMS)
5. Copy **Project URL** and **anon key** to your `.env` files
6. Set `DEV_AUTH_BYPASS=false` in the API env

---

## Matching Algorithm

`score = 0.45×visual + 0.25×attributes + 0.20×geo + 0.10×time`

- **visual**: cosine similarity between post embeddings (mock/OpenAI)
- **attributes**: weighted match on size/color/collar/breed/marks
- **geo**: exponential decay with Haversine distance
- **time**: recency + overlap decay over 72h window
- Score ≥ 0.85 → push notification; 0.75–0.85 → in-app only
