import { useEffect, useState } from 'react'

import { defaultRoute, type AppRouteId } from './routes'

function normalizeRoute(hash: string): AppRouteId {
  const route = hash.replace(/^#\/?/, '').split('?')[0]

  return route === 'acta' ? 'acta' : defaultRoute
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