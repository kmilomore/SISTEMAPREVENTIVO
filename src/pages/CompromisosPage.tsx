import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { MetricCard } from '../components/ui/MetricCard'
import { Modal, ModalBody, ModalCloseButton, ModalHeader } from '../components/ui/Modal'
import { Select } from '../components/ui/Select'
import { StatusBadge } from '../components/ui/StatusBadge'
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '../components/ui/Table'
import type { Compromiso, ComentarioCompromiso, EstadoCompromiso } from '../types/compromisos'
import {
  fetchCompromisos,
  updateCompromisoEstado,
  addComentario,
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

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3 shrink-0 text-slate-300" aria-hidden="true">
        <path d="M8 10l4-4 4 4M8 14l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  return dir === 'asc' ? (
    <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3 shrink-0 text-[#0033A0]" aria-hidden="true">
      <path d="M8 14l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3 shrink-0 text-[#0033A0]" aria-hidden="true">
      <path d="M8 10l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type SortKey = 'descripcion' | 'establecimiento_nombre' | 'responsable' | 'plazo' | 'estado'
type SortDir = 'asc' | 'desc'

const ESTADOS: EstadoCompromiso[] = ['Pendiente', 'En proceso', 'Cumplido', 'Vencido']

function estadoChip(estado: EstadoCompromiso) {
  const map: Record<EstadoCompromiso, 'warning' | 'info' | 'success' | 'danger'> = {
    Pendiente: 'warning',
    'En proceso': 'info',
    Cumplido: 'success',
    Vencido: 'danger',
  }
  return map[estado] ?? 'info'
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

function formatFecha(dateStr?: string | null) {
  if (!dateStr) return '—'
  const d = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function isPlazoVencido(plazo?: string | null) {
  if (!plazo) return false
  return new Date(plazo + 'T23:59:59') < new Date()
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
  const [comentarioError, setComentarioError] = useState<string | null>(null)

  const estadoChanged = estado !== compromiso.estado

  async function handleGuardarEstado() {
    setSaving(true)
    const { error } = await updateCompromisoEstado(compromiso.id, estado)
    if (!error) {
      const updated: Compromiso = { ...compromiso, estado, comentarios, updated_at: new Date().toISOString() }
      onUpdated(updated)
    }
    setSaving(false)
  }

  async function handleAgregarComentario() {
    if (!nuevoTexto.trim()) return
    setAddingComment(true)
    setComentarioError(null)

    const { data, error } = await addComentario(
      compromiso.id,
      nuevoTexto.trim(),
      nuevoAutor.trim() || 'Unidad de Prevención',
    )

    if (error || !data) {
      setComentarioError(error ?? 'Error al guardar el comentario.')
      setAddingComment(false)
      return
    }

    const nuevosComentarios = [...comentarios, data]
    setComentarios(nuevosComentarios)
    setNuevoTexto('')
    setNuevoAutor('')
    onUpdated({ ...compromiso, estado, comentarios: nuevosComentarios, updated_at: new Date().toISOString() })
    setAddingComment(false)
  }

  return (
    <Modal onClose={onClose} align="end" panelClassName="max-h-[90vh] max-w-2xl rounded-t-3xl sm:rounded-3xl">
      <ModalHeader>
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
          <ModalCloseButton onClick={onClose} />
        </ModalHeader>

        <ModalBody className="px-0 py-0">
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
                  isPlazoVencido(compromiso.plazo) && compromiso.estado !== 'Cumplido'
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
                <Button
                  key={e}
                  variant="secondary"
                  size="sm"
                  className={estadoBtnClass(e, estado === e)}
                  onClick={() => setEstado(e)}
                >
                  {e}
                </Button>
              ))}
            </div>
            {estadoChanged && (
              <div className="mt-4 flex items-center gap-3">
                <Button size="sm" onClick={handleGuardarEstado} disabled={saving}>
                  {saving ? 'Guardando…' : 'Guardar cambio de estado'}
                </Button>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:bg-transparent hover:text-slate-600" onClick={() => setEstado(compromiso.estado)}>
                  Cancelar
                </Button>
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
                        <span className="text-[10px] text-slate-400">{formatFecha(c.created_at)}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-slate-700">{c.texto}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}

            {/* Nuevo comentario */}
            <Card tone="soft">
              <p className="mb-3 text-xs font-semibold text-slate-500">Agregar seguimiento</p>
              <textarea
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-[#0033A0] focus:outline-none focus:ring-2 focus:ring-[#0033A0]/10"
                rows={3}
                placeholder="Escribe una nota de seguimiento…"
                value={nuevoTexto}
                onChange={(e) => setNuevoTexto(e.target.value)}
              />
              <div className="mt-2 flex items-center gap-2">
                <Input
                  type="text"
                  className="flex-1 text-xs"
                  placeholder="Tu nombre (opcional)"
                  value={nuevoAutor}
                  onChange={(e) => setNuevoAutor(e.target.value)}
                />
                <Button size="sm" onClick={handleAgregarComentario} disabled={!nuevoTexto.trim() || addingComment}>
                  <SendIcon />
                  {addingComment ? 'Guardando…' : 'Agregar'}
                </Button>
              </div>
              {comentarioError && (
                <p className="mt-2 text-xs text-red-600">{comentarioError}</p>
              )}
            </Card>
          </div>
        </ModalBody>
    </Modal>
  )
}

// ─── Página principal ──────────────────────────────────────────────────────────

export function CompromisosPage() {
  const [compromisos, setCompromisos] = useState<Compromiso[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [filtroEscuela, setFiltroEscuela] = useState('')
  const [filtroComuna, setFiltroComuna] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<EstadoCompromiso | ''>('')
  const [selected, setSelected] = useState<Compromiso | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('plazo')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  useEffect(() => {
    let mounted = true

    async function load() {
      const { data, error } = await fetchCompromisos()
      if (!mounted) return
      if (error) setFetchError(error)
      else setCompromisos(data)
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
    const result = compromisos.filter((c) => {
      const matchEscuela =
        !filtroEscuela ||
        c.establecimiento_nombre.toLowerCase().includes(filtroEscuela.toLowerCase())
      const matchComuna = !filtroComuna || c.establecimiento_comuna === filtroComuna
      const matchEstado = !filtroEstado || c.estado === filtroEstado
      return matchEscuela && matchComuna && matchEstado
    })

    return [...result].sort((a, b) => {
      let av: string
      let bv: string
      switch (sortKey) {
        case 'descripcion':
          av = a.descripcion; bv = b.descripcion; break
        case 'establecimiento_nombre':
          av = a.establecimiento_nombre; bv = b.establecimiento_nombre; break
        case 'responsable':
          av = a.responsable ?? ''; bv = b.responsable ?? ''; break
        case 'plazo':
          av = a.plazo ?? (sortDir === 'asc' ? '9999-99-99' : '0000-00-00')
          bv = b.plazo ?? (sortDir === 'asc' ? '9999-99-99' : '0000-00-00')
          break
        case 'estado': {
          const order: Record<string, number> = { Pendiente: 0, 'En proceso': 1, Cumplido: 2, Vencido: 3 }
          const cmp = (order[a.estado] ?? 99) - (order[b.estado] ?? 99)
          return sortDir === 'asc' ? cmp : -cmp
        }
        default: return 0
      }
      const cmp = av.localeCompare(bv, 'es', { sensitivity: 'base' })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [compromisos, filtroEscuela, filtroComuna, filtroEstado, sortKey, sortDir])

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
        return prev
      }
      setSortDir('asc')
      return key
    })
  }, [])

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

  if (fetchError) {
    return (
      <div className="space-y-6">
        <HeaderCard />
        <Card tone="strong" className="p-8 text-center">
          <p className="text-sm font-semibold text-slate-700">Supabase no configurado</p>
          <p className="mt-2 max-w-sm mx-auto text-xs text-slate-500">
            Configura las variables de entorno <code className="font-mono">VITE_SUPABASE_URL</code> y{' '}
            <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> en{' '}
            <code className="font-mono">.env.local</code> para activar este módulo.
          </p>
          <p className="mt-3 text-xs text-slate-400">
            Ejecuta primero <code className="font-mono">supabase/compromisos_schema.sql</code> en el
            SQL Editor de Supabase para crear las tablas necesarias.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card tone="strong" className="p-6 sm:p-7">
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

        {!loading && compromisos.length > 0 && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Total" value={counts.total} tone="neutral" className="p-4" />
            <MetricCard label="Pendientes" value={counts.pendiente} tone="warning" className="p-4" />
            <MetricCard label="En proceso" value={counts.enProceso} tone="primary" className="p-4" />
            <MetricCard label="Cumplidos" value={counts.cumplido} tone="success" className="p-4" />
            <MetricCard label="Vencidos" value={counts.vencido} tone="warning" className="p-4" />
          </div>
        )}
      </Card>

      {/* Filtros */}
      <Card tone="strong" className="px-5 py-4">
        <div className="flex flex-wrap items-end gap-3">
          <Input
              type="text"
              placeholder="Buscar por establecimiento…"
              containerClassName="min-w-[220px] flex-1"
              icon={<SearchIcon />}
              value={filtroEscuela}
              onChange={(e) => setFiltroEscuela(e.target.value)}
            />

          <Select
            containerClassName="min-w-[220px]"
            value={filtroComuna}
            onChange={(e) => setFiltroComuna(e.target.value)}
          >
            <option value="">Todas las comunas</option>
            {comunas.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>

          <Select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as EstadoCompromiso | '')}
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </Select>

          {(filtroEscuela || filtroComuna || filtroEstado) && (
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 underline hover:bg-transparent hover:text-slate-600"
              onClick={() => { setFiltroEscuela(''); setFiltroComuna(''); setFiltroEstado('') }}
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </Card>

      {/* Tabla */}
      <Card tone="surface" padding="none" className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
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

        <DataTable responsive="md">
            <DataTableHead>
              <DataTableRow>
                <SortableTh label="Compromiso" colKey="descripcion" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh label="Establecimiento" colKey="establecimiento_nombre" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh label="Responsable" colKey="responsable" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh label="Plazo" colKey="plazo" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh label="Estado" colKey="estado" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <DataTableHeaderCell className="text-center">
                  Notas
                </DataTableHeaderCell>
                <DataTableHeaderCell className="normal-case" />
              </DataTableRow>
            </DataTableHead>
            <DataTableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <DataTableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <DataTableCell key={j} className="py-3">
                        <div
                          className="skeleton h-4 rounded-md"
                          style={{ width: j === 0 ? '240px' : j === 1 ? '140px' : '80px' }}
                        />
                      </DataTableCell>
                    ))}
                  </DataTableRow>
                ))
              ) : filtered.length === 0 ? (
                <DataTableRow>
                  <DataTableCell colSpan={7} className="px-5 py-14 text-center text-slate-400">
                    <p className="text-sm font-medium">
                      {compromisos.length === 0
                        ? 'No hay compromisos registrados'
                        : 'Sin compromisos que coincidan'}
                    </p>
                    <p className="mt-1 text-xs">
                      {compromisos.length === 0
                        ? 'Los compromisos se generan desde las actas registradas.'
                        : 'Ajusta los filtros para ver resultados.'}
                    </p>
                  </DataTableCell>
                </DataTableRow>
              ) : (
                filtered.map((comp) => {
                  const vencido = isPlazoVencido(comp.plazo) && comp.estado !== 'Cumplido'

                  return (
                    <DataTableRow
                      key={comp.id}
                      interactive
                      className="group hover:bg-blue-50/30"
                      onClick={() => setSelected(comp)}
                    >
                      <DataTableCell className="max-w-[280px] py-3">
                        <p className="line-clamp-2 text-sm font-medium leading-snug text-slate-800">
                          {comp.descripcion}
                        </p>
                        {comp.acta_folio && (
                          <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                            {comp.acta_folio}
                          </p>
                        )}
                      </DataTableCell>
                      <DataTableCell className="py-3">
                        <p className="font-medium text-slate-800">{comp.establecimiento_nombre}</p>
                        <p className="text-xs text-slate-400">{comp.establecimiento_comuna}</p>
                      </DataTableCell>
                      <DataTableCell className="py-3 text-sm text-slate-600">
                        {comp.responsable ?? '—'}
                      </DataTableCell>
                      <DataTableCell className="whitespace-nowrap py-3 text-sm">
                        <span className={vencido ? 'font-semibold text-red-600' : 'text-slate-600'}>
                          {formatFecha(comp.plazo)}
                        </span>
                      </DataTableCell>
                      <DataTableCell className="py-3">
                        <StatusBadge tone={estadoChip(comp.estado)}>{comp.estado}</StatusBadge>
                      </DataTableCell>
                      <DataTableCell className="py-3 text-center">
                        {comp.comentarios.length > 0 ? (
                          <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#e8f0ff] px-1.5 text-[10px] font-semibold text-[#0033A0]">
                            {comp.comentarios.length}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </DataTableCell>
                      <DataTableCell className="py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100"
                          onClick={(e) => { e.stopPropagation(); setSelected(comp) }}
                        >
                          Editar
                        </Button>
                      </DataTableCell>
                    </DataTableRow>
                  )
                })
              )}
            </DataTableBody>
        </DataTable>
      </Card>

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

function HeaderCard() {
  return (
    <Card tone="strong" className="p-6 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0057B8]">Compromisos</p>
      <h3 className="mt-2 text-3xl font-light text-slate-800">Gestor de compromisos</h3>
    </Card>
  )
}

function SortableTh({
  label,
  colKey,
  sortKey,
  sortDir,
  onSort,
}: {
  label: string
  colKey: SortKey
  sortKey: SortKey
  sortDir: SortDir
  onSort: (key: SortKey) => void
}) {
  const active = sortKey === colKey
  return (
    <DataTableHeaderCell
      className="cursor-pointer select-none hover:text-slate-700"
      onClick={() => onSort(colKey)}
    >
      <span className="flex items-center gap-1">
        {label}
        <SortIcon active={active} dir={sortDir} />
      </span>
    </DataTableHeaderCell>
  )
}
