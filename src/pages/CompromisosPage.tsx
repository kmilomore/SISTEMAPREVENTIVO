import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Compromiso, ComentarioCompromiso, EstadoCompromiso } from '../types/compromisos'
import {
  fetchCompromisos,
  updateCompromisoEstado,
  updateCompromisoComentarios,
} from '../lib/compromisosService'

// ─── Iconos ────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-slate-400" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ESTADOS: EstadoCompromiso[] = ['Pendiente', 'En proceso', 'Cumplido', 'Vencido']

function estadoChip(estado: EstadoCompromiso) {
  const map: Record<EstadoCompromiso, string> = {
    Pendiente: 'status-chip status-warning',
    'En proceso': 'status-chip status-info',
    Cumplido: 'status-chip status-success',
    Vencido: 'status-chip status-error',
  }
  return map[estado] ?? 'status-chip status-info'
}

function estadoBtnClass(estado: EstadoCompromiso, selected: boolean) {
  if (!selected) {
    return 'rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:border-slate-300 hover:bg-slate-50'
  }
  const map: Record<EstadoCompromiso, string> = {
    Pendiente: 'rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700',
    'En proceso': 'rounded-xl border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700',
    Cumplido: 'rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700',
    Vencido: 'rounded-xl border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700',
  }
  return map[estado]
}

