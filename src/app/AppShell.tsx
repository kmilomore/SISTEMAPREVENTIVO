import { useEffect, useState } from 'react'

import { ActaPage } from '../pages/ActaPage'
import { DatabasePage } from '../pages/DatabasePage'
import { appRoutes } from './routes'
import { useHashRoute } from './useHashRoute'

const brandLogo = '/SLEPCOLCHAGUA.webp'

const pageTitle = {
  database: 'Base de datos operacional',
  acta: 'Gestor de actas',
} as const

const pageTag = {
  database: 'Directorio',
  acta: 'Gestion documental',
} as const

export function AppShell() {
  const { route, navigate } = useHashRoute()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [route])

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-slate-800">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <div
          className={`fixed inset-0 z-30 bg-slate-900/30 transition lg:hidden ${
            isMobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        <aside
          className={`fixed inset-y-0 left-0 z-40 w-[308px] transform bg-[#0033A0] px-5 py-5 text-white shadow-2xl transition duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-3 border-b border-white/15 pb-5">
              <div className="flex items-start gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-1.5 shadow-lg">
                  <img src={brandLogo} alt="SLEP Colchagua" className="h-full w-full rounded-xl object-contain" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-100/80">
                    Gobierno de Chile
                  </p>
                  <h1 className="mt-2 text-2xl font-semibold text-white">Portal de Riesgo</h1>
                  <p className="mt-1 text-sm text-blue-100/85">
                    Gestion institucional y trazabilidad territorial.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-xl border border-white/15 px-3 py-2 text-blue-50 lg:hidden"
                aria-label="Cerrar menu"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="mt-6">
              <p className="px-2 text-xs font-semibold uppercase tracking-[0.24em] text-blue-100/70">
                Modulos principales
              </p>
              <nav className="mt-2 space-y-1">
                {appRoutes.map((appRoute) => {
                  const isActive = appRoute.id === route

                  return (
                    <button
                      key={appRoute.id}
                      type="button"
                      onClick={() => navigate(appRoute.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                        isActive
                          ? 'bg-white text-[#0033A0] shadow'
                          : 'text-blue-50 hover:bg-white/10'
                      }`}
                    >
                      <span
                        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          isActive ? 'bg-[#e8f0ff] text-[#0033A0]' : 'bg-white/10 text-blue-100'
                        }`}
                      >
                        {appRoute.id === 'database' ? <DatabaseIcon /> : <MinutesIcon />}
                      </span>
                      <span className={`text-sm font-medium ${isActive ? 'text-[#0033A0]' : 'text-white'}`}>
                        {appRoute.label}
                      </span>
                    </button>
                  )
                })}
              </nav>
            </div>


            <div className="mt-auto rounded-3xl border border-white/15 bg-[#002a84] p-4 text-sm text-blue-50/92">
              <p className="font-semibold text-white">Unidad de Prevencion</p>
              <p className="mt-2 text-blue-100/80">
                Gestion del riesgo para el monitoreo de establecimientos, actas y compromisos del territorio.
              </p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-6">
            <header className="panel-card-strong sticky top-4 z-20 px-4 py-3 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden"
                    aria-label="Abrir menu"
                  >
                    <MenuIcon />
                  </button>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#0057B8]">
                      {pageTag[route]}
                    </p>
                    <h2 className="text-lg font-semibold text-slate-800">{pageTitle[route]}</h2>
                  </div>
                </div>

                <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0033A0] text-sm font-semibold text-white">
                      UP
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Perfil institucional</p>
                      <p className="text-xs text-slate-500">Unidad de Prevencion</p>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            {route === 'database' ? <DatabasePage /> : <ActaPage />}
          </div>
        </main>
      </div>
    </div>
  )
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function DatabaseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <ellipse cx="12" cy="6" rx="7" ry="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 6v6c0 1.66 3.13 3 7 3s7-1.34 7-3V6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 12v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function MinutesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M8 4h8l4 4v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 12h8M8 16h6M14 4v4h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

