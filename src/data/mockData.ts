import type {
  ActionPlan,
  Establishment,
  Indicator,
  MeetingMinute,
  ModuleCard,
  Observation,
  Visit,
} from '../types/crm'
import type { Compromiso } from '../types/compromisos'

const establishments: Establishment[] = [
  {
    id: 'est-01',
    name: 'Escuela San Fernando Norte',
    commune: 'San Fernando',
    category: 'Basica',
    staff: 48,
    totalStudents: 612,
    riskIndex: 74,
    lastVisitAt: '2026-04-12',
  },
  {
    id: 'est-02',
    name: 'Liceo Tecnico Placilla',
    commune: 'Placilla',
    category: 'Media TP',
    staff: 56,
    totalStudents: 784,
    riskIndex: 81,
    lastVisitAt: '2026-04-18',
  },
  {
    id: 'est-03',
    name: 'Escuela Rural Nancagua',
    commune: 'Nancagua',
    category: 'Basica Rural',
    staff: 22,
    totalStudents: 238,
    riskIndex: 63,
    lastVisitAt: '2026-03-30',
  },
]

const visits: Visit[] = [
  {
    id: 'vis-01',
    establishmentId: 'est-02',
    date: '2026-04-26',
    type: 'Observacion',
    inspector: 'Daniela Soto',
    status: 'Programada',
    scope: 'Talleres y patios',
  },
  {
    id: 'vis-02',
    establishmentId: 'est-01',
    date: '2026-04-19',
    type: 'Seguimiento',
    inspector: 'Ramon Rojas',
    status: 'Ejecutada',
    scope: 'Rutas de evacuacion',
  },
  {
    id: 'vis-03',
    establishmentId: 'est-03',
    date: '2026-04-29',
    type: 'Diagnostico',
    inspector: 'Cecilia Molina',
    status: 'Programada',
    scope: 'Infraestructura critica',
  },
]

const observations: Observation[] = [
  {
    id: 'obs-01',
    visitId: 'vis-02',
    establishmentId: 'est-01',
    title: 'Senaletica de emergencia incompleta',
    riskLevel: 'Alto',
    status: 'EnCurso',
    assignedTo: 'Director establecimiento',
    dueDate: '2026-05-03',
  },
  {
    id: 'obs-02',
    visitId: 'vis-01',
    establishmentId: 'est-02',
    title: 'Material inflamable cercano a tablero electrico',
    riskLevel: 'Critico',
    status: 'Pendiente',
    assignedTo: 'Encargado de mantencion',
    dueDate: '2026-04-28',
  },
  {
    id: 'obs-03',
    visitId: 'vis-03',
    establishmentId: 'est-03',
    title: 'Botiquin con reposicion parcial',
    riskLevel: 'Medio',
    status: 'Resuelta',
    assignedTo: 'Inspector general',
    dueDate: '2026-04-20',
  },
]

const meetingMinutes: MeetingMinute[] = [
  {
    id: 'min-01',
    establishmentId: 'est-01',
    code: 'ACT-2026-041',
    sessionDate: '2026-04-15',
    topic: 'Comite paritario y plan semestral',
    status: 'EnCurso',
    commitments: 4,
  },
  {
    id: 'min-02',
    establishmentId: 'est-02',
    code: 'ACT-2026-039',
    sessionDate: '2026-04-10',
    topic: 'Cierre de observaciones electricas',
    status: 'Abierta',
    commitments: 3,
  },
  {
    id: 'min-03',
    establishmentId: 'est-03',
    code: 'ACT-2026-032',
    sessionDate: '2026-03-28',
    topic: 'Revision de protocolo de emergencias',
    status: 'Cerrada',
    commitments: 2,
  },
]

const actionPlans: ActionPlan[] = [
  {
    id: 'act-01',
    observationId: 'obs-01',
    measure: 'Instalar senaletica foto luminiscente en pasillos y patio cubierto',
    owner: 'Area de infraestructura',
    dueDate: '2026-05-05',
    progress: 55,
  },
  {
    id: 'act-02',
    observationId: 'obs-02',
    measure: 'Retiro inmediato de material combustible y segregacion segura',
    owner: 'Director liceo',
    dueDate: '2026-04-25',
    progress: 20,
  },
  {
    id: 'act-03',
    observationId: 'obs-03',
    measure: 'Actualizar stock critico y registrar control mensual',
    owner: 'Encargada de convivencia',
    dueDate: '2026-04-19',
    progress: 100,
  },
]

