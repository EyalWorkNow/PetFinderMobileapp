# PetFind 🐾

**Lost & Found Pets — Mobile MVP**

A React Native app that helps people report lost or found pets and get matched via image similarity, pet attributes, geographic radius, and time proximity.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20+ (`nvm use 20`) |
| pnpm | 10+ (`npm i -g pnpm`) |
| Expo Go (device) | SDK 54 (App Store / Play Store) |

---

## Quick Start (no external keys required)

```bash
# 1. Install
pnpm install

# 2. Start the API (in-memory, auto-seeds demo data)
pnpm dev:api

# 3. In a separate terminal — start the mobile app (requires Node 20)
source ~/.nvm/nvm.sh && nvm use 20
cd apps/mobile
echo "y" | npx expo start --tunnel

# 4. Scan the QR code with Expo Go on your phone
# 5. Tap "Continue in demo mode" on the Auth screen
```

---

## Supabase Setup (optional — for real auth + Postgres)

1. Create a project at [supabase.com](https://supabase.com)
2. **Database → Extensions** → enable `vector` (pgvector)
3. **SQL Editor** → paste and run `apps/api/migrations/001_init.sql`
4. Enable **Email** and/or **Phone (SMS)** auth providers
5. Copy project credentials to `.env` files:

### `apps/api/.env`
```env
PORT=4000
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_JWT_AUDIENCE=authenticated
OPENAI_API_KEY=sk-...          # optional — enables real image embeddings
EMBEDDING_PROVIDER=auto        # auto | openai | mock
DEV_AUTH_BYPASS=false          # set false when using real Supabase auth
AUTO_SEED_DEMO=false
```

### `apps/mobile/.env`
```env
EXPO_PUBLIC_API_URL=https://your-api-host.com
EXPO_PUBLIC_SUPABASE_URL=https://[ref].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=  # optional
```

---

## Running Tests

```bash
pnpm test               # all packages
pnpm --filter @petfind/shared test   # scoring unit tests (4)
pnpm --filter @petfind/api test      # integration test (create post → match)
```

## Lint / Typecheck

```bash
pnpm typecheck                        # all packages
pnpm --filter @petfind/api lint       # API strict TypeScript
pnpm --filter @petfind/mobile lint    # Mobile strict TypeScript
```

## Seeding Demo Data

```bash
pnpm seed   # seeds 3 posts: 2 matching beagles + 1 cat
```

> In dev mode (no `DATABASE_URL`), demo data is auto-seeded on API startup.

---

## Architecture

```
score = 0.45×visual + 0.25×attributes + 0.20×geo + 0.10×time
```

| Layer | Tech |
|-------|------|
| Mobile | Expo + React Navigation + TanStack Query + react-hook-form + zod |
| API | Fastify + TypeScript + zod |
| Database | Supabase Postgres + pgvector |
| Auth | Supabase Auth (email + phone OTP); dev-bypass via `x-user-id` header |
| Embeddings | Mock (default) or OpenAI `text-embedding-3-small` via caption |
| Push | Expo Push Notifications (≤3/day/user for HIGH matches) |

---

## Screens

| Screen | Description |
|--------|-------------|
| Splash | Logo + 1.2s timer |
| Auth | Email/password + Phone OTP + Demo mode |
| Map | Interactive map with LOST/FOUND pins + filters |
| Mode Select | Choose "I Lost" / "I Found" + pet type |
| Create Post Wizard | 5-step: photo → attributes → location/radius → contact/privacy → publish |
| Post Details | Photos, attributes, sightings, contact CTA, report button |
| Matches | HIGH / POSSIBLE match list with score badges |
| Profile | My posts, mark resolved, sign out |
| Settings | Notification prefs, privacy toggles |

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | Public | Health check |
| POST | `/auth/verify` | Bearer | Verify JWT + return user |
| POST | `/posts` | Bearer | Create post + trigger matching |
| GET | `/posts` | Optional | List posts with filters |
| GET | `/posts/:id` | Optional | Get post by ID |
| POST | `/posts/:id/sightings` | Bearer | Add sighting |
| POST | `/posts/:id/contact` | Bearer | Send in-app message |
| POST | `/posts/:id/report` | Bearer | Flag abuse |
| POST | `/posts/:id/resolve` | Owner only | Mark resolved |
| GET | `/matches` | Bearer | Current user's matches |
| GET | `/profile/posts` | Bearer | Current user's posts |
| POST | `/push/register-token` | Bearer | Register Expo push token |

---

## Demo Script (3 minutes)

1. **Start API**: `pnpm dev:api` — confirm `{"ok":true}` at `http://localhost:4000/health`
2. **Start mobile**: scan QR → tap **"Continue in demo mode"**
3. **Map tab**: see 3 pre-seeded pins (two beagles near Union Square, one cat in Chelsea)
4. **Tap a pin** → Post Details: attributes, sightings list, Contact/Report buttons
5. **Match tab**: shows HIGH match between the two beagle posts (~90% score)
6. **Create tab** → "I Found" + Dog → wizard through photo/attributes/location/contact → **Publish** → new pin appears on map

---

## MVP Assumptions

- Images are referenced by URI path (no upload to Supabase Storage in MVP; path stored as-is)
- Google Places API is optional; location is set via GPS or dragging a map pin
- OTP phone auth requires a Supabase phone provider (Twilio); demo mode bypasses auth entirely
- OpenAI key is optional; mock embeddings produce deterministic cosine similarity for demo/testing
- Push notifications require a physical device (not simulator)
