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
