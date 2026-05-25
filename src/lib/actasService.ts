import { getSession, supabase } from '../lib/supabase'
import type { ActaVisita, ActaVisitaRow } from '../types/actas'

const TABLE = 'actas_visita'

export async function fetchActas(): Promise<{ data: ActaVisitaRow[]; error: string | null }> {
  if (!supabase) return { data: [], error: 'Supabase no inicializado.' }

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('fecha_visita', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as ActaVisitaRow[], error: null }
}

export async function insertActa(
  acta: Omit<ActaVisita, 'id' | 'created_at' | 'updated_at' | 'pdf_path' | 'pdf_url'>,
): Promise<{ id: string | null; folio: string | null; error: string | null }> {
  if (!supabase) return { id: null, folio: null, error: 'Supabase no inicializado.' }

  const session = await getSession()
  const userId = session?.user?.id ?? null

  if (!userId) {
    return {
      id: null,
      folio: null,
      error: 'Debes iniciar sesion con una cuenta autorizada antes de registrar actas.',
    }
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert([{ ...acta, created_by: userId, estado: 'Registrada' }])
    .select('id, folio')
    .single()

  if (error) {
    const isRlsError = /row-level security policy|violates row level security policy/i.test(error.message)

    return {
      id: null,
      folio: null,
      error: isRlsError
        ? 'Supabase bloqueo la creacion del acta por RLS. Verifica que la sesion siga activa y que tu correo este habilitado en public.usuarios_autorizados.'
        : error.message,
    }
  }

  return { id: (data as { id: string; folio: string }).id, folio: (data as { id: string; folio: string }).folio, error: null }
}

export async function updateActaPdf(
  id: string,
  pdf_path: string,
  pdf_url: string,
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase no inicializado.' }

  const { error } = await supabase
    .from(TABLE)
    .update({ pdf_path, pdf_url })
    .eq('id', id)

  if (error) return { error: error.message }
  return { error: null }
}

export async function updateActaEstado(
  id: string,
  estado: string,
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase no inicializado.' }

  const { error } = await supabase.from(TABLE).update({ estado }).eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}

export async function updateActaAsistencia(
  id: string,
  asistencia_path: string,
  asistencia_url: string,
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase no inicializado.' }

  const { error } = await supabase
    .from(TABLE)
    .update({ asistencia_path, asistencia_url })
    .eq('id', id)

  if (error) return { error: error.message }
  return { error: null }
}
