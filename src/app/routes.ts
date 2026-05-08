export type AppRouteId = 'database' | 'acta' | 'metricas'

export type AppRoute = {
  id: AppRouteId
  label: string
  description: string
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
    id: 'metricas',
    label: 'Métricas',
    description: 'Indicadores de cobertura, compromisos y visitas del territorio.',
  },
]

export const defaultRoute: AppRouteId = 'database'