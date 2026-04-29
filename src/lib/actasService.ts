import { supabase } from '../lib/supabase'
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

  const { data, error } = await supabase
    .from(TABLE)
    .insert([{ ...acta, estado: 'Registrada' }])
    .select('id, folio')
    .single()

  if (error) return { id: null, folio: null, error: error.message }
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
