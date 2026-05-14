import { useState } from 'react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { StatusBadge } from '../ui/StatusBadge'
import type { TipoActa, ActaVisita, ParticipanteActa, AcuerdoActa, EscuelaSLEP } from '../../types/actas'
import { EstablecimientoSelect } from './EstablecimientoSelect'
import { ParticipantesFieldArray } from './ParticipantesFieldArray'
import { AcuerdosFieldArray } from './AcuerdosFieldArray'
import { AutoResizeTextarea } from './AutoResizeTextarea'

interface FormState {
  establecimiento: EscuelaSLEP | null
  fecha_visita: string
  hora_inicio: string
  hora_termino: string
  participantes: ParticipanteActa[]
  temas_anteriores: string
  actividad_realizada: string
  acuerdos: AcuerdoActa[]
  created_by_nombre: string
}

interface FormErrors {
  establecimiento?: string
  fecha_visita?: string
  hora_inicio?: string
  hora_termino?: string
  participantes?: string
}

interface ActaFormProps {
  tipo: TipoActa
  onSubmit: (
    data: Omit<ActaVisita, 'id' | 'created_at' | 'updated_at' | 'pdf_path' | 'pdf_url' | 'asistencia_path' | 'asistencia_url'>,
    asistenciaFile: File | null,
  ) => Promise<void>
  onCancel: () => void
  submitting?: boolean
  submitLabel?: string
}

function todayIso() {
  const d = new Date()
  return d.toISOString().split('T')[0]
}

const TIPO_LABELS: Record<TipoActa, string> = {
  asesoria: 'Asesoría',
  observacion: 'Observación',
  reunion: 'Reunión',
  solicitud: 'Solicitud',
}

const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1'
const inputClass = 'text-sm shadow-sm'
const inputErrorClass = 'border-red-400 focus:border-red-500 focus:ring-red-200'

function SectionTitle({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0033A0] text-xs font-bold text-white">
        {n}
      </span>
      <span className="text-sm font-semibold text-slate-700">{title}</span>
    </div>
  )
}

