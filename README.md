# PetFind MVP

PetFind is a lost-and-found pet MVP with:
- Expo React Native mobile app (`apps/mobile`)
- Fastify TypeScript API (`apps/api`)
- Shared schemas/scoring utilities (`packages/shared`)

It runs end-to-end in local mock mode (no external keys required), and upgrades to real Supabase/OpenAI when env vars are provided.

## Monorepo Layout
- `apps/mobile`: Auth, onboarding splash, create post wizard, map browse, post details, matches, profile, settings.
- `apps/api`: Fastify REST API, matching engine, push notifications, Supabase JWT verification, migrations, seed.
- `packages/shared`: zod schemas + scoring (`visual/attributes/geo/time`) + unit tests.

## Prerequisites
- Node.js 20+
- pnpm 10+
- Expo CLI (via `pnpm dev:mobile` scripts)
- Optional for production-like setup:
  - Supabase project (Auth + Postgres + Storage)
  - OpenAI API key

## Install
```bash
pnpm install
```

## Environment Setup
### API
Copy and edit:
```bash
cp apps/api/.env.example apps/api/.env
```

### Mobile
Copy and edit:
```bash
cp apps/mobile/.env.example apps/mobile/.env
```

## Supabase Setup
1. Create a Supabase project.
2. In SQL editor, run migration:
   - `apps/api/migrations/001_init.sql`
3. Enable Auth providers you want (email/password and phone OTP).
4. Create a Storage bucket for post photos (optional for MVP; local URI references also work).
5. Set API env vars:
   - `DATABASE_URL` (Supabase Postgres connection string)
   - `SUPABASE_URL`
   - `SUPABASE_JWT_AUDIENCE=authenticated`
6. Set mobile env vars:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Run Locally
### Run API only
```bash
pnpm dev:api
```
API default: `http://localhost:4000`

### Run mobile only
```bash
pnpm dev:mobile
```
Then use Expo options to launch iOS/Android.

### Run both
```bash
pnpm dev
```

## Seed Sample Data
### In-memory mode (no `DATABASE_URL`)
- Demo posts auto-seed on API boot when `AUTO_SEED_DEMO=true`.

### Postgres mode
1. Apply migration.
2. Run:
```bash
pnpm seed
```

## Lint, Typecheck, Test
```bash
pnpm lint
pnpm typecheck
pnpm test
```

## Matching Logic
Score formula:
```text
score = 0.45*visual + 0.25*attributes + 0.20*geo + 0.10*time
```

- `visual`: cosine similarity of embeddings
- `attributes`: weighted size/color/collar/breed/marks
- `geo`: exponential decay by distance + radius
- `time`: recency + time-overlap decay

Thresholds:
- `>= 0.85`: high match + push notification
- `0.75–0.85`: possible match (in-app list only)

Push throttle:
- max `3/day/user`

## Embedding Providers
- Provider A (`openai` / `auto` with key): caption text + `text-embedding-3-small`
- Provider B (`mock`): deterministic local token-hash embedding (no external API)

## API Endpoints (MVP)
- `POST /auth/verify`
- `POST /posts`
- `GET /posts`
- `GET /posts/:id`
- `POST /posts/:id/sightings`
- `POST /posts/:id/contact`
- `POST /posts/:id/report`
- `POST /posts/:id/resolve`
- `GET /matches`
- `POST /push/register-token`
- `GET /profile/posts`

## MVP Assumptions
- Photo upload in MVP stores URI/storage references; direct binary upload pipeline can be added later.
- Google Places is optional; fallback text location label is always available.
- If Supabase keys are missing in mobile, app uses local demo auth session.
- If API `DATABASE_URL` is missing, API runs fully in memory for local demos.
- OpenAI vision captioning is represented by structured caption text in this MVP (pluggable provider kept modular).

## 3-Minute Demo Script
1. Start API and mobile (`pnpm dev`).
2. Open map screen and show seeded pins.
3. Go to Create -> publish a LOST dog post with one photo.
4. Open Matches and show HIGH/POSSIBLE match generated.
5. Open Post Details -> send contact message.
6. Open Profile -> mark post as resolved.
7. Open Settings -> toggle privacy and notification preferences.

