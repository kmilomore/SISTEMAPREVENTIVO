export type AppRouteId = 'database' | 'acta' | 'metricas' | 'compromisos' | 'reuniones'

export type AppRoute = {
  id: AppRouteId
  label: string
  description: string
  isSubItem?: boolean
}

export const appRoutes: AppRoute[] = [
  {
    id: 'database',
    label: 'Base de Datos',
    description: 'Directorio de establecimientos educacionales del SLEP Colchagua.',
  },
  {
    id: 'acta',
    label: 'Acta',
    description: 'Registro y seguimiento de actas, acuerdos y compromisos por establecimiento.',
  },
  {
    id: 'reuniones',
    label: 'Reuniones',
    description: 'Registro y seguimiento de actas de reunión con organizaciones y equipos.',
    isSubItem: true,
  },
  {
    id: 'metricas',
    label: 'Métricas',
    description: 'Indicadores de cobertura, compromisos y visitas del territorio.',
  },
  {
    id: 'compromisos',
    label: 'Compromisos',
    description: 'Seguimiento y gestión de compromisos impuestos por establecimiento.',
  },
]

export const defaultRoute: AppRouteId = 'database'
