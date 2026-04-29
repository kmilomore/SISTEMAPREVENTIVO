export type VisitStatus = 'Programada' | 'Ejecutada' | 'Reprogramada'
export type ObservationRisk = 'Bajo' | 'Medio' | 'Alto' | 'Critico'
export type ObservationStatus = 'Pendiente' | 'EnCurso' | 'Resuelta'
export type MinuteStatus = 'Abierta' | 'EnCurso' | 'Cerrada'

export interface Establishment {
  id: string
  name: string
  commune: string
  category: string
  staff: number
  totalStudents: number
  riskIndex: number
  lastVisitAt: string
}

export interface Visit {
  id: string
  establishmentId: string
  date: string
  type: string
  inspector: string
  status: VisitStatus
  scope: string
}

export interface Observation {
  id: string
  visitId: string
  establishmentId: string
  title: string
  riskLevel: ObservationRisk
  status: ObservationStatus
  assignedTo: string
  dueDate: string
}

export interface MeetingMinute {
  id: string
  establishmentId: string
  code: string
  sessionDate: string
  topic: string
  status: MinuteStatus
  commitments: number
}

export interface ActionPlan {
  id: string
  observationId: string
  measure: string
  owner: string
  dueDate: string
  progress: number
}

export interface Indicator {
  id: string
  label: string
  value: number
  goal: number
  unit: string
  trend: string
}

export interface ModuleCard {
  title: string
  tag: string
  description: string
}
