import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  fs
    .readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((line) => !line.startsWith('#'))
    .map((line) => {
      const separatorIndex = line.indexOf('=')
      return [line.slice(0, separatorIndex), line.slice(separatorIndex + 1)]
    }),
)

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

const schoolsResult = await supabase
  .from('BASE DE DATOS ESCUELAS SLEP')
  .select('"N°", RBD, "NOMBRE ESTABLECIMIENTO"')
  .limit(5)

const actasResult = await supabase
  .from('actas_visita')
  .select('id, folio, establecimiento_id, establecimiento_rbd, establecimiento_nombre, acuerdos')
  .limit(20)

console.log(
  JSON.stringify(
    {
      schools: schoolsResult.data,
      schoolsError: schoolsResult.error?.message ?? null,
      actas: actasResult.data,
      actasError: actasResult.error?.message ?? null,
    },
    null,
    2,
  ),
)