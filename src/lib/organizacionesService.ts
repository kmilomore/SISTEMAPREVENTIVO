import { supabase } from './supabase'
import type { Organizacion, TipoReunion } from '../types/actas'

const TABLE = 'organizaciones'

export async function fetchOrganizaciones(): Promise<{
  data: Organizacion[]
  error: string | null
}> {
  if (!supabase) return { data: [], error: 'Supabase no inicializado.' }

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('nombre', { ascending: true })

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as Organizacion[], error: null }
}

export async function insertOrganizacion(org: {
  tipo: TipoReunion
  tipo_otro?: string
  nombre: string
  direccion?: string
  contacto_nombre?: string
  contacto_cargo?: string
  contacto_email?: string
  contacto_telefono?: string
}): Promise<{ data: Organizacion | null; error: string | null }> {
  if (!supabase) return { data: null, error: 'Supabase no inicializado.' }

  const payload = Object.fromEntries(
    Object.entries(org).filter(([, v]) => v !== undefined && v !== ''),
  )

  const { data, error } = await supabase
    .from(TABLE)
    .insert([payload])
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Organizacion, error: null }
}

export async function updateOrganizacion(
  id: string,
  org: Partial<Omit<Organizacion, 'id' | 'created_at' | 'updated_at'>>,
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase no inicializado.' }

  const { error } = await supabase.from(TABLE).update(org).eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}
