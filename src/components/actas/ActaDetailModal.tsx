import type { ActaVisitaRow } from '../../types/actas'
import { descargarActaPdf, generarActaPdf } from '../../lib/pdfActaService'
import { uploadActaPdf, uploadAsistenciaFile } from '../../lib/storageActasService'
import { updateActaPdf, updateActaAsistencia } from '../../lib/actasService'
import { useState, useRef } from 'react'
import { Button } from '../ui/Button'
import { Modal, ModalBody, ModalCloseButton, ModalFooter, ModalHeader } from '../ui/Modal'
import { StatusBadge } from '../ui/StatusBadge'
import { DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeaderCell, DataTableRow } from '../ui/Table'

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
  const map: Record<string, 'info' | 'warning' | 'success'> = {
    Registrada: 'info',
    'Registrada sin PDF': 'warning',
    Cerrada: 'success',
  }
  return map[estado] ?? 'info'
}

export function ActaDetailModal({ acta, onClose, onUpdated }: ActaDetailModalProps) {
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [asistenciaLoading, setAsistenciaLoading] = useState(false)
  const [asistenciaError, setAsistenciaError] = useState<string | null>(null)
  const asistenciaInputRef = useRef<HTMLInputElement>(null)

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

  async function handleUploadAsistencia(file: File) {
    setAsistenciaLoading(true)
    setAsistenciaError(null)
    const { path, url, error } = await uploadAsistenciaFile(acta.id, file)
    if (error || !path || !url) {
      setAsistenciaError(error ?? 'No se pudo subir el archivo.')
      setAsistenciaLoading(false)
      return
    }
    await updateActaAsistencia(acta.id, path, url)
    onUpdated({ ...acta, asistencia_path: path, asistencia_url: url })
    setAsistenciaLoading(false)
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
    <Modal onClose={onClose} panelClassName="max-w-3xl">
        <ModalHeader className="rounded-t-3xl bg-slate-50">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={estadoChip(acta.estado ?? 'Registrada')}>{acta.estado}</StatusBadge>
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
          <ModalCloseButton onClick={onClose} />
        </ModalHeader>

        {/* Body */}
        <ModalBody className="flex flex-col gap-6">
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
                <DataTable responsive="md">
                  <DataTableHead>
                    <DataTableRow className="text-left">
                      <DataTableHeaderCell>#</DataTableHeaderCell>
                      <DataTableHeaderCell>Nombre</DataTableHeaderCell>
                      <DataTableHeaderCell>Rol / Estamento</DataTableHeaderCell>
                      <DataTableHeaderCell>Contacto</DataTableHeaderCell>
                    </DataTableRow>
                  </DataTableHead>
                  <DataTableBody className="divide-slate-50">
                    {acta.participantes.map((p, i) => (
                      <DataTableRow key={i} className="hover:bg-slate-50/50">
                        <DataTableCell className="py-2 text-xs text-slate-400">{i + 1}</DataTableCell>
                        <DataTableCell className="py-2 font-medium text-slate-800">{p.nombre || '—'}</DataTableCell>
                        <DataTableCell className="py-2 text-slate-600">{p.rol_estamento || '—'}</DataTableCell>
                        <DataTableCell className="py-2 text-slate-500">{p.contacto || '—'}</DataTableCell>
                      </DataTableRow>
                    ))}
                  </DataTableBody>
                </DataTable>
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

          {/* 5. Lista de asistencia */}
          <section className="flex flex-col gap-3">
            <SectionTitle title="Lista de asistencia" />
            {acta.asistencia_url ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  Archivo subido
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={acta.asistencia_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex"
                  >
                    <Button variant="secondary" size="sm">Ver archivo</Button>
                  </a>
                  <label className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-200 transition">
                    Reemplazar
                    <input
                      ref={asistenciaInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) void handleUploadAsistencia(f)
                      }}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div>
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500 transition hover:border-[#0057B8] hover:bg-blue-50/40 hover:text-[#0057B8]">
                  {asistenciaLoading ? (
                    <>
                      <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" opacity=".3" />
                        <path d="M21 12a9 9 0 0 0-9-9" />
                      </svg>
                      Subiendo…
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Subir lista de asistencia (PDF, imagen)
                    </>
                  )}
                  <input
                    ref={asistenciaInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    className="sr-only"
                    disabled={asistenciaLoading}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) void handleUploadAsistencia(f)
                    }}
                  />
                </label>
                {asistenciaError && <p className="mt-1 text-xs text-red-600">{asistenciaError}</p>}
              </div>
            )}
          </section>

          {/* 6. Acuerdos */}
          <section className="flex flex-col gap-3">
            <SectionTitle title={`Acuerdos / Compromisos (${acta.acuerdos.length})`} />
            {acta.acuerdos.length === 0 ? (
              <p className="text-sm text-slate-400">Sin acuerdos registrados.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {acta.acuerdos.map((a, i) => {
                  const estadoChipClass: Record<string, 'warning' | 'info' | 'success'> = {
                    Pendiente: 'warning',
                    'En proceso': 'info',
                    Cumplido: 'success',
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
                        <StatusBadge tone={estadoChipClass[a.estado] ?? 'info'}>
                          {a.estado}
                        </StatusBadge>
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
        </ModalBody>

        {/* Footer */}
        <ModalFooter className="rounded-b-3xl">
          <div className="flex flex-col gap-1">
            {acta.pdf_url ? (
              <a
                href={acta.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Button variant="secondary" size="sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  Abrir PDF
                </Button>
              </a>
            ) : (
              <Button type="button" variant="secondary" size="sm" onClick={handleGenerarPdf} disabled={pdfLoading}>
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
              </Button>
            )}
            {pdfError && <p className="text-xs text-red-600">{pdfError}</p>}
          </div>

          <Button type="button" onClick={onClose}>
            Cerrar
          </Button>
        </ModalFooter>
    </Modal>
  )
}
