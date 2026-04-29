export type AppRouteId = 'database' | 'acta'

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
]

export const defaultRoute: AppRouteId = 'database'