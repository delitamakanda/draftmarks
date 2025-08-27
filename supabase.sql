-- Bookmarks
create table if not exists public.bookmarks (
    id text primary key,
    user_id text not null,
    url text not null,
    domain text not null,
    title text,
    description text,
    og_image_url text,
    favicon_url text,
    tags text[] default '{}',
    gmail_draft_id text not null,
    gmail_message_id text,
    gmail_created_at timestamptz,
    status text not null default 'fresh',
    added_at timestamptz not null default now(),
    last_seen_at timestamptz not null default now()
);


-- OAuth tokens par session
create table if not exists public.oauth_tokens (
   session_id text primary key,
   user_id text not null,
   access_token text not null,
   refresh_token text,
   expires_at bigint not null
);


-- Sessions
create table if not exists public.sessions (
   session_id text primary key,
   user_id text not null,
   created_at timestamptz not null default now()
);


-- Index utiles
create index if not exists idx_bookmarks_user on public.bookmarks(user_id);
create index if not exists idx_bookmarks_domain on public.bookmarks(domain);
create index if not exists idx_bookmarks_added on public.bookmarks(added_at desc);


-- Active RLS (le service role key bypass)
alter table public.bookmarks enable row level security;
alter table public.oauth_tokens enable row level security;
alter table public.sessions enable row level security;
