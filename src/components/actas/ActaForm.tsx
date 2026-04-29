import { useState } from 'react'
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
  onSubmit: (data: Omit<ActaVisita, 'id' | 'created_at' | 'updated_at' | 'pdf_path' | 'pdf_url'>) => Promise<void>
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
const inputClass =
  'h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm transition focus:border-[#0057B8] focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 placeholder:text-slate-400'
const inputErrorClass =
  'h-9 w-full rounded-xl border border-red-400 bg-white px-3 text-sm text-slate-800 shadow-sm transition focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 placeholder:text-slate-400'

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

    await onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
      {/* Badge tipo */}
      <div className="flex items-center gap-3">
        <span className="status-chip status-info">{TIPO_LABELS[tipo]}</span>
        <span className="text-xs text-slate-400">Completa los campos obligatorios para guardar el acta.</span>
      </div>

      {/* ── 1. Información general ─────────────────────────────────────────── */}
      <section className="panel-card-strong flex flex-col gap-5 p-5">
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
            <input
              type="date"
              className={errors.fecha_visita ? inputErrorClass : inputClass}
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
            <input
              type="time"
              className={errors.hora_inicio ? inputErrorClass : inputClass}
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
            <input
              type="time"
              className={errors.hora_termino ? inputErrorClass : inputClass}
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
          <input
            type="text"
            className={inputClass}
            placeholder="Nombre Completo"
            value={form.created_by_nombre}
            onChange={(e) => setForm((f) => ({ ...f, created_by_nombre: e.target.value }))}
          />
        </div>
      </section>

      {/* ── 2. Participantes ─────────────────────────────────────────────── */}
      <section className="panel-card-strong flex flex-col gap-5 p-5">
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
      </section>

      {/* ── 3. Desarrollo de la visita ────────────────────────────────────── */}
      <section className="panel-card-strong flex flex-col gap-5 p-5">
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
      </section>

      {/* ── 4. Acuerdos ──────────────────────────────────────────────────── */}
      <section className="panel-card-strong flex flex-col gap-5 p-5">
        <SectionTitle n="4" title="Acuerdos, medidas y compromisos" />
        <AcuerdosFieldArray
          value={form.acuerdos}
          onChange={(a) => setForm((f) => ({ ...f, acuerdos: a }))}
        />
      </section>

      {/* ── Acciones ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary gap-2" disabled={submitting}>
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
        </button>
      </div>
    </form>
  )
}
