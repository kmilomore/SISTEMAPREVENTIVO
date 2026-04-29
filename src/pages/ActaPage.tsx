import { useState, useEffect, useCallback } from 'react'
import type { TipoActa, ActaVisita, ActaVisitaRow } from '../types/actas'
import { ActaTipoSelector } from '../components/actas/ActaTipoSelector'
import { ActaForm } from '../components/actas/ActaForm'
import { ActaDetailModal } from '../components/actas/ActaDetailModal'
import { fetchActas, insertActa, updateActaPdf, updateActaEstado } from '../lib/actasService'
import { generarActaPdf } from '../lib/pdfActaService'
import { uploadActaPdf } from '../lib/storageActasService'

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
  const map: Record<string, string> = {
    Registrada: 'status-chip status-info',
    'Registrada sin PDF': 'status-chip status-warning',
    Cerrada: 'status-chip status-success',
  }
  return map[estado] ?? 'status-chip status-info'
}

function formatFecha(dateStr?: string) {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
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
    loadActas()
  }, [loadActas])

  function handleTipoSelect(tipo: TipoActa) {
    setTipoSeleccionado(tipo)
    setView('form')
  }

  async function handleFormSubmit(
    data: Omit<ActaVisita, 'id' | 'created_at' | 'updated_at' | 'pdf_path' | 'pdf_url'>,
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
        <div className="panel-card-strong p-6 sm:p-8">
          <ActaTipoSelector onSelect={handleTipoSelect} onCancel={handleCancel} />
        </div>
      </div>
    )
  }

  // ── Formulario ──────────────────────────────────────────────────────────
  if (view === 'form' && tipoSeleccionado) {
    return (
      <div className="space-y-6">
        <div className="panel-card-strong p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <button type="button" className="btn-secondary gap-2 text-xs" onClick={handleCancel}>
              <ArrowLeftIcon />
              Volver
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0057B8]">Actas</p>
              <h3 className="text-xl font-light text-slate-800">
                Nueva acta — {TIPO_LABELS[tipoSeleccionado]}
              </h3>
            </div>
          </div>
        </div>

        {submitMsg && (
          <div
            className={`rounded-2xl px-5 py-4 text-sm ${
              submitMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {submitMsg.text}
          </div>
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
        <div
          className={`rounded-2xl px-5 py-4 text-sm ${
            submitMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {submitMsg.text}
          <button
            type="button"
            className="ml-3 text-xs underline opacity-70 hover:opacity-100"
            onClick={() => setSubmitMsg(null)}
          >
            Cerrar
          </button>
        </div>
      )}

      <section className="table-shell">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Listado</p>
            <h4 className="mt-0.5 text-lg font-light text-slate-800">Actas registradas</h4>
          </div>
          {!loading && actas.length > 0 && (
            <p className="text-xs text-slate-400">{actas.length} registro{actas.length !== 1 ? 's' : ''}</p>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Folio</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Fecha</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Tipo</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Establecimiento</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Horario</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Partic.</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Acuerdos</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="skeleton h-4 rounded-md" style={{ width: j === 2 ? '180px' : '80px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : loadError ? (
                <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-sm text-red-600">
                    Error al cargar actas: {loadError}
                  </td>
                </tr>
              ) : actas.length === 0 ? (
                <tr>
                    <td colSpan={9} className="px-5 py-14 text-center text-slate-400">
                    <p className="text-sm font-medium">No hay actas registradas</p>
                    <p className="mt-1 text-xs">Usa &ldquo;Nueva acta&rdquo; para comenzar el registro.</p>
                  </td>
                </tr>
              ) : (
                actas.map((acta) => (
                  <tr key={acta.id} className="group transition-colors hover:bg-blue-50/30">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-[#0033A0]">{acta.folio}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatFecha(acta.fecha_visita)}</td>
                    <td className="px-4 py-3">
                      <span className="status-chip status-info text-xs">{TIPO_LABELS[acta.tipo_acta] ?? acta.tipo_acta}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium leading-tight text-slate-800">{acta.establecimiento_nombre ?? '—'}</p>
                      {acta.establecimiento_comuna && (
                        <p className="text-xs text-slate-400">{acta.establecimiento_comuna}</p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                      {acta.hora_inicio} – {acta.hora_termino}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">{acta.participantes.length}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{acta.acuerdos.length}</td>
                    <td className="px-4 py-3">
                      <span className={estadoChipClass(acta.estado ?? 'Registrada')}>{acta.estado ?? 'Registrada'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#0033A0] opacity-0 transition hover:bg-[#e8f0ff] group-hover:opacity-100"
                        onClick={() => setDetailActa(acta)}
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {detailActa && (
        <ActaDetailModal
          acta={detailActa}
          onClose={() => setDetailActa(null)}
          onUpdated={(updated) => {
            setActas((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
            setDetailActa(updated)
          }}
        />
      )}
    </div>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function HeaderCard({ onNueva }: { onNueva?: () => void }) {
  return (
    <div className="panel-card-strong p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0057B8]">Actas</p>
          <h3 className="mt-2 text-3xl font-light text-slate-800">Gestor de actas</h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            Registro de sesiones, acuerdos, responsables y seguimiento de compromisos por establecimiento.
          </p>
        </div>
        {onNueva && (
          <button type="button" className="btn-primary gap-2" onClick={onNueva}>
            <PlusIcon />
            Nueva acta
          </button>
        )}
      </div>
    </div>
  )
}
