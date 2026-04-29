import type { ActaVisitaRow } from '../../types/actas'
import { descargarActaPdf, generarActaPdf } from '../../lib/pdfActaService'
import { uploadActaPdf } from '../../lib/storageActasService'
import { updateActaPdf } from '../../lib/actasService'
import { useState } from 'react'

interface ActaDetailModalProps {
  acta: ActaVisitaRow
  onClose: () => void
  onUpdated: (acta: ActaVisitaRow) => void
}

const TIPO_LABELS: Record<string, string> = {
  asesoria: 'Asesoría',
  observacion: 'Observación',
  reunion: 'Reunión',
  solicitud: 'Solicitud',
}

const labelClass = 'text-xs font-semibold uppercase tracking-wide text-slate-400'
const valueClass = 'mt-0.5 text-sm text-slate-800'

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <p className={valueClass}>{value || <span className="text-slate-400">Sin dato</span>}</p>
    </div>
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
      <div className="h-px flex-1 bg-slate-100" />
      <span className="text-xs font-semibold uppercase tracking-widest text-[#0057B8]">{title}</span>
      <div className="h-px flex-1 bg-slate-100" />
    </div>
  )
}

function estadoChip(estado: string) {
  const map: Record<string, string> = {
    Registrada: 'status-chip status-info',
    'Registrada sin PDF': 'status-chip status-warning',
    Cerrada: 'status-chip status-success',
  }
  return map[estado] ?? 'status-chip status-info'
}

export function ActaDetailModal({ acta, onClose, onUpdated }: ActaDetailModalProps) {
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)

  async function handleGenerarPdf() {
    setPdfLoading(true)
    setPdfError(null)
    try {
      const pdfBytes = await generarActaPdf({ ...acta, id: acta.id })

      // Intentar subir a Storage
      const { path, url, error: uploadErr } = await uploadActaPdf(acta.id, pdfBytes)
      if (!uploadErr && path && url) {
        await updateActaPdf(acta.id, path, url)
        onUpdated({ ...acta, pdf_path: path, pdf_url: url, estado: 'Registrada' })
      } else if (uploadErr) {
        setPdfError(`PDF generado pero no se pudo subir: ${uploadErr}`)
      }

      // Descargar de todas formas
      const nombre = `acta-${acta.tipo_acta}-${acta.id.slice(0, 8)}.pdf`
      descargarActaPdf(pdfBytes, nombre)
    } catch (e) {
      setPdfError(e instanceof Error ? e.message : 'Error generando PDF')
    } finally {
      setPdfLoading(false)
    }
  }

  const fechaFmt = acta.fecha_visita
    ? new Date(acta.fecha_visita + 'T12:00:00').toLocaleDateString('es-CL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-8 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 rounded-t-3xl border-b border-slate-100 bg-slate-50 px-6 py-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={estadoChip(acta.estado ?? 'Registrada')}>{acta.estado}</span>
              {acta.folio && (
                <span className="rounded-full bg-[#0033A0] px-3 py-0.5 font-mono text-xs font-bold text-white">
                  {acta.folio}
                </span>
              )}
            </div>
            <h2 className="mt-2 text-xl font-light text-slate-800">
              Acta de {TIPO_LABELS[acta.tipo_acta] ?? acta.tipo_acta}
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">ID: {acta.id}</p>
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
            onClick={onClose}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-6 px-6 py-6">
          {/* 1. Establecimiento */}
          <section className="flex flex-col gap-4">
            <SectionTitle title="Establecimiento" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Nombre" value={acta.establecimiento_nombre} />
              <Field label="RBD" value={acta.establecimiento_rbd} />
              <Field label="Comuna" value={acta.establecimiento_comuna} />
            </div>
          </section>

          {/* 2. Fecha y hora */}
          <section className="flex flex-col gap-4">
            <SectionTitle title="Fecha y horario" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Fecha" value={fechaFmt} />
              <Field label="Hora inicio" value={acta.hora_inicio} />
              <Field label="Hora término" value={acta.hora_termino} />
            </div>
            {acta.created_by_nombre && (
              <Field label="Registrado por" value={acta.created_by_nombre} />
            )}
          </section>

          {/* 3. Participantes */}
          <section className="flex flex-col gap-3">
            <SectionTitle title={`Participantes (${acta.participantes.length})`} />
            {acta.participantes.length === 0 ? (
              <p className="text-sm text-slate-400">Sin participantes registrados.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">#</th>
                      <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Nombre</th>
                      <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Rol / Estamento</th>
                      <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Contacto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {acta.participantes.map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2 text-xs text-slate-400">{i + 1}</td>
                        <td className="px-4 py-2 font-medium text-slate-800">{p.nombre || '—'}</td>
                        <td className="px-4 py-2 text-slate-600">{p.rol_estamento || '—'}</td>
                        <td className="px-4 py-2 text-slate-500">{p.contacto || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* 4. Desarrollo */}
          <section className="flex flex-col gap-4">
            <SectionTitle title="Desarrollo de la visita" />
            <div>
              <p className={labelClass}>Temas anteriores tratados</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                {acta.temas_anteriores || <span className="text-slate-400">Sin información registrada.</span>}
              </p>
            </div>
            <div>
              <p className={labelClass}>Actividad realizada</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                {acta.actividad_realizada || <span className="text-slate-400">Sin información registrada.</span>}
              </p>
            </div>
          </section>

          {/* 5. Acuerdos */}
          <section className="flex flex-col gap-3">
            <SectionTitle title={`Acuerdos / Compromisos (${acta.acuerdos.length})`} />
            {acta.acuerdos.length === 0 ? (
              <p className="text-sm text-slate-400">Sin acuerdos registrados.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {acta.acuerdos.map((a, i) => {
                  const estadoChipClass: Record<string, string> = {
                    Pendiente: 'status-chip status-warning',
                    'En proceso': 'status-chip status-info',
                    Cumplido: 'status-chip status-success',
                  }
                  return (
                    <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0033A0]/10 text-xs font-bold text-[#0033A0]">
                            {i + 1}
                          </span>
                          <p className="text-sm text-slate-800">{a.descripcion}</p>
                        </div>
                        <span className={estadoChipClass[a.estado] ?? 'status-chip status-info'}>
                          {a.estado}
                        </span>
                      </div>
                      {(a.responsable || a.plazo) && (
                        <div className="mt-2 flex gap-4 pl-8 text-xs text-slate-500">
                          {a.responsable && <span>Responsable: <strong className="text-slate-700">{a.responsable}</strong></span>}
                          {a.plazo && <span>Plazo: <strong className="text-slate-700">{a.plazo}</strong></span>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-3xl border-t border-slate-100 px-6 py-4">
          <div className="flex flex-col gap-1">
            {acta.pdf_url ? (
              <a
                href={acta.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary gap-2 text-xs"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Abrir PDF
              </a>
            ) : (
              <button
                type="button"
                className="btn-secondary gap-2 text-xs"
                onClick={handleGenerarPdf}
                disabled={pdfLoading}
              >
                {pdfLoading ? (
                  <>
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" opacity=".3" />
                      <path d="M21 12a9 9 0 0 0-9-9" />
                    </svg>
                    Generando PDF…
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    {acta.estado === 'Registrada sin PDF' ? 'Reintentar PDF' : 'Generar PDF'}
                  </>
                )}
              </button>
            )}
            {pdfError && <p className="text-xs text-red-600">{pdfError}</p>}
          </div>

          <button type="button" className="btn-primary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
