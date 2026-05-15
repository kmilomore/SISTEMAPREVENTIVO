# CRM Prevencion SLEP Colchagua

Aplicacion base para gestionar actas, visitas en terreno, observaciones de riesgo, planes de accion y analitica operativa de la Unidad de Prevencion de Riesgos.

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Supabase JS

## Puesta en marcha

1. Instala dependencias con `npm install`.
2. Crea un archivo `.env.local` a partir de `.env.example`.
3. Ejecuta `npm run dev` para desarrollo.
4. Ejecuta `npm run build` para compilacion de produccion.

## Variables de entorno

El frontend usa solo credenciales publicas:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

La service role no debe exponerse en React. Si necesitas procesos privilegiados, usalos en Edge Functions o un backend propio.

## Autenticacion Google y RLS

El portal ahora asume acceso autenticado. Antes de usarlo en produccion:

1. Ejecuta `supabase/base_datos_escuelas_slep_schema.sql`.
2. Ejecuta `supabase/actas_visita_migration.sql`.
3. Ejecuta `supabase/compromisos_schema.sql`.
4. Ejecuta `supabase/auth_google_rls_setup.sql` para crear `public.usuarios`, sincronizar perfiles con `auth.users` y cerrar el acceso `anon` con RLS.
5. En Supabase Dashboard, entra a `Authentication > Providers > Google`, habilita Google y configura el Client ID `612384585191-eri41d43h579pb77hcggfp2pa9sphph4.apps.googleusercontent.com`.
6. Completa tambien el Client Secret de Google en Supabase. Sin ese secreto el login OAuth no funcionara.
7. En Google Cloud Console, registra como redirect URI `https://osbkiydklibdpmqjpovq.supabase.co/auth/v1/callback`.

La tabla `public.usuarios` queda ligada a `auth.users` mediante un trigger `SECURITY DEFINER` y expone solo el perfil del usuario autenticado.

## Estructura inicial

- `src/App.tsx`: entrada minima de la aplicacion.
- `src/app/`: shell, rutas y navegacion por paginas.
- `src/pages/`: paginas funcionales del sistema.
- `src/lib/supabase.ts`: cliente y estado de configuracion de Supabase.
- `src/data/mockData.ts`: datos demo para trabajar sin backend.
- `supabase/base_datos_escuelas_slep_schema.sql`: crea la tabla fuente requerida por el SQL entregado.
- `supabase/schema.sql`: modelo base normalizado para el CRM.

## Modulos contemplados

- Base de datos e importacion inicial
- Actas y compromisos
- Visitas de observacion
- Observaciones y hallazgos
- Planes de accion correctiva
- Analisis de datos y seguimiento de KPIs

## Carga del archivo SQL entregado

1. Ejecuta `supabase/base_datos_escuelas_slep_schema.sql` en el SQL Editor de Supabase.
2. Ejecuta despues `public/BASE DE DATOS ESCUELAS SLEP_rows.sql`.
3. Usa esa tabla como fuente cruda para posteriores procesos de normalizacion.
# SISTEMAPREVENTIVO
