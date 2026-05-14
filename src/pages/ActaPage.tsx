import { useState, useEffect, useCallback } from 'react'
import type { TipoActa, ActaVisita, ActaVisitaRow } from '../types/actas'
import { ActaTipoSelector } from '../components/actas/ActaTipoSelector'
import { ActaForm } from '../components/actas/ActaForm'
import { ActaDetailModal } from '../components/actas/ActaDetailModal'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { StatusBadge } from '../components/ui/StatusBadge'
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeaderCell, DataTableRow } from '../components/ui/Table'
import { fetchActas, insertActa, updateActaPdf, updateActaEstado, updateActaAsistencia } from '../lib/actasService'
import { generarActaPdf } from '../lib/pdfActaService'
import { uploadActaPdf, uploadAsistenciaFile } from '../lib/storageActasService'

// ─── Iconos ───────────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIPO_LABELS: Record<string, string> = {
  asesoria: 'Asesoría',
  observacion: 'Observación',
  reunion: 'Reunión',
  solicitud: 'Solicitud',
}

function estadoChipClass(estado: string) {
  const map: Record<string, 'info' | 'warning' | 'success'> = {
    Registrada: 'info',
    'Registrada sin PDF': 'warning',
    Cerrada: 'success',
  }
  return map[estado] ?? 'info'
}

