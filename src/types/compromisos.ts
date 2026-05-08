export type EstadoCompromiso = 'Pendiente' | 'En proceso' | 'Cumplido' | 'Vencido'

export interface ComentarioCompromiso {
  id: string
  compromiso_id: string
  texto: string
  autor: string
  created_at: string
}

export interface Compromiso {
  id: string
  acta_id?: string | null
  acta_folio?: string | null
  establecimiento_id: string
  establecimiento_nombre: string
  establecimiento_comuna: string
  descripcion: string
  responsable?: string | null
  plazo?: string | null
  estado: EstadoCompromiso
  comentarios: ComentarioCompromiso[]
  created_at: string
  updated_at: string
}
