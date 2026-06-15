export type TipoActa = 'asesoria' | 'observacion' | 'reunion' | 'solicitud'

export type TipoReunion =
  | 'establecimiento'
  | 'organismo_publico'
  | 'empresa_privada'
  | 'ong'
  | 'equipo_interno'
  | 'otro'

export type EstadoActa = 'Registrada' | 'Registrada sin PDF' | 'Cerrada'

export type EstadoAcuerdo = 'Pendiente' | 'En proceso' | 'Cumplido'

export interface ParticipanteActa {
  nombre: string
  rol_estamento: string
  contacto?: string
}

export interface AcuerdoActa {
  descripcion: string
  responsable?: string
  plazo?: string
  estado: EstadoAcuerdo
}

export interface OrganizacionReunion {
  tipo: TipoReunion
  tipo_otro?: string
  nombre?: string
  direccion?: string
  contacto_nombre?: string
  contacto_cargo?: string
  contacto_email?: string
  contacto_telefono?: string
}

export interface Organizacion {
  id: string
  tipo: TipoReunion
  tipo_otro?: string
  nombre: string
  direccion?: string
  contacto_nombre?: string
  contacto_cargo?: string
  contacto_email?: string
  contacto_telefono?: string
  created_at?: string
  updated_at?: string
}

export interface ActaVisita {
  id?: string
  folio?: string
  tipo_acta: TipoActa
  tipo_reunion?: TipoReunion
  organizacion?: OrganizacionReunion
  organizacion_id?: string
  establecimiento_id: string
  establecimiento_nombre?: string
  establecimiento_rbd?: string
  establecimiento_comuna?: string
  fecha_visita: string
  hora_inicio: string
  hora_termino: string
  participantes: ParticipanteActa[]
  temas_anteriores?: string
  actividad_realizada?: string
  acuerdos: AcuerdoActa[]
  pdf_path?: string
  pdf_url?: string
  asistencia_path?: string
  asistencia_url?: string
  estado?: EstadoActa
  created_by?: string
  created_by_nombre?: string
  created_at?: string
  updated_at?: string
}

export interface ActaVisitaRow extends ActaVisita {
  id: string
  folio: string
  created_at: string
  updated_at: string
}

export interface EscuelaSLEP {
  'N°': number
  RBD: string
  'NOMBRE ESTABLECIMIENTO': string
  COMUNA: string
  TIPO: string
  'DIRECTOR/A': string
  'CORREO ELECTRÓNICO': string
  [key: string]: string | number | null
}
