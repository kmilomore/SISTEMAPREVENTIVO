import { useEffect, useState } from 'react'

import { appRoutes, defaultRoute, type AppRouteId } from './routes'

const validRouteIds = new Set(appRoutes.map((r) => r.id))

function normalizeRoute(hash: string): AppRouteId {
  const segment = hash.replace(/^#\/?/, '').split('?')[0]
  return validRouteIds.has(segment as AppRouteId) ? (segment as AppRouteId) : defaultRoute
}

export function useHashRoute() {
  const [route, setRoute] = useState<AppRouteId>(() => normalizeRoute(window.location.hash))

  useEffect(() => {
    const syncRoute = () => setRoute(normalizeRoute(window.location.hash))

    syncRoute()
    window.addEventListener('hashchange', syncRoute)

    return () => window.removeEventListener('hashchange', syncRoute)
  }, [])

  const navigate = (nextRoute: AppRouteId) => {
    window.location.hash = `/${nextRoute}`
  }

  return { route, navigate }
}