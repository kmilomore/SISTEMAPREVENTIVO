-- ──────────────────────────────────────────────────────────────────────────────
-- Módulo: Compromisos
-- Descripción: Compromisos impuestos a establecimientos educacionales del SLEP
--              Colchagua, con historial de seguimiento normalizado en tabla
--              separada (comentarios_compromisos).
--
-- Prerequisito: la tabla public.actas_visita debe existir antes de ejecutar
--               este script si se desea la FK de integridad con actas.
--               Si aún no existe, reemplaza la referencia FK por un campo text.
-- ──────────────────────────────────────────────────────────────────────────────

-- ── Función reutilizable para auto-actualizar updated_at ─────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ── Tabla: compromisos ────────────────────────────────────────────────────────

create table if not exists public.compromisos (
  id                     uuid        primary key default gen_random_uuid(),
  acta_id                uuid        references public.actas_visita(id) on delete set null,
  acta_folio             text,
  establecimiento_id     text        not null,
  establecimiento_nombre text        not null,
  establecimiento_comuna text        not null,
  descripcion            text        not null,
  responsable            text,
  plazo                  date,
  estado                 text        not null default 'Pendiente'
                           check (estado in ('Pendiente', 'En proceso', 'Cumplido', 'Vencido')),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- Índices de consulta frecuente
create index if not exists compromisos_estado_idx
  on public.compromisos (estado);

create index if not exists compromisos_acta_id_idx
  on public.compromisos (acta_id);

create index if not exists compromisos_establecimiento_id_idx
  on public.compromisos (establecimiento_id);

create index if not exists compromisos_plazo_idx
  on public.compromisos (plazo)
  where plazo is not null;

-- Trigger: actualiza updated_at en cada UPDATE
create trigger compromisos_set_updated_at
  before update on public.compromisos
  for each row execute function public.set_updated_at();

-- ── Tabla: comentarios_compromisos ────────────────────────────────────────────

create table if not exists public.comentarios_compromisos (
  id              uuid        primary key default gen_random_uuid(),
  compromiso_id   uuid        not null references public.compromisos(id) on delete cascade,
  texto           text        not null,
  autor           text        not null default 'Unidad de Prevención',
  created_at      timestamptz not null default now()
);

-- Índice para recuperar todos los comentarios de un compromiso
create index if not exists comentarios_compromisos_compromiso_id_idx
  on public.comentarios_compromisos (compromiso_id);

-- ── Row Level Security ────────────────────────────────────────────────────────

alter table public.compromisos              enable row level security;
alter table public.comentarios_compromisos  enable row level security;

-- Lectura pública (anon) — ajustar según política de acceso real
create policy "compromisos_select_public"
  on public.compromisos
  for select
  using (true);

create policy "comentarios_compromisos_select_public"
  on public.comentarios_compromisos
  for select
  using (true);

-- Escritura solo para usuarios autenticados
create policy "compromisos_write_authenticated"
  on public.compromisos
  for all
  to authenticated
  using (true)
  with check (true);

create policy "comentarios_compromisos_write_authenticated"
  on public.comentarios_compromisos
  for all
  to authenticated
  using (true)
  with check (true);
