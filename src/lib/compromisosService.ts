import { supabase } from './supabase'
import type { Compromiso, ComentarioCompromiso, EstadoCompromiso } from '../types/compromisos'

type RawCompromiso = Omit<Compromiso, 'comentarios'> & {
  comentarios_compromisos: ComentarioCompromiso[]
}

export async function fetchCompromisos(): Promise<{
  data: Compromiso[]
  error: string | null
}> {
  if (!supabase) return { data: [], error: 'Supabase no inicializado.' }

  const { data, error } = await supabase
    .from('compromisos')
    .select(`
      *,
      comentarios_compromisos (
        id,
        compromiso_id,
        texto,
        autor,
        created_at
      )
    `)
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: error.message }

  const mapped: Compromiso[] = (data as RawCompromiso[]).map((row) => ({
    ...row,
    comentarios: (row.comentarios_compromisos ?? []).sort((a, b) =>
      a.created_at.localeCompare(b.created_at),
    ),
  }))

  return { data: mapped, error: null }
}

export async function updateCompromisoEstado(
  id: string,
  estado: EstadoCompromiso,
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase no inicializado.' }

  const { error } = await supabase
    .from('compromisos')
    .update({ estado, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
  return { error: null }
}

export async function addComentario(
  compromiso_id: string,
  texto: string,
  autor: string,
): Promise<{ data: ComentarioCompromiso | null; error: string | null }> {
  if (!supabase) return { data: null, error: 'Supabase no inicializado.' }

  const { data, error } = await supabase
    .from('comentarios_compromisos')
    .insert([{ compromiso_id, texto, autor }])
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as ComentarioCompromiso, error: null }
}
