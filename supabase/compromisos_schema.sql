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
create or replace trigger compromisos_set_updated_at
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

-- ── Trigger: acta nueva → compromisos automáticos ───────────────────────────
--
-- Cada vez que se inserta un acta en actas_visita, este trigger lee el array
-- acuerdos (JSONB) y crea un registro en compromisos por cada elemento.
-- No se dispara en UPDATE para no pisar cambios de estado ya hechos en el
-- módulo de compromisos.

create or replace function public.sync_acuerdos_to_compromisos()
returns trigger
language plpgsql
as $$
begin
  insert into public.compromisos (
    acta_id,
    acta_folio,
    establecimiento_id,
    establecimiento_nombre,
    establecimiento_comuna,
    descripcion,
    responsable,
    plazo,
    estado,
    created_at,
    updated_at
  )
  select
    new.id,
    new.folio,
    new.establecimiento_id,
    coalesce(new.establecimiento_nombre, ''),
    coalesce(new.establecimiento_comuna, ''),
    acuerdo->>'descripcion',
    nullif(trim(acuerdo->>'responsable'), ''),
    case
      when acuerdo->>'plazo' ~ '^\d{4}-\d{2}-\d{2}$'
      then (acuerdo->>'plazo')::date
      when acuerdo->>'plazo' ~ '^\d{2}/\d{2}/\d{4}$'
      then to_date(acuerdo->>'plazo', 'DD/MM/YYYY')
      when acuerdo->>'plazo' ~ '^\d{2}-\d{2}-\d{4}$'
      then to_date(acuerdo->>'plazo', 'DD-MM-YYYY')
      else null
    end,
    case
      when acuerdo->>'estado' in ('Pendiente', 'En proceso', 'Cumplido', 'Vencido')
      then acuerdo->>'estado'
      else 'Pendiente'
    end,
    new.created_at,
    new.updated_at
  from jsonb_array_elements(new.acuerdos) as acuerdo
  where trim(acuerdo->>'descripcion') <> '';

  return new;
end;
$$;

create or replace trigger trg_actas_visita_sync_compromisos
  after insert on public.actas_visita
  for each row execute function public.sync_acuerdos_to_compromisos();

-- ── Migración inicial: acuerdos de actas_visita → compromisos ────────────────
--
-- Lee el campo acuerdos (JSONB array) de cada acta y crea un registro en
-- compromisos por cada elemento. Solo se ejecuta si la tabla compromisos
-- está vacía, evitando duplicados en ejecuciones posteriores.
--
-- Estructura de cada elemento en acuerdos:
--   { descripcion, responsable?, plazo?, estado }
--   estado: 'Pendiente' | 'En proceso' | 'Cumplido'
--
-- El campo plazo en acuerdos puede venir en formato ISO (YYYY-MM-DD) o
-- formato chileno (DD/MM/YYYY). Ambos se convierten a date. Cualquier otro
-- texto libre queda NULL.

do $$
begin
  if (select count(*) from public.compromisos) = 0 then

    insert into public.compromisos (
      acta_id,
      acta_folio,
      establecimiento_id,
      establecimiento_nombre,
      establecimiento_comuna,
      descripcion,
      responsable,
      plazo,
      estado,
      created_at,
      updated_at
    )
    select
      a.id,
      a.folio,
      a.establecimiento_id,
      coalesce(a.establecimiento_nombre, ''),
      coalesce(a.establecimiento_comuna, ''),
      acuerdo->>'descripcion',
      nullif(trim(acuerdo->>'responsable'), ''),
      case
        when acuerdo->>'plazo' ~ '^\d{4}-\d{2}-\d{2}$'
        then (acuerdo->>'plazo')::date
        when acuerdo->>'plazo' ~ '^\d{2}/\d{2}/\d{4}$'
        then to_date(acuerdo->>'plazo', 'DD/MM/YYYY')
        when acuerdo->>'plazo' ~ '^\d{2}-\d{2}-\d{4}$'
        then to_date(acuerdo->>'plazo', 'DD-MM-YYYY')
        else null
      end,
      case
        when acuerdo->>'estado' in ('Pendiente', 'En proceso', 'Cumplido', 'Vencido')
        then acuerdo->>'estado'
        else 'Pendiente'
      end,
      a.created_at,
      a.updated_at
    from public.actas_visita a
    cross join lateral jsonb_array_elements(a.acuerdos) as acuerdo
    where jsonb_array_length(a.acuerdos) > 0
      and trim(acuerdo->>'descripcion') <> '';

    raise notice 'Migración completada: % compromisos insertados.',
      (select count(*) from public.compromisos);

  else
    raise notice 'Tabla compromisos ya contiene datos — migración omitida.';
  end if;
end;
$$;

-- ── Row Level Security ────────────────────────────────────────────────────────

alter table public.compromisos enable row level security;
alter table public.comentarios_compromisos enable row level security;

drop policy if exists "lectura compromisos autenticados" on public.compromisos;
create policy "lectura compromisos autenticados"
  on public.compromisos
  for select
  to authenticated
  using (auth.uid() is not null);

drop policy if exists "actualizacion compromisos autenticados" on public.compromisos;
create policy "actualizacion compromisos autenticados"
  on public.compromisos
  for update
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "insercion compromisos autenticados" on public.compromisos;
create policy "insercion compromisos autenticados"
  on public.compromisos
  for insert
  to authenticated
  with check (auth.uid() is not null);

drop policy if exists "lectura comentarios autenticados" on public.comentarios_compromisos;
create policy "lectura comentarios autenticados"
  on public.comentarios_compromisos
  for select
  to authenticated
  using (auth.uid() is not null);

drop policy if exists "insercion comentarios autenticados" on public.comentarios_compromisos;
create policy "insercion comentarios autenticados"
  on public.comentarios_compromisos
  for insert
  to authenticated
  with check (auth.uid() is not null);