function formatFecha(dateStr?: string) {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function getActaIdFromHash() {
  const [, query = ''] = window.location.hash.split('?')
  return new URLSearchParams(query).get('actaId')
}

function buildActaHash(actaId?: string | null) {
  const params = new URLSearchParams()

  if (actaId) {
    params.set('actaId', actaId)
  }

  const query = params.toString()
  return query ? `/acta?${query}` : '/acta'
}

type View = 'list' | 'tipo-selector' | 'form'

// ─── Componente principal ─────────────────────────────────────────────────────

export function ActaPage() {
  const [view, setView] = useState<View>('list')
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoActa | null>(null)
  const [actas, setActas] = useState<ActaVisitaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [detailActa, setDetailActa] = useState<ActaVisitaRow | null>(null)

  const loadActas = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    const { data, error } = await fetchActas()
    if (error) setLoadError(error)
    else setActas(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadInitialActas() {
      const { data, error } = await fetchActas()

      if (!isMounted) {
        return
      }

      if (error) {
        setLoadError(error)
      } else {
        setActas(data)
      }

      setLoading(false)
    }

    void loadInitialActas()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const syncDetailFromHash = () => {
      const actaId = getActaIdFromHash()

      if (!actaId) {
        setDetailActa(null)
        return
      }

      const matchedActa = actas.find((acta) => acta.id === actaId)
      if (matchedActa) {
        setDetailActa(matchedActa)
      }
    }

    syncDetailFromHash()
    window.addEventListener('hashchange', syncDetailFromHash)

    return () => window.removeEventListener('hashchange', syncDetailFromHash)
  }, [actas])

  const openActaDetail = useCallback((acta: ActaVisitaRow) => {
    setDetailActa(acta)
    window.location.hash = buildActaHash(acta.id)
  }, [])

  const closeActaDetail = useCallback(() => {
    setDetailActa(null)

    if (getActaIdFromHash()) {
      window.location.hash = buildActaHash()
    }
  }, [])

  function handleTipoSelect(tipo: TipoActa) {
    setTipoSeleccionado(tipo)
    setView('form')
  }

  async function handleFormSubmit(
    data: Omit<ActaVisita, 'id' | 'created_at' | 'updated_at' | 'pdf_path' | 'pdf_url' | 'asistencia_path' | 'asistencia_url'>,
    asistenciaFile: File | null,
  ) {
    setSubmitting(true)
    setSubmitMsg(null)

    const { id, folio, error: insertErr } = await insertActa(data)
    if (insertErr || !id) {
      setSubmitMsg({ type: 'error', text: insertErr ?? 'Error al guardar el acta.' })
      setSubmitting(false)
      return
    }

    let pdfOk = false
    let pdfErrorMsg = ''
    try {
      const fullActa = { ...data, id, folio: folio ?? undefined, estado: 'Registrada' as const }
      const pdfBytes = await generarActaPdf(fullActa)
      const { path, url, error: uploadErr } = await uploadActaPdf(id, pdfBytes)
      if (!uploadErr && path && url) {
        await updateActaPdf(id, path, url)
        pdfOk = true
      } else {
        pdfErrorMsg = uploadErr ?? 'No se pudo subir el PDF.'
      }
    } catch (e) {
      pdfErrorMsg = e instanceof Error ? e.message : 'Error generando PDF.'
    }

    if (asistenciaFile) {
      const { path, url, error: asistErr } = await uploadAsistenciaFile(id, asistenciaFile)
      if (!asistErr && path && url) {
        await updateActaAsistencia(id, path, url)
      }
    }

    if (!pdfOk) {
      await updateActaEstado(id, 'Registrada sin PDF')
      setSubmitMsg({
        type: 'error',
        text: `Acta guardada, pero el PDF falló: ${pdfErrorMsg} Puedes reintentar desde el detalle del acta.`,
      })
    } else {
      setSubmitMsg({ type: 'success', text: 'Acta guardada y PDF generado correctamente.' })
    }

    await loadActas()
    setSubmitting(false)
    setView('list')
    setTipoSeleccionado(null)
  }

  function handleCancel() {
    setView('list')
    setTipoSeleccionado(null)
    setSubmitMsg(null)
  }

  // ── Selector de tipo ────────────────────────────────────────────────────
  if (view === 'tipo-selector') {
    return (
      <div className="space-y-6">
        <HeaderCard />
        <Card tone="strong" className="p-6 sm:p-8">
          <ActaTipoSelector onSelect={handleTipoSelect} onCancel={handleCancel} />
        </Card>
      </div>
    )
  }

  // ── Formulario ──────────────────────────────────────────────────────────
  if (view === 'form' && tipoSeleccionado) {
    return (
      <div className="space-y-6">
        <Card tone="strong" className="p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" size="sm" onClick={handleCancel}>
              <ArrowLeftIcon />
              Volver
            </Button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0057B8]">Actas</p>
              <h3 className="text-xl font-light text-slate-800">
                Nueva acta — {TIPO_LABELS[tipoSeleccionado]}
              </h3>
            </div>
          </div>
        </Card>

        {submitMsg && (
          <Alert tone={submitMsg.type === 'success' ? 'success' : 'danger'}>
            {submitMsg.text}
          </Alert>
        )}

        <ActaForm
          tipo={tipoSeleccionado}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
          submitting={submitting}
        />
      </div>
    )
  }

  // ── Listado ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <HeaderCard onNueva={() => setView('tipo-selector')} />

      {submitMsg && (
        <Alert tone={submitMsg.type === 'success' ? 'success' : 'danger'}>
          {submitMsg.text}
          <Button type="button" variant="ghost" size="sm" className="ml-3 text-xs underline opacity-70 hover:bg-transparent hover:opacity-100" onClick={() => setSubmitMsg(null)}>
            Cerrar
          </Button>
        </Alert>
      )}

      <Card tone="surface" padding="none" className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Listado</p>
            <h4 className="mt-0.5 text-lg font-light text-slate-800">Actas registradas</h4>
          </div>
          {!loading && actas.length > 0 && (
            <p className="text-xs text-slate-400">{actas.length} registro{actas.length !== 1 ? 's' : ''}</p>
          )}
        </div>

        <DataTable responsive="md">
            <DataTableHead>
              <DataTableRow>
                <DataTableHeaderCell>Folio</DataTableHeaderCell>
                <DataTableHeaderCell>Fecha</DataTableHeaderCell>
                <DataTableHeaderCell>Tipo</DataTableHeaderCell>
                <DataTableHeaderCell>Establecimiento</DataTableHeaderCell>
                <DataTableHeaderCell>Horario</DataTableHeaderCell>
                <DataTableHeaderCell className="text-center">Partic.</DataTableHeaderCell>
                <DataTableHeaderCell className="text-center">Acuerdos</DataTableHeaderCell>
                <DataTableHeaderCell>Estado</DataTableHeaderCell>
                <DataTableHeaderCell className="normal-case" />
              </DataTableRow>
            </DataTableHead>
            <DataTableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <DataTableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <DataTableCell key={j} className="py-3">
                        <div className="skeleton h-4 rounded-md" style={{ width: j === 2 ? '180px' : '80px' }} />
                      </DataTableCell>
                    ))}
                  </DataTableRow>
                ))
              ) : loadError ? (
                <DataTableRow>
                    <DataTableCell colSpan={9} className="px-5 py-12 text-center text-sm text-red-600">
                    Error al cargar actas: {loadError}
                  </DataTableCell>
                </DataTableRow>
              ) : actas.length === 0 ? (
                <DataTableRow>
                    <DataTableCell colSpan={9} className="px-5 py-14 text-center text-slate-400">
                    <p className="text-sm font-medium">No hay actas registradas</p>
                    <p className="mt-1 text-xs">Usa &ldquo;Nueva acta&rdquo; para comenzar el registro.</p>
                  </DataTableCell>
                </DataTableRow>
              ) : (
                actas.map((acta) => (
                  <DataTableRow key={acta.id} className="group transition-colors hover:bg-blue-50/30">
                    <DataTableCell className="whitespace-nowrap font-mono text-xs font-semibold text-[#0033A0]">{acta.folio}</DataTableCell>
                    <DataTableCell className="whitespace-nowrap text-slate-700">{formatFecha(acta.fecha_visita)}</DataTableCell>
                    <DataTableCell>
                      <StatusBadge tone="info" className="text-xs">{TIPO_LABELS[acta.tipo_acta] ?? acta.tipo_acta}</StatusBadge>
                    </DataTableCell>
                    <DataTableCell>
                      <p className="font-medium leading-tight text-slate-800">{acta.establecimiento_nombre ?? '—'}</p>
                      {acta.establecimiento_comuna && (
                        <p className="text-xs text-slate-400">{acta.establecimiento_comuna}</p>
                      )}
                    </DataTableCell>
                    <DataTableCell className="whitespace-nowrap text-xs text-slate-500">
                      {acta.hora_inicio} – {acta.hora_termino}
                    </DataTableCell>
                    <DataTableCell className="text-center text-slate-600">{acta.participantes.length}</DataTableCell>
                    <DataTableCell className="text-center text-slate-600">{acta.acuerdos.length}</DataTableCell>
                    <DataTableCell>
                      <StatusBadge tone={estadoChipClass(acta.estado ?? 'Registrada')}>{acta.estado ?? 'Registrada'}</StatusBadge>
                    </DataTableCell>
                    <DataTableCell>
                      <Button type="button" variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100" onClick={() => openActaDetail(acta)}>
                        Ver
                      </Button>
                    </DataTableCell>
                  </DataTableRow>
                ))
              )}
            </DataTableBody>
        </DataTable>
      </Card>

      {detailActa && (
        <ActaDetailModal
          acta={detailActa}
          onClose={closeActaDetail}
          onUpdated={(updated) => {
            setActas((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
            setDetailActa(updated)
            window.location.hash = buildActaHash(updated.id)
          }}
        />
      )}
    </div>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function HeaderCard({ onNueva }: { onNueva?: () => void }) {
  return (
    <Card tone="strong" className="p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0057B8]">Actas</p>
          <h3 className="mt-2 text-3xl font-light text-slate-800">Gestor de actas</h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            Registro de sesiones, acuerdos, responsables y seguimiento de compromisos por establecimiento.
          </p>
        </div>
        {onNueva && (
          <Button type="button" onClick={onNueva}>
            <PlusIcon />
            Nueva acta
          </Button>
        )}
      </div>
    </Card>
  )
}
