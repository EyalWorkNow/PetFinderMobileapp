create extension if not exists pgcrypto;
create extension if not exists vector;

create table if not exists users (
  id text primary key,
  email text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  type text not null check (type in ('LOST', 'FOUND')),
  pet_type text not null check (pet_type in ('DOG', 'CAT', 'PARROT', 'OTHER')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'RESOLVED', 'EXPIRED')),
  title text not null,
  short_desc text,
  size text not null default 'UNKNOWN' check (size in ('S', 'M', 'L', 'UNKNOWN')),
  colors text[] not null default '{}',
  collar boolean not null default false,
  collar_color text,
  breed text,
  marks_text text,
  last_seen_lat double precision not null,
  last_seen_lng double precision not null,
  last_seen_label text,
  last_seen_time timestamptz not null,
  radius_km double precision not null,
  contact_method text not null check (contact_method in ('PHONE', 'WHATSAPP', 'IN_APP')),
  contact_phone text,
  hide_phone boolean not null default true,
  reveal_phone_on_contact boolean not null default false,
  show_approximate_location boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_posts_type_pet_status on posts(type, pet_type, status);
create index if not exists idx_posts_last_seen_time on posts(last_seen_time desc);
create index if not exists idx_posts_location on posts(last_seen_lat, last_seen_lng);

create table if not exists post_photos (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  storage_path text not null,
  taken_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_post_photos_post_id on post_photos(post_id);

create table if not exists post_embeddings (
  post_id uuid primary key references posts(id) on delete cascade,
  embedding vector(1536) not null,
  embedding_provider text not null,
  caption text,
  created_at timestamptz not null default now()
);

create index if not exists idx_post_embeddings_ivfflat
  on post_embeddings using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create table if not exists sightings (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  label text,
  seen_at timestamptz not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_sightings_post_id on sightings(post_id);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  post_a uuid not null references posts(id) on delete cascade,
  post_b uuid not null references posts(id) on delete cascade,
  score double precision not null,
  created_at timestamptz not null default now(),
  notified boolean not null default false,
  unique (post_a, post_b),
  check (post_a <> post_b)
);

create index if not exists idx_matches_score on matches(score desc);

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  from_user_id text not null references users(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_contact_messages_post_id on contact_messages(post_id);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  reporter_user_id text not null references users(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_reports_post_id on reports(post_id);

create table if not exists push_tokens (
  user_id text not null references users(id) on delete cascade,
  expo_token text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, expo_token)
);

create table if not exists push_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  match_id uuid not null references matches(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_push_deliveries_user_created on push_deliveries(user_id, created_at desc);
