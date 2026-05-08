import { supabase } from './supabase'
import { crmData } from '../data/mockData'
import type { Compromiso, ComentarioCompromiso, EstadoCompromiso } from '../types/compromisos'

const TABLE = 'compromisos'

export async function fetchCompromisos(): Promise<{
  data: Compromiso[]
  error: string | null
  isMock: boolean
}> {
  if (!supabase) {
    return { data: crmData.compromisos, error: null, isMock: true }
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return { data: crmData.compromisos, error: null, isMock: true }
  }

  return { data: (data ?? []) as Compromiso[], error: null, isMock: false }
}

export async function updateCompromisoEstado(
  id: string,
  estado: EstadoCompromiso,
): Promise<{ error: string | null }> {
  if (!supabase) return { error: null }

  const { error } = await supabase
    .from(TABLE)
    .update({ estado, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
  return { error: null }
}

export async function updateCompromisoComentarios(
  id: string,
  comentarios: ComentarioCompromiso[],
): Promise<{ error: string | null }> {
  if (!supabase) return { error: null }

  const { error } = await supabase
    .from(TABLE)
    .update({ comentarios, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
  return { error: null }
}
