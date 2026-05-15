-- Configuración de autenticación y RLS para el portal.
-- Ejecutar después de:
--   1) supabase/base_datos_escuelas_slep_schema.sql
--   2) supabase/actas_visita_migration.sql
--   3) supabase/compromisos_schema.sql
--
-- Nota importante:
-- La activación del proveedor Google en Supabase requiere Client ID y Client Secret.
-- Client ID solicitado para este proyecto:
--   612384585191-eri41d43h579pb77hcggfp2pa9sphph4.apps.googleusercontent.com
--
-- Importante:
-- public.usuarios se alimenta desde auth.users.
-- Un usuario aparecerá aquí solo después de existir en auth.users,
-- normalmente tras completar su primer inicio de sesión con Google.
--
-- La whitelist inicial queda en public.usuarios_autorizados.
-- Esa tabla sí puede poblarse antes del primer login.

create extension if not exists pgcrypto;

create table if not exists public.usuarios_autorizados (
  email text primary key,
  nombre_referencia text,
  rol text not null default 'admin' check (rol in ('admin', 'usuario')),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.usuarios_autorizados (email, nombre_referencia, rol, activo)
values
  ('eduardo.soto@slepcolchagua.cl', 'Eduardo Soto', 'admin', true),
  ('camilo.serra@slepcolchagua.cl', 'Camilo Serra', 'admin', true)
on conflict (email) do update
set nombre_referencia = excluded.nombre_referencia,
    rol = excluded.rol,
    activo = excluded.activo;

create or replace function public.es_correo_autorizado(correo text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.usuarios_autorizados ua
    where lower(ua.email) = lower(coalesce(correo, ''))
      and ua.activo = true
  );
$$;

create or replace function public.usuario_actual_autorizado()
returns boolean
language sql
stable
as $$
  select public.es_correo_autorizado(auth.jwt() ->> 'email');
$$;

create table if not exists public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  nombre_completo text,
  avatar_url text,
  proveedor text not null default 'google',
  rol text not null default 'usuario' check (rol in ('admin', 'usuario')),
  ultimo_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists usuarios_set_updated_at on public.usuarios;
create trigger usuarios_set_updated_at
  before update on public.usuarios
  for each row execute function public.set_updated_at();

create or replace function public.handle_auth_user_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios (
    id,
    email,
    nombre_completo,
    avatar_url,
    rol,
    proveedor,
    ultimo_login_at
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', ''),
    case
      when public.es_correo_autorizado(coalesce(new.email, '')) then 'admin'
      else 'usuario'
    end,
    coalesce(new.raw_app_meta_data ->> 'provider', 'google'),
    now()
  )
  on conflict (id) do update
  set email = excluded.email,
      nombre_completo = excluded.nombre_completo,
      avatar_url = excluded.avatar_url,
      rol = case
        when public.es_correo_autorizado(excluded.email) then 'admin'
        else 'usuario'
      end,
      proveedor = excluded.proveedor,
      ultimo_login_at = now(),
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute function public.handle_auth_user_sync();

insert into public.usuarios (
  id,
  email,
  nombre_completo,
  avatar_url,
  rol,
  proveedor,
  ultimo_login_at
)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', ''),
  coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture', ''),
  case
    when public.es_correo_autorizado(coalesce(u.email, '')) then 'admin'
    else 'usuario'
  end,
  coalesce(u.raw_app_meta_data ->> 'provider', 'google'),
  now()
from auth.users u
on conflict (id) do update
set email = excluded.email,
    nombre_completo = excluded.nombre_completo,
    avatar_url = excluded.avatar_url,
    rol = case
      when public.es_correo_autorizado(excluded.email) then 'admin'
      else 'usuario'
    end,
    proveedor = excluded.proveedor,
    ultimo_login_at = now(),
    updated_at = now();

alter table public.usuarios enable row level security;

drop policy if exists "usuarios leen su perfil" on public.usuarios;
create policy "usuarios leen su perfil"
  on public.usuarios
  for select
  to authenticated
  using (id = auth.uid() and public.usuario_actual_autorizado());

drop policy if exists "usuarios insertan su perfil" on public.usuarios;
create policy "usuarios insertan su perfil"
  on public.usuarios
  for insert
  to authenticated
  with check (id = auth.uid() and public.usuario_actual_autorizado());

drop policy if exists "usuarios actualizan su perfil" on public.usuarios;
create policy "usuarios actualizan su perfil"
  on public.usuarios
  for update
  to authenticated
  using (id = auth.uid() and public.usuario_actual_autorizado())
  with check (id = auth.uid() and public.usuario_actual_autorizado());

alter table public."BASE DE DATOS ESCUELAS SLEP" enable row level security;

drop policy if exists "lectura escuelas autenticadas" on public."BASE DE DATOS ESCUELAS SLEP";
create policy "lectura escuelas autenticadas"
  on public."BASE DE DATOS ESCUELAS SLEP"
  for select
  to authenticated
  using (public.usuario_actual_autorizado());

alter table public.actas_visita alter column created_by set default auth.uid();
alter table public.actas_visita enable row level security;

drop policy if exists "lectura publica actas" on public.actas_visita;
drop policy if exists "insercion publica actas" on public.actas_visita;
drop policy if exists "actualizacion publica actas" on public.actas_visita;
drop policy if exists "lectura actas autenticadas" on public.actas_visita;
drop policy if exists "insercion actas autenticadas" on public.actas_visita;
drop policy if exists "actualizacion actas autenticadas" on public.actas_visita;

create policy "lectura actas autenticadas"
  on public.actas_visita
  for select
  to authenticated
  using (public.usuario_actual_autorizado());

create policy "insercion actas autenticadas"
  on public.actas_visita
  for insert
  to authenticated
  with check (public.usuario_actual_autorizado());

create policy "actualizacion actas autenticadas"
  on public.actas_visita
  for update
  to authenticated
  using (public.usuario_actual_autorizado())
  with check (public.usuario_actual_autorizado());

alter table public.compromisos enable row level security;
alter table public.comentarios_compromisos enable row level security;

drop policy if exists "lectura compromisos autenticados" on public.compromisos;
drop policy if exists "actualizacion compromisos autenticados" on public.compromisos;
drop policy if exists "insercion compromisos autenticados" on public.compromisos;
drop policy if exists "lectura comentarios autenticados" on public.comentarios_compromisos;
drop policy if exists "insercion comentarios autenticados" on public.comentarios_compromisos;

create policy "lectura compromisos autenticados"
  on public.compromisos
  for select
  to authenticated
  using (public.usuario_actual_autorizado());

create policy "actualizacion compromisos autenticados"
  on public.compromisos
  for update
  to authenticated
  using (public.usuario_actual_autorizado())
  with check (public.usuario_actual_autorizado());

create policy "insercion compromisos autenticados"
  on public.compromisos
  for insert
  to authenticated
  with check (public.usuario_actual_autorizado());

create policy "lectura comentarios autenticados"
  on public.comentarios_compromisos
  for select
  to authenticated
  using (public.usuario_actual_autorizado());

create policy "insercion comentarios autenticados"
  on public.comentarios_compromisos
  for insert
  to authenticated
  with check (public.usuario_actual_autorizado());

drop policy if exists "actas visita upload" on storage.objects;
create policy "actas visita upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'actas-visita' and public.usuario_actual_autorizado());

drop policy if exists "actas visita read" on storage.objects;
create policy "actas visita read"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'actas-visita' and public.usuario_actual_autorizado());