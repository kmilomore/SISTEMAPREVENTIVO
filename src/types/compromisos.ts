export type EstadoCompromiso = 'Pendiente' | 'En proceso' | 'Cumplido' | 'Vencido'

export interface ComentarioCompromiso {
  id: string
  texto: string
  autor: string
  fecha: string
}

export interface Compromiso {
  id: string
  acta_id?: string
  acta_folio?: string
  establecimiento_id: string
  establecimiento_nombre: string
  establecimiento_comuna: string
  descripcion: string
  responsable?: string
  plazo?: string
  estado: EstadoCompromiso
  comentarios: ComentarioCompromiso[]
  created_at: string
  updated_at: string
}
