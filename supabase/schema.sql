create extension if not exists pgcrypto;

create table if not exists public.establishments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  commune text not null,
  category text not null,
  address text,
  director_name text,
  staff_count integer not null default 0,
  student_count integer not null default 0,
  risk_index numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  visit_date date not null,
  visit_type text not null,
  inspector_name text not null,
  status text not null check (status in ('Programada', 'Ejecutada', 'Reprogramada')),
  scope text not null,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meeting_minutes (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  code text not null unique,
  session_date date not null,
  topic text not null,
  status text not null check (status in ('Abierta', 'EnCurso', 'Cerrada')),
  agreements_count integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.observations (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid references public.visits(id) on delete set null,
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  title text not null,
  detail text,
  risk_level text not null check (risk_level in ('Bajo', 'Medio', 'Alto', 'Critico')),
  status text not null check (status in ('Pendiente', 'EnCurso', 'Resuelta')),
  assigned_to text,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.action_plans (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid not null references public.observations(id) on delete cascade,
  measure text not null,
  owner_name text not null,
  due_date date not null,
  progress integer not null default 0 check (progress between 0 and 100),
  evidence_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.establishments enable row level security;
alter table public.visits enable row level security;
alter table public.meeting_minutes enable row level security;
alter table public.observations enable row level security;
alter table public.action_plans enable row level security;

create policy if not exists "authenticated establishments access"
  on public.establishments
  for all
  to authenticated
  using (true)
  with check (true);

create policy if not exists "authenticated visits access"
  on public.visits
  for all
  to authenticated
  using (true)
  with check (true);

create policy if not exists "authenticated meeting minutes access"
  on public.meeting_minutes
  for all
  to authenticated
  using (true)
  with check (true);

create policy if not exists "authenticated observations access"
  on public.observations
  for all
  to authenticated
  using (true)
  with check (true);

create policy if not exists "authenticated action plans access"
  on public.action_plans
  for all
  to authenticated
  using (true)
  with check (true);