function formatFecha(dateStr?: string) {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function isPlazoVencido(plazo?: string) {
  if (!plazo) return false
  return new Date(plazo) < new Date()
}

function generateId() {
  return `cc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

// ─── Modal de compromiso ───────────────────────────────────────────────────────

interface CompromisoModalProps {
  compromiso: Compromiso
  onClose: () => void
  onUpdated: (updated: Compromiso) => void
}

function CompromisoModal({ compromiso, onClose, onUpdated }: CompromisoModalProps) {
  const [estado, setEstado] = useState<EstadoCompromiso>(compromiso.estado)
  const [comentarios, setComentarios] = useState<ComentarioCompromiso[]>(compromiso.comentarios)
  const [nuevoTexto, setNuevoTexto] = useState('')
  const [nuevoAutor, setNuevoAutor] = useState('')
  const [saving, setSaving] = useState(false)
  const [addingComment, setAddingComment] = useState(false)

  const estadoChanged = estado !== compromiso.estado

  async function handleGuardarEstado() {
    setSaving(true)
    await updateCompromisoEstado(compromiso.id, estado)
    const updated: Compromiso = {
      ...compromiso,
      estado,
      comentarios,
      updated_at: new Date().toISOString(),
    }
    onUpdated(updated)
    setSaving(false)
  }

  async function handleAgregarComentario() {
    if (!nuevoTexto.trim()) return
    setAddingComment(true)

    const nuevo: ComentarioCompromiso = {
      id: generateId(),
      texto: nuevoTexto.trim(),
      autor: nuevoAutor.trim() || 'Unidad de Prevención',
      fecha: new Date().toISOString().slice(0, 10),
    }

    const nuevosComentarios = [...comentarios, nuevo]
    await updateCompromisoComentarios(compromiso.id, nuevosComentarios)

    setComentarios(nuevosComentarios)
    setNuevoTexto('')
    setNuevoAutor('')

    onUpdated({ ...compromiso, estado, comentarios: nuevosComentarios, updated_at: new Date().toISOString() })
    setAddingComment(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0057B8]">
              Compromiso
              {compromiso.acta_folio && (
                <span className="ml-2 normal-case tracking-normal text-slate-400">
                  · {compromiso.acta_folio}
                </span>
              )}
            </p>
            <h3 className="mt-1.5 text-base font-semibold leading-snug text-slate-800">
              {compromiso.descripcion}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 border-b border-slate-100 px-6 py-4 sm:grid-cols-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Establecimiento</p>
              <p className="mt-0.5 text-sm font-medium text-slate-800">{compromiso.establecimiento_nombre}</p>
              <p className="text-xs text-slate-400">{compromiso.establecimiento_comuna}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Responsable</p>
              <p className="mt-0.5 text-sm text-slate-700">{compromiso.responsable ?? '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Plazo</p>
              <p
                className={`mt-0.5 text-sm font-medium ${
                  compromiso.plazo && isPlazoVencido(compromiso.plazo) && compromiso.estado !== 'Cumplido'
                    ? 'text-red-600'
                    : 'text-slate-700'
                }`}
              >
                {formatFecha(compromiso.plazo)}
              </p>
            </div>
          </div>

          {/* Estado */}
          <div className="border-b border-slate-100 px-6 py-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
              Estado del compromiso
            </p>
            <div className="flex flex-wrap gap-2">
              {ESTADOS.map((e) => (
                <button
                  key={e}
                  type="button"
                  className={estadoBtnClass(e, estado === e)}
                  onClick={() => setEstado(e)}
                >
                  {e}
                </button>
              ))}
            </div>
            {estadoChanged && (
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  className="btn-primary text-xs"
                  onClick={handleGuardarEstado}
                  disabled={saving}
                >
                  {saving ? 'Guardando…' : 'Guardar cambio de estado'}
                </button>
                <button
                  type="button"
                  className="text-xs text-slate-400 hover:text-slate-600"
                  onClick={() => setEstado(compromiso.estado)}
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>

          {/* Historial de comentarios */}
          <div className="px-6 py-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
              Historial de seguimiento
              {comentarios.length > 0 && (
                <span className="ml-2 normal-case tracking-normal text-slate-300">
                  ({comentarios.length})
                </span>
              )}
            </p>

            {comentarios.length === 0 ? (
              <p className="mb-4 text-xs text-slate-400">
                Sin comentarios. Agrega el primer seguimiento.
              </p>
            ) : (
              <ol className="mb-5 space-y-3">
                {comentarios.map((c) => (
                  <li key={c.id} className="flex gap-3">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e8f0ff] text-[9px] font-bold text-[#0033A0]">
                      {c.autor.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1 rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="mb-1 flex flex-wrap items-baseline gap-2">
                        <span className="text-xs font-semibold text-slate-700">{c.autor}</span>
                        <span className="text-[10px] text-slate-400">{formatFecha(c.fecha)}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-slate-700">{c.texto}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}

            {/* Nuevo comentario */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-xs font-semibold text-slate-500">Agregar seguimiento</p>
              <textarea
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-[#0033A0] focus:outline-none focus:ring-2 focus:ring-[#0033A0]/10"
                rows={3}
                placeholder="Escribe una nota de seguimiento…"
                value={nuevoTexto}
                onChange={(e) => setNuevoTexto(e.target.value)}
              />
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-[#0033A0] focus:outline-none focus:ring-2 focus:ring-[#0033A0]/10"
                  placeholder="Tu nombre (opcional)"
                  value={nuevoAutor}
                  onChange={(e) => setNuevoAutor(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-primary gap-2 text-xs"
                  onClick={handleAgregarComentario}
                  disabled={!nuevoTexto.trim() || addingComment}
                >
                  <SendIcon />
                  {addingComment ? 'Guardando…' : 'Agregar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ──────────────────────────────────────────────────────────

export function CompromisosPage() {
  const [compromisos, setCompromisos] = useState<Compromiso[]>([])
  const [loading, setLoading] = useState(true)
  const [isMock, setIsMock] = useState(false)
  const [filtroEscuela, setFiltroEscuela] = useState('')
  const [filtroComuna, setFiltroComuna] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<EstadoCompromiso | ''>('')
  const [selected, setSelected] = useState<Compromiso | null>(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      const { data, isMock: mock } = await fetchCompromisos()
      if (!mounted) return
      setCompromisos(data)
      setIsMock(mock)
      setLoading(false)
    }

    void load()
    return () => { mounted = false }
  }, [])

  const comunas = useMemo(
    () => Array.from(new Set(compromisos.map((c) => c.establecimiento_comuna))).sort(),
    [compromisos],
  )

  const filtered = useMemo(() => {
    return compromisos.filter((c) => {
      const matchEscuela =
        !filtroEscuela ||
        c.establecimiento_nombre.toLowerCase().includes(filtroEscuela.toLowerCase())
      const matchComuna = !filtroComuna || c.establecimiento_comuna === filtroComuna
      const matchEstado = !filtroEstado || c.estado === filtroEstado
      return matchEscuela && matchComuna && matchEstado
    })
  }, [compromisos, filtroEscuela, filtroComuna, filtroEstado])

  const handleUpdated = useCallback((updated: Compromiso) => {
    setCompromisos((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    setSelected(updated)
  }, [])

  const counts = useMemo(() => ({
    total: compromisos.length,
    pendiente: compromisos.filter((c) => c.estado === 'Pendiente').length,
    enProceso: compromisos.filter((c) => c.estado === 'En proceso').length,
    cumplido: compromisos.filter((c) => c.estado === 'Cumplido').length,
    vencido: compromisos.filter((c) => c.estado === 'Vencido').length,
  }), [compromisos])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="panel-card-strong p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0057B8]">
              Compromisos
            </p>
            <h3 className="mt-2 text-3xl font-light text-slate-800">Gestor de compromisos</h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
              Seguimiento y gestión de compromisos impuestos por establecimiento. Cambia el estado,
              registra avances y mantén el historial de cada compromiso.
            </p>
          </div>
          {isMock && !loading && (
            <span className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
              Modo demo
            </span>
          )}
        </div>

        {/* KPI chips */}
        {!loading && (
          <div className="mt-5 flex flex-wrap gap-3">
            <KpiChip label="Total" value={counts.total} color="slate" />
            <KpiChip label="Pendientes" value={counts.pendiente} color="amber" />
            <KpiChip label="En proceso" value={counts.enProceso} color="blue" />
            <KpiChip label="Cumplidos" value={counts.cumplido} color="emerald" />
            <KpiChip label="Vencidos" value={counts.vencido} color="red" />
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="panel-card-strong px-5 py-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative min-w-[220px] flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Buscar por establecimiento…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:border-[#0033A0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0033A0]/10"
              value={filtroEscuela}
              onChange={(e) => setFiltroEscuela(e.target.value)}
            />
          </div>

          <select
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-[#0033A0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0033A0]/10"
            value={filtroComuna}
            onChange={(e) => setFiltroComuna(e.target.value)}
          >
            <option value="">Todas las comunas</option>
            {comunas.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-[#0033A0] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0033A0]/10"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as EstadoCompromiso | '')}
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>

          {(filtroEscuela || filtroComuna || filtroEstado) && (
            <button
              type="button"
              className="text-xs text-slate-400 underline hover:text-slate-600"
              onClick={() => { setFiltroEscuela(''); setFiltroComuna(''); setFiltroEstado('') }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <section className="table-shell">
        <div className="flex flex-col gap-1 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Listado</p>
            <h4 className="mt-0.5 text-lg font-light text-slate-800">Compromisos registrados</h4>
          </div>
          {!loading && (
            <p className="text-xs text-slate-400">
              {filtered.length} de {compromisos.length} compromisos
            </p>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Compromiso
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Establecimiento
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Responsable
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Plazo
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Estado
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Notas
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div
                          className="skeleton h-4 rounded-md"
                          style={{ width: j === 0 ? '240px' : j === 1 ? '140px' : '80px' }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center text-slate-400">
                    <p className="text-sm font-medium">Sin compromisos que coincidan</p>
                    <p className="mt-1 text-xs">Ajusta los filtros para ver resultados.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((comp) => {
                  const vencido =
                    comp.plazo &&
                    isPlazoVencido(comp.plazo) &&
                    comp.estado !== 'Cumplido'

                  return (
                    <tr
                      key={comp.id}
                      className="group cursor-pointer transition-colors hover:bg-blue-50/30"
                      onClick={() => setSelected(comp)}
                    >
                      <td className="max-w-[280px] px-4 py-3">
                        <p className="line-clamp-2 text-sm font-medium leading-snug text-slate-800">
                          {comp.descripcion}
                        </p>
                        {comp.acta_folio && (
                          <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                            {comp.acta_folio}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{comp.establecimiento_nombre}</p>
                        <p className="text-xs text-slate-400">{comp.establecimiento_comuna}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {comp.responsable ?? '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <span className={vencido ? 'font-semibold text-red-600' : 'text-slate-600'}>
                          {formatFecha(comp.plazo)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={estadoChip(comp.estado)}>{comp.estado}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {comp.comentarios.length > 0 ? (
                          <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#e8f0ff] px-1.5 text-[10px] font-semibold text-[#0033A0]">
                            {comp.comentarios.length}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#0033A0] opacity-0 transition hover:bg-[#e8f0ff] group-hover:opacity-100"
                          onClick={(e) => { e.stopPropagation(); setSelected(comp) }}
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <CompromisoModal
          compromiso={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

type KpiColor = 'slate' | 'amber' | 'blue' | 'emerald' | 'red'

function KpiChip({ label, value, color }: { label: string; value: number; color: KpiColor }) {
  const cls: Record<KpiColor, string> = {
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    red: 'border-red-200 bg-red-50 text-red-700',
  }
  return (
    <div className={`flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-xs font-medium ${cls[color]}`}>
      <span className="font-bold text-base leading-none">{value}</span>
      <span className="opacity-75">{label}</span>
    </div>
  )
}
