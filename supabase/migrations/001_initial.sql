create extension if not exists "pgcrypto";

create type public.game_status as enum ('lobby', 'playing', 'finished');

create table public.games (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) = 4),
  status public.game_status not null default 'lobby',
  host_player_id uuid,
  max_players smallint not null check (max_players between 2 and 4),
  loser_task text not null check (char_length(trim(loser_task)) > 0),
  stop_at_first_loser boolean not null default true,
  laundry_enabled boolean not null default true,
  jack_bonus_enabled boolean not null default true,
  state jsonb not null default '{}'::jsonb,
  version bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  session_hash text not null unique,
  name text not null check (char_length(name) between 1 and 18),
  avatar text not null,
  score smallint not null default 0 check (score >= 0),
  ready boolean not null default false,
  active boolean not null default true,
  seat smallint not null,
  hand_ciphertext text,
  created_at timestamptz not null default now(),
  unique (game_id, seat)
);

alter table public.games
  add constraint games_host_player_fk
  foreign key (host_player_id) references public.players(id) deferrable initially deferred;

create table public.game_events (
  id bigint generated always as identity primary key,
  game_id uuid not null references public.games(id) on delete cascade,
  player_id uuid references public.players(id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index game_events_game_id_id_idx on public.game_events(game_id, id);
alter table public.games enable row level security;
alter table public.players enable row level security;
alter table public.game_events enable row level security;

-- Productie: schrijf spelacties alleen via een Edge Function/service role.
-- De functie controleert beurt, kleur, kaartbezit en versienummer in één transactie.
alter publication supabase_realtime add table public.games, public.game_events;
