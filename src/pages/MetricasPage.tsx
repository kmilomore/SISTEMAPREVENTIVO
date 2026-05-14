import { useEffect, useState, useMemo } from 'react'
import { Alert } from '../components/ui/Alert'
import { Card } from '../components/ui/Card'
import { MetricCard } from '../components/ui/MetricCard'
import { Select } from '../components/ui/Select'
import { StatusBadge } from '../components/ui/StatusBadge'
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeaderCell, DataTableRow } from '../components/ui/Table'
import { supabase } from '../lib/supabase'
import { fetchActas } from '../lib/actasService'
import type { ActaVisitaRow } from '../types/actas'
import type { EscuelaSLEP } from '../types/actas'

// ─── Tipos locales ────────────────────────────────────────────────────────────

interface CommuneStats {
  commune: string
  totalEscuelas: number
  escuelasVisitadas: number
  cobertura: number
  totalVisitas: number
}

interface CompromisoPendiente {
  key: string
  actaFolio: string
  establecimiento: string
  comuna: string
  descripcion: string
  responsable: string
  plazo: string
  estado: 'Pendiente' | 'En proceso'
  fechaVisita: string
}

// ─── Iconos ───────────────────────────────────────────────────────────────────

function IconCompromisos() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function IconEscuelas() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M3 21h18M9 21V7l9-4v18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 7l9-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconCobertura() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 2a10 10 0 0 1 0 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 12 2.5 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconPendientes() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
  const clamped = Math.min(100, Math.max(0, value))
  const color =
    clamped >= 75 ? 'bg-emerald-500' : clamped >= 40 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${clamped}%` }} />
    </div>
  )
}

function estadoChip(estado: string) {
  return estado === 'Pendiente' ? 'warning' : 'info'
}

function formatFecha(dateStr?: string) {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function MetricasPage() {
  const [loading, setLoading] = useState(true)
  const [actas, setActas] = useState<ActaVisitaRow[]>([])
  const [escuelas, setEscuelas] = useState<EscuelaSLEP[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [comunaFiltro, setComunaFiltro] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setFetchError(null)

      const actasPromise = fetchActas()
      const escuelasPromise = supabase
        ? supabase
            .from('BASE DE DATOS ESCUELAS SLEP')
            .select('"N°", COMUNA, "NOMBRE ESTABLECIMIENTO"')
        : Promise.resolve({ data: null, error: null })

      const [actasResult, escuelasResult] = await Promise.all([actasPromise, escuelasPromise])

      if (actasResult.error) setFetchError(actasResult.error)
      setActas(actasResult.data)
      setEscuelas((escuelasResult?.data ?? []) as EscuelaSLEP[])
      setLoading(false)
    }
    load()
  }, [])

  // ─── Métricas globales ────────────────────────────────────────────────────

  const totalCompromisos = useMemo(
    () => actas.reduce((acc, a) => acc + (a.acuerdos?.length ?? 0), 0),
    [actas],
  )

  const escuelasVisitadasSet = useMemo(
    () => new Set(actas.map((a) => a.establecimiento_id).filter(Boolean)),
    [actas],
  )

  const totalEscuelas = escuelas.length
  const escuelasVisitadas = escuelasVisitadasSet.size
  const coberturaGlobal =
    totalEscuelas > 0 ? Math.round((escuelasVisitadas / totalEscuelas) * 100) : 0

  const compromisosPendientes = useMemo<CompromisoPendiente[]>(
    () =>
      actas.flatMap((acta) =>
        (acta.acuerdos ?? [])
          .filter((a) => a.estado === 'Pendiente' || a.estado === 'En proceso')
          .map((a, i) => ({
            key: `${acta.id}-${i}`,
            actaFolio: acta.folio,
            establecimiento: acta.establecimiento_nombre ?? '—',
            comuna: acta.establecimiento_comuna ?? '—',
            descripcion: a.descripcion,
            responsable: a.responsable ?? '—',
            plazo: a.plazo ?? '—',
            estado: a.estado as 'Pendiente' | 'En proceso',
            fechaVisita: acta.fecha_visita,
          })),
      ),
    [actas],
  )

  // ─── Cobertura por comuna ─────────────────────────────────────────────────

  const communeStats = useMemo<CommuneStats[]>(() => {
    const map = new Map<string, { total: number; visited: Set<string>; visits: number }>()

    escuelas.forEach((e) => {
      const c = String(e['COMUNA'] ?? 'Sin comuna').trim()
      if (!map.has(c)) map.set(c, { total: 0, visited: new Set(), visits: 0 })
      map.get(c)!.total++
    })

    actas.forEach((acta) => {
      const c = (acta.establecimiento_comuna ?? 'Sin comuna').trim()
      if (!map.has(c)) map.set(c, { total: 0, visited: new Set(), visits: 0 })
      const entry = map.get(c)!
      if (acta.establecimiento_id) entry.visited.add(acta.establecimiento_id)
      entry.visits++
    })

    return Array.from(map.entries())
      .map(([commune, s]) => ({
        commune,
        totalEscuelas: s.total,
        escuelasVisitadas: s.visited.size,
        cobertura: s.total > 0 ? Math.round((s.visited.size / s.total) * 100) : 0,
        totalVisitas: s.visits,
      }))
      .sort((a, b) => b.escuelasVisitadas - a.escuelasVisitadas || a.commune.localeCompare(b.commune))
  }, [actas, escuelas])

  const comunas = useMemo(() => Array.from(new Set(compromisosPendientes.map((c) => c.comuna))).sort(), [compromisosPendientes])

  const compromisosFiltrados = useMemo(
    () =>
      comunaFiltro
        ? compromisosPendientes.filter((c) => c.comuna === comunaFiltro)
        : compromisosPendientes,
    [compromisosPendientes, comunaFiltro],
  )

  // ─── Estados de carga / sin Supabase ──────────────────────────────────────

  if (!supabase) {
    return (
      <Card tone="strong" className="flex flex-col items-center gap-4 px-8 py-16 text-center">
        <p className="text-sm font-semibold text-slate-700">Supabase no configurado</p>
        <p className="max-w-sm text-xs text-slate-500">
          Configura <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> en tu archivo{' '}
          <code>.env.local</code> para ver las métricas reales.
        </p>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-slate-500">
        Cargando métricas…
      </div>
    )
  }

  if (fetchError) {
    return (
      <Alert tone="danger" className="px-6 py-8">
        Error al cargar datos: {fetchError}
      </Alert>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Compromisos asignados"
          value={totalCompromisos}
          sub={`${compromisosPendientes.length} pendientes o en proceso`}
          icon={<IconCompromisos />}
          tone="primary"
        />
        <MetricCard
          label="Escuelas visitadas"
          value={escuelasVisitadas}
          sub={totalEscuelas > 0 ? `de ${totalEscuelas} en el territorio` : `${actas.length} actas registradas`}
          icon={<IconEscuelas />}
          tone="success"
        />
        <MetricCard
          label="Cobertura global"
          value={totalEscuelas > 0 ? `${coberturaGlobal}%` : '—'}
          sub={totalEscuelas > 0 ? `${escuelasVisitadas} de ${totalEscuelas} establecimientos` : 'Sin datos de directorio'}
          icon={<IconCobertura />}
          tone="violet"
        />
        <MetricCard
          label="Compromisos pendientes"
          value={compromisosPendientes.filter((c) => c.estado === 'Pendiente').length}
          sub={`${compromisosPendientes.filter((c) => c.estado === 'En proceso').length} en proceso`}
          icon={<IconPendientes />}
          tone="warning"
        />
      </div>

      {/* Cobertura por comuna */}
      <Card tone="strong" className="px-5 py-5">
        <h3 className="text-sm font-semibold text-slate-800">Cobertura de visitas por comuna</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Establecimientos visitados sobre el total de cada comuna
        </p>

        {communeStats.length === 0 ? (
          <p className="mt-6 text-center text-sm text-slate-400">Sin datos registrados</p>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {communeStats.map((s) => (
              <Card key={s.commune} tone="soft" padding="sm" className="flex flex-col gap-2 rounded-xl border-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-slate-800">{s.commune}</p>
                  <span className="shrink-0 text-xs font-semibold text-slate-500">
                    {s.totalEscuelas > 0 ? `${s.cobertura}%` : `${s.totalVisitas} visita${s.totalVisitas !== 1 ? 's' : ''}`}
                  </span>
                </div>
                {s.totalEscuelas > 0 && <ProgressBar value={s.cobertura} />}
                <p className="text-xs text-slate-400">
                  {s.escuelasVisitadas} visitada{s.escuelasVisitadas !== 1 ? 's' : ''}
                  {s.totalEscuelas > 0 && ` de ${s.totalEscuelas}`}
                  {' · '}
                  {s.totalVisitas} acta{s.totalVisitas !== 1 ? 's' : ''}
                </p>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Compromisos pendientes por establecimiento */}
      <Card tone="strong" className="px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Compromisos pendientes por establecimiento</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Acuerdos en estado Pendiente o En proceso extraídos de todas las actas
            </p>
          </div>
          {comunas.length > 1 && (
            <Select
              value={comunaFiltro}
              onChange={(e) => setComunaFiltro(e.target.value)}
            >
              <option value="">Todas las comunas</option>
              {comunas.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          )}
        </div>

        {compromisosFiltrados.length === 0 ? (
          <p className="mt-6 text-center text-sm text-slate-400">
            {actas.length === 0 ? 'Sin actas registradas' : 'Sin compromisos pendientes'}
          </p>
        ) : (
          <DataTable responsive="md" containerClassName="mt-4">
              <DataTableHead className="border-b border-slate-100 bg-transparent">
                <DataTableRow>
                  <DataTableHeaderCell className="pb-2 pr-4 pl-0">
                    Establecimiento
                  </DataTableHeaderCell>
                  <DataTableHeaderCell className="pb-2 pr-4 pl-0">
                    Acuerdo
                  </DataTableHeaderCell>
                  <DataTableHeaderCell className="pb-2 pr-4 pl-0">
                    Responsable
                  </DataTableHeaderCell>
                  <DataTableHeaderCell className="pb-2 pr-4 pl-0">
                    Plazo
                  </DataTableHeaderCell>
                  <DataTableHeaderCell className="pb-2 pl-0">
                    Estado
                  </DataTableHeaderCell>
                </DataTableRow>
              </DataTableHead>
              <DataTableBody className="divide-slate-50 bg-transparent">
                {compromisosFiltrados.map((c) => (
                  <DataTableRow key={c.key} className="group">
                    <DataTableCell className="py-3 pr-4 pl-0">
                      <p className="font-medium text-slate-800 group-hover:text-[#0033A0]">
                        {c.establecimiento}
                      </p>
                      <p className="text-xs text-slate-400">
                        {c.actaFolio} · {formatFecha(c.fechaVisita)}
                      </p>
                    </DataTableCell>
                    <DataTableCell className="max-w-[260px] py-3 pr-4 pl-0">
                      <p className="line-clamp-2 text-slate-700">{c.descripcion}</p>
                    </DataTableCell>
                    <DataTableCell className="py-3 pr-4 pl-0 text-slate-600">{c.responsable}</DataTableCell>
                    <DataTableCell className="py-3 pr-4 pl-0 text-slate-600">{c.plazo || '—'}</DataTableCell>
                    <DataTableCell className="py-3 pl-0"><StatusBadge tone={estadoChip(c.estado)}>{c.estado}</StatusBadge></DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
          </DataTable>
        )}
      </Card>
    </div>
  )
}