export function ActaForm({
  tipo,
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel = 'Guardar acta',
}: ActaFormProps) {
  const [form, setForm] = useState<FormState>({
    establecimiento: null,
    fecha_visita: todayIso(),
    hora_inicio: '',
    hora_termino: '',
    participantes: [],
    temas_anteriores: '',
    actividad_realizada: '',
    acuerdos: [],
    created_by_nombre: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [asistenciaFile, setAsistenciaFile] = useState<File | null>(null)

  function validate(): boolean {
    const e: FormErrors = {}
    if (!form.establecimiento) e.establecimiento = 'Selecciona un establecimiento.'
    if (!form.fecha_visita) e.fecha_visita = 'Ingresa la fecha de la visita.'
    if (!form.hora_inicio) e.hora_inicio = 'Ingresa la hora de inicio.'
    if (!form.hora_termino) e.hora_termino = 'Ingresa la hora de término.'
    if (form.participantes.length === 0)
      e.participantes = 'Agrega al menos un participante.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const escuela = form.establecimiento!
    const data: Omit<ActaVisita, 'id' | 'created_at' | 'updated_at' | 'pdf_path' | 'pdf_url'> = {
      tipo_acta: tipo,
      establecimiento_id: String(escuela['N°']),
      establecimiento_nombre: String(escuela['NOMBRE ESTABLECIMIENTO']),
      establecimiento_rbd: String(escuela['RBD']),
      establecimiento_comuna: String(escuela['COMUNA']),
      fecha_visita: form.fecha_visita,
      hora_inicio: form.hora_inicio,
      hora_termino: form.hora_termino,
      participantes: form.participantes.filter((p) => p.nombre.trim()),
      temas_anteriores: form.temas_anteriores || undefined,
      actividad_realizada: form.actividad_realizada || undefined,
      acuerdos: form.acuerdos.filter((a) => a.descripcion.trim()),
      created_by_nombre: form.created_by_nombre || undefined,
    }

    await onSubmit(data, asistenciaFile)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
      {/* Badge tipo */}
      <div className="flex items-center gap-3">
        <StatusBadge tone="info">{TIPO_LABELS[tipo]}</StatusBadge>
        <span className="text-xs text-slate-400">Completa los campos obligatorios para guardar el acta.</span>
      </div>

      {/* ── 1. Información general ─────────────────────────────────────────── */}
      <Card tone="strong" className="flex flex-col gap-5 p-5">
        <SectionTitle n="1" title="Información general" />

        <div>
          <label className={labelClass}>
            Establecimiento <span className="text-red-500">*</span>
          </label>
          <EstablecimientoSelect
            value={form.establecimiento ? String(form.establecimiento['N°']) : ''}
            onChange={(escuela) => {
              setForm((f) => ({ ...f, establecimiento: escuela }))
              if (escuela) setErrors((er) => ({ ...er, establecimiento: undefined }))
            }}
            error={errors.establecimiento}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>
              Fecha de visita <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              className={errors.fecha_visita ? `${inputClass} ${inputErrorClass}` : inputClass}
              value={form.fecha_visita}
              onChange={(e) => {
                setForm((f) => ({ ...f, fecha_visita: e.target.value }))
                setErrors((er) => ({ ...er, fecha_visita: undefined }))
              }}
            />
            {errors.fecha_visita && (
              <p className="mt-1 text-xs text-red-600">{errors.fecha_visita}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>
              Hora inicio <span className="text-red-500">*</span>
            </label>
            <Input
              type="time"
              className={errors.hora_inicio ? `${inputClass} ${inputErrorClass}` : inputClass}
              value={form.hora_inicio}
              onChange={(e) => {
                setForm((f) => ({ ...f, hora_inicio: e.target.value }))
                setErrors((er) => ({ ...er, hora_inicio: undefined }))
              }}
            />
            {errors.hora_inicio && (
              <p className="mt-1 text-xs text-red-600">{errors.hora_inicio}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>
              Hora término <span className="text-red-500">*</span>
            </label>
            <Input
              type="time"
              className={errors.hora_termino ? `${inputClass} ${inputErrorClass}` : inputClass}
              value={form.hora_termino}
              onChange={(e) => {
                setForm((f) => ({ ...f, hora_termino: e.target.value }))
                setErrors((er) => ({ ...er, hora_termino: undefined }))
              }}
            />
            {errors.hora_termino && (
              <p className="mt-1 text-xs text-red-600">{errors.hora_termino}</p>
            )}
          </div>
        </div>

        <div>
          <label className={labelClass}>Registrado por:</label>
          <Input
            type="text"
            className={inputClass}
            placeholder="Nombre Completo"
            value={form.created_by_nombre}
            onChange={(e) => setForm((f) => ({ ...f, created_by_nombre: e.target.value }))}
          />
        </div>
      </Card>

      {/* ── 2. Participantes ─────────────────────────────────────────────── */}
      <Card tone="strong" className="flex flex-col gap-5 p-5">
        <SectionTitle n="2" title="Participantes" />
        <ParticipantesFieldArray
          value={form.participantes}
          onChange={(p) => {
            setForm((f) => ({ ...f, participantes: p }))
            if (p.length > 0) setErrors((er) => ({ ...er, participantes: undefined }))
          }}
        />
        {errors.participantes && (
          <p className="-mt-2 text-xs text-red-600">{errors.participantes}</p>
        )}
      </Card>

      {/* ── 3. Desarrollo de la visita ────────────────────────────────────── */}
      <Card tone="strong" className="flex flex-col gap-5 p-5">
        <SectionTitle n="3" title="Desarrollo de la visita" />

        <AutoResizeTextarea
          label="Temas anteriores tratados (seguimiento de visita previa)"
          placeholder="Describe los temas de seguimiento de la visita anterior…"
          value={form.temas_anteriores}
          onChange={(e) => setForm((f) => ({ ...f, temas_anteriores: e.target.value }))}
        />

        <AutoResizeTextarea
          label="Actividad realizada en esta visita"
          placeholder="Describe la actividad principal realizada durante la asesoría…"
          value={form.actividad_realizada}
          onChange={(e) => setForm((f) => ({ ...f, actividad_realizada: e.target.value }))}
        />
      </Card>

      {/* ── 4. Acuerdos ──────────────────────────────────────────────────── */}
      <Card tone="strong" className="flex flex-col gap-5 p-5">
        <SectionTitle n="4" title="Acuerdos, medidas y compromisos" />
        <AcuerdosFieldArray
          value={form.acuerdos}
          onChange={(a) => setForm((f) => ({ ...f, acuerdos: a }))}
        />
      </Card>

      {/* ── 5. Lista de asistencia ───────────────────────────────────────── */}
      <Card tone="strong" className="flex flex-col gap-5 p-5">
        <SectionTitle n="5" title="Lista de asistencia (opcional)" />
        <div>
          <label className={labelClass}>Archivo (PDF, imagen)</label>
          <div className="mt-1 flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500 transition hover:border-[#0057B8] hover:bg-blue-50/40 hover:text-[#0057B8]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              {asistenciaFile ? asistenciaFile.name : 'Seleccionar archivo'}
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="sr-only"
                onChange={(e) => setAsistenciaFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {asistenciaFile && (
              <button
                type="button"
                className="text-xs text-slate-400 underline hover:text-red-600"
                onClick={() => setAsistenciaFile(null)}
              >
                Quitar
              </button>
            )}
          </div>
          <p className="mt-1.5 text-xs text-slate-400">Se subirá junto con el acta. Formatos aceptados: PDF, JPG, PNG.</p>
        </div>
      </Card>

      {/* ── Acciones ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" opacity=".3" />
                <path d="M21 12a9 9 0 0 0-9-9" />
              </svg>
              Guardando…
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  )
}