const indicators: Indicator[] = [
  {
    id: 'ind-01',
    label: 'Cobertura de visitas',
    value: 78,
    goal: 100,
    unit: '%',
    trend: '+12% vs. mes anterior',
  },
  {
    id: 'ind-02',
    label: 'Cierre oportuno de actas',
    value: 64,
    goal: 90,
    unit: '%',
    trend: '+7% en 30 dias',
  },
  {
    id: 'ind-03',
    label: 'Observaciones resueltas',
    value: 46,
    goal: 60,
    unit: 'casos',
    trend: '+9 casos cerrados',
  },
]

const modules: ModuleCard[] = [
  {
    title: 'Actas y acuerdos',
    tag: 'documentacion',
    description: 'Registro de sesiones, compromisos, responsables y fechas de cierre.',
  },
  {
    title: 'Visitas de observacion',
    tag: 'terreno',
    description: 'Programacion de visitas, cobertura por comuna y trazabilidad de hallazgos.',
  },
  {
    title: 'Hallazgos y riesgos',
    tag: 'control',
    description: 'Priorizacion por criticidad, responsables y fechas de correccion.',
  },
  {
    title: 'Analisis de datos',
    tag: 'kpi',
    description: 'Panel de indicadores para seguimiento mensual y toma de decisiones.',
  },
]

const compromisos: Compromiso[] = [
  {
    id: 'com-01',
    acta_folio: 'ACT-2026-041',
    establecimiento_id: 'est-01',
    establecimiento_nombre: 'Escuela San Fernando Norte',
    establecimiento_comuna: 'San Fernando',
    descripcion: 'Instalar señalética foto luminiscente en pasillos y patio cubierto',
    responsable: 'Director establecimiento',
    plazo: '2026-05-15',
    estado: 'En proceso',
    comentarios: [
      {
        id: 'cc-001',
        texto: 'Se adquirió el material, pendiente instalación en pasillos norte.',
        autor: 'Ramon Rojas',
        fecha: '2026-04-28',
      },
    ],
    created_at: '2026-04-15',
    updated_at: '2026-04-28',
  },
  {
    id: 'com-02',
    acta_folio: 'ACT-2026-041',
    establecimiento_id: 'est-01',
    establecimiento_nombre: 'Escuela San Fernando Norte',
    establecimiento_comuna: 'San Fernando',
    descripcion: 'Actualizar plan de emergencias y realizar simulacro semestral con registro',
    responsable: 'Inspector general',
    plazo: '2026-06-01',
    estado: 'Pendiente',
    comentarios: [],
    created_at: '2026-04-15',
    updated_at: '2026-04-15',
  },
  {
    id: 'com-03',
    acta_folio: 'ACT-2026-039',
    establecimiento_id: 'est-02',
    establecimiento_nombre: 'Liceo Técnico Placilla',
    establecimiento_comuna: 'Placilla',
    descripcion: 'Retiro inmediato de material combustible cercano al tablero eléctrico',
    responsable: 'Encargado de mantención',
    plazo: '2026-04-28',
    estado: 'Vencido',
    comentarios: [
      {
        id: 'cc-002',
        texto: 'No ejecutado a la fecha de plazo. Se levanta nuevamente como urgente en próxima visita.',
        autor: 'Daniela Soto',
        fecha: '2026-04-30',
      },
    ],
    created_at: '2026-04-10',
    updated_at: '2026-04-30',
  },
  {
    id: 'com-04',
    acta_folio: 'ACT-2026-039',
    establecimiento_id: 'est-02',
    establecimiento_nombre: 'Liceo Técnico Placilla',
    establecimiento_comuna: 'Placilla',
    descripcion: 'Capacitar a todo el personal en uso correcto de extintores y evacuación',
    responsable: 'Director liceo',
    plazo: '2026-05-30',
    estado: 'Pendiente',
    comentarios: [],
    created_at: '2026-04-10',
    updated_at: '2026-04-10',
  },
  {
    id: 'com-05',
    acta_folio: 'ACT-2026-032',
    establecimiento_id: 'est-03',
    establecimiento_nombre: 'Escuela Rural Nancagua',
    establecimiento_comuna: 'Nancagua',
    descripcion: 'Actualizar stock crítico de botiquín y establecer control mensual documentado',
    responsable: 'Encargada de convivencia',
    plazo: '2026-04-19',
    estado: 'Cumplido',
    comentarios: [
      {
        id: 'cc-003',
        texto: 'Se repuso todo el material faltante. Se dejó registro firmado en carpeta de salud.',
        autor: 'Cecilia Molina',
        fecha: '2026-04-17',
      },
    ],
    created_at: '2026-03-28',
    updated_at: '2026-04-17',
  },
]

export const crmData = {
  establishments,
  visits,
  observations,
  meetingMinutes,
  actionPlans,
  indicators,
  modules,
  compromisos,
}
