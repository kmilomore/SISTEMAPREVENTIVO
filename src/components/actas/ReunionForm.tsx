import { useState } from 'react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import type {
  ActaVisita,
  ParticipanteActa,
  AcuerdoActa,
  EscuelaSLEP,
  TipoReunion,
  OrganizacionReunion,
  Organizacion,
} from '../../types/actas'
import { EstablecimientoSelect } from './EstablecimientoSelect'
import { OrganizacionSelect } from './OrganizacionSelect'
import { ParticipantesFieldArray } from './ParticipantesFieldArray'
import { AcuerdosFieldArray } from './AcuerdosFieldArray'
import { AutoResizeTextarea } from './AutoResizeTextarea'
import { insertOrganizacion } from '../../lib/organizacionesService'

const TIPO_REUNION_OPTIONS: { id: TipoReunion; label: string; desc: string }[] = [
  {
    id: 'establecimiento',
    label: 'Establecimiento escolar',
    desc: 'Reunión en o con un establecimiento educacional del SLEP.',
  },
  {
    id: 'organismo_publico',
    label: 'Organismo público',
    desc: 'Municipalidad, ministerio u otro servicio del Estado.',
  },
  {
    id: 'empresa_privada',
    label: 'Empresa privada',
    desc: 'Empresa, proveedor o entidad privada.',
  },
  {
    id: 'ong',
    label: 'ONG / Fundación',
    desc: 'Organización sin fines de lucro o fundación.',
  },
  {
    id: 'equipo_interno',
    label: 'Equipo interno SLEP',
    desc: 'Reunión entre equipos del SLEP Colchagua.',
  },
  {
    id: 'otro',
    label: 'Otro',
    desc: 'Otro tipo de contraparte u organización.',
  },
]

interface OrgFields {
  tipo_otro: string
  nombre: string
  direccion: string
  contacto_nombre: string
  contacto_cargo: string
  contacto_email: string
  contacto_telefono: string
}

interface FormState {
  tipo_reunion: TipoReunion
  // Organización del catálogo (null = nueva)
  catalogOrg: Organizacion | null
  org: OrgFields
  // Establecimiento escolar
  establecimiento: EscuelaSLEP | null
  // General
  fecha_visita: string
  hora_inicio: string
  hora_termino: string
  created_by_nombre: string
  participantes: ParticipanteActa[]
  temas_anteriores: string
  actividad_realizada: string
  acuerdos: AcuerdoActa[]
}

interface FormErrors {
  org_nombre?: string
  establecimiento?: string
  fecha_visita?: string
  hora_inicio?: string
  hora_termino?: string
}

export interface ReunionFormProps {
  onSubmit: (
    data: Omit<
      ActaVisita,
      'id' | 'created_at' | 'updated_at' | 'pdf_path' | 'pdf_url' | 'asistencia_path' | 'asistencia_url'
    >,
    asistenciaFile: File | null,
  ) => Promise<void>
  onCancel: () => void
  submitting?: boolean
}

function todayIso() {
  return new Date().toISOString().split('T')[0]
}

const emptyOrg = (): OrgFields => ({
  tipo_otro: '',
  nombre: '',
  direccion: '',
  contacto_nombre: '',
  contacto_cargo: '',
  contacto_email: '',
  contacto_telefono: '',
})

function orgFromCatalog(c: Organizacion): OrgFields {
  return {
    tipo_otro: c.tipo_otro ?? '',
    nombre: c.nombre,
    direccion: c.direccion ?? '',
    contacto_nombre: c.contacto_nombre ?? '',
    contacto_cargo: c.contacto_cargo ?? '',
    contacto_email: c.contacto_email ?? '',
    contacto_telefono: c.contacto_telefono ?? '',
  }
}

const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1'
const inputClass = 'text-sm shadow-sm'

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

export function ReunionForm({ onSubmit, onCancel, submitting = false }: ReunionFormProps) {
  const [form, setForm] = useState<FormState>({
    tipo_reunion: 'establecimiento',
    catalogOrg: null,
    org: emptyOrg(),
    establecimiento: null,
    fecha_visita: todayIso(),
    hora_inicio: '',
    hora_termino: '',
    created_by_nombre: '',
    participantes: [{ nombre: '', rol_estamento: '', contacto: '' }],
    temas_anteriores: '',
    actividad_realizada: '',
    acuerdos: [],
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [asistenciaFile, setAsistenciaFile] = useState<File | null>(null)
  const [orgError, setOrgError] = useState<string | null>(null)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function setOrg(field: keyof OrgFields, value: string) {
    setForm((prev) => ({ ...prev, org: { ...prev.org, [field]: value } }))
  }

  function handleCatalogSelect(org: Organizacion | null) {
    if (org) {
      setForm((prev) => ({ ...prev, catalogOrg: org, org: orgFromCatalog(org) }))
    } else {
      setForm((prev) => ({ ...prev, catalogOrg: null, org: emptyOrg() }))
    }
  }

  function handleCreateNew(nombre: string) {
    setForm((prev) => ({
      ...prev,
      catalogOrg: null,
      org: { ...emptyOrg(), nombre },
    }))
  }

  function validate(): boolean {
    const e: FormErrors = {}
    if (!form.fecha_visita) e.fecha_visita = 'Campo obligatorio.'
    if (!form.hora_inicio) e.hora_inicio = 'Campo obligatorio.'
    if (!form.hora_termino) e.hora_termino = 'Campo obligatorio.'
    if (form.tipo_reunion === 'establecimiento' && !form.establecimiento) {
      e.establecimiento = 'Selecciona un establecimiento.'
    }
    if (
      form.tipo_reunion !== 'establecimiento' &&
      form.tipo_reunion !== 'equipo_interno' &&
      !form.org.nombre.trim()
    ) {
      e.org_nombre = 'Ingresa el nombre de la organización.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setOrgError(null)

    const isSchool = form.tipo_reunion === 'establecimiento'
    const isInternal = form.tipo_reunion === 'equipo_interno'
    const school = form.establecimiento

    // ── Resolver organizacion_id ─────────────────────────────────────────────
    let organizacionId: string | undefined

    if (!isSchool && !isInternal) {
      if (form.catalogOrg) {
        // Org existente del catálogo
        organizacionId = form.catalogOrg.id
      } else {
        // Nueva organización — insertar en el catálogo primero
        const { data: newOrg, error: insertErr } = await insertOrganizacion({
          tipo: form.tipo_reunion,
          ...(form.tipo_reunion === 'otro' && form.org.tipo_otro
            ? { tipo_otro: form.org.tipo_otro }
            : {}),
          nombre: form.org.nombre.trim(),
          ...(form.org.direccion ? { direccion: form.org.direccion } : {}),
          ...(form.org.contacto_nombre ? { contacto_nombre: form.org.contacto_nombre } : {}),
          ...(form.org.contacto_cargo ? { contacto_cargo: form.org.contacto_cargo } : {}),
          ...(form.org.contacto_email ? { contacto_email: form.org.contacto_email } : {}),
          ...(form.org.contacto_telefono ? { contacto_telefono: form.org.contacto_telefono } : {}),
        })

        if (insertErr || !newOrg) {
          setOrgError(`No se pudo guardar la organización en el catálogo: ${insertErr ?? 'error desconocido'}`)
          return
        }
        organizacionId = newOrg.id
      }
    }

    // ── Armar objeto OrganizacionReunion para el JSONB ───────────────────────
    const organizacion: OrganizacionReunion = isSchool || isInternal
      ? { tipo: form.tipo_reunion }
      : {
          tipo: form.tipo_reunion,
          ...(form.tipo_reunion === 'otro' && form.org.tipo_otro
            ? { tipo_otro: form.org.tipo_otro }
            : {}),
          ...(form.org.nombre ? { nombre: form.org.nombre } : {}),
          ...(form.org.direccion ? { direccion: form.org.direccion } : {}),
          ...(form.org.contacto_nombre ? { contacto_nombre: form.org.contacto_nombre } : {}),
          ...(form.org.contacto_cargo ? { contacto_cargo: form.org.contacto_cargo } : {}),
          ...(form.org.contacto_email ? { contacto_email: form.org.contacto_email } : {}),
          ...(form.org.contacto_telefono ? { contacto_telefono: form.org.contacto_telefono } : {}),
        }

    const data: Omit<
      ActaVisita,
      'id' | 'created_at' | 'updated_at' | 'pdf_path' | 'pdf_url' | 'asistencia_path' | 'asistencia_url'
    > = {
      tipo_acta: 'reunion',
      tipo_reunion: form.tipo_reunion,
      organizacion,
      organizacion_id: organizacionId,
      establecimiento_id: isSchool ? String(school!['N°']) : '',
      establecimiento_nombre: isSchool
        ? school!['NOMBRE ESTABLECIMIENTO']
        : isInternal
          ? 'Equipo interno SLEP'
          : form.org.nombre,
      establecimiento_rbd: isSchool ? school!['RBD'] : '',
      establecimiento_comuna: isSchool ? school!['COMUNA'] : '',
      fecha_visita: form.fecha_visita,
      hora_inicio: form.hora_inicio,
      hora_termino: form.hora_termino,
      created_by_nombre: form.created_by_nombre,
      participantes: form.participantes.filter((p) => p.nombre.trim()),
      temas_anteriores: form.temas_anteriores,
      actividad_realizada: form.actividad_realizada,
      acuerdos: form.acuerdos,
    }

    await onSubmit(data, asistenciaFile)
  }

  const showOrgFields =
    form.tipo_reunion !== 'establecimiento' && form.tipo_reunion !== 'equipo_interno'

  return (
    <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-4">

      {/* ── 1. Información general ──────────────────────────────────────── */}
      <Card tone="surface" className="p-5 sm:p-6 space-y-5">
        <SectionTitle n="1" title="Información general" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Fecha de la reunión</label>
            <Input
              type="date"
              className={inputClass}
              value={form.fecha_visita}
              onChange={(e) => set('fecha_visita', e.target.value)}
            />
            {errors.fecha_visita && (
              <p className="mt-1 text-xs text-red-500">{errors.fecha_visita}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Hora inicio</label>
            <Input
              type="time"
              className={inputClass}
              value={form.hora_inicio}
              onChange={(e) => set('hora_inicio', e.target.value)}
            />
            {errors.hora_inicio && (
              <p className="mt-1 text-xs text-red-500">{errors.hora_inicio}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Hora término</label>
            <Input
              type="time"
              className={inputClass}
              value={form.hora_termino}
              onChange={(e) => set('hora_termino', e.target.value)}
            />
            {errors.hora_termino && (
              <p className="mt-1 text-xs text-red-500">{errors.hora_termino}</p>
            )}
          </div>
        </div>
        <div className="max-w-xs">
          <label className={labelClass}>Registrado por</label>
          <Input
            type="text"
            className={inputClass}
            placeholder="Nombre del profesional SLEP"
            value={form.created_by_nombre}
            onChange={(e) => set('created_by_nombre', e.target.value)}
          />
        </div>
      </Card>

      {/* ── 2. Contexto de la reunión ───────────────────────────────────── */}
      <Card tone="surface" className="p-5 sm:p-6 space-y-5">
        <SectionTitle n="2" title="Contexto de la reunión" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TIPO_REUNION_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                set('tipo_reunion', opt.id)
                set('catalogOrg', null)
                set('org', emptyOrg())
                set('establecimiento', null)
              }}
              className={`flex flex-col gap-1 rounded-xl border p-4 text-left transition ${
                form.tipo_reunion === opt.id
                  ? 'border-[#0033A0] bg-[#f0f4ff] shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <span
                className={`text-sm font-semibold ${
                  form.tipo_reunion === opt.id ? 'text-[#0033A0]' : 'text-slate-800'
                }`}
              >
                {opt.label}
              </span>
              <span className="text-xs leading-relaxed text-slate-500">{opt.desc}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* ── 3. Caracterización de la organización ──────────────────────── */}
      <Card tone="surface" className="p-5 sm:p-6 space-y-5">
        <SectionTitle n="3" title="Caracterización de la organización" />

        {form.tipo_reunion === 'establecimiento' && (
          <div>
            <label className={labelClass}>
              Establecimiento educacional <span className="text-red-400">*</span>
            </label>
            <EstablecimientoSelect
              value={form.establecimiento ? String(form.establecimiento['N°']) : ''}
              onChange={(school) => set('establecimiento', school)}
              error={errors.establecimiento}
            />
          </div>
        )}

        {form.tipo_reunion === 'equipo_interno' && (
          <p className="text-sm text-slate-500">
            Reunión interna del equipo SLEP Colchagua. No se requiere información adicional de
            organización externa.
          </p>
        )}

        {showOrgFields && (
          <div className="space-y-5">
            {/* Selector del catálogo */}
            <div>
              <label className={labelClass}>Buscar en el catálogo de organizaciones</label>
              <OrganizacionSelect
                value={form.catalogOrg}
                onChange={handleCatalogSelect}
                onCreateNew={handleCreateNew}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-slate-400">
                  {form.catalogOrg ? 'datos pre-rellenados desde el catálogo (editables)' : 'o ingresa los datos de la nueva organización'}
                </span>
              </div>
            </div>

            {/* Campos de la organización */}
            {form.tipo_reunion === 'otro' && (
              <div className="max-w-sm">
                <label className={labelClass}>Especifica el tipo</label>
                <Input
                  type="text"
                  className={inputClass}
                  placeholder="Ej: Junta de vecinos, Club deportivo…"
                  value={form.org.tipo_otro}
                  onChange={(e) => setOrg('tipo_otro', e.target.value)}
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>
                  Nombre de la organización <span className="text-red-400">*</span>
                </label>
                <Input
                  type="text"
                  className={`${inputClass}${errors.org_nombre ? ' border-red-400' : ''}`}
                  placeholder="Nombre oficial"
                  value={form.org.nombre}
                  onChange={(e) => {
                    setOrg('nombre', e.target.value)
                    if (form.catalogOrg) set('catalogOrg', null)
                  }}
                />
                {errors.org_nombre && (
                  <p className="mt-1 text-xs text-red-500">{errors.org_nombre}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>Dirección</label>
                <Input
                  type="text"
                  className={inputClass}
                  placeholder="Dirección física (opcional)"
                  value={form.org.direccion}
                  onChange={(e) => setOrg('direccion', e.target.value)}
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Persona de contacto
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Nombre</label>
                  <Input
                    type="text"
                    className={inputClass}
                    placeholder="Nombre del contacto"
                    value={form.org.contacto_nombre}
                    onChange={(e) => setOrg('contacto_nombre', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Cargo</label>
                  <Input
                    type="text"
                    className={inputClass}
                    placeholder="Cargo o rol"
                    value={form.org.contacto_cargo}
                    onChange={(e) => setOrg('contacto_cargo', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Correo electrónico</label>
                  <Input
                    type="email"
                    className={inputClass}
                    placeholder="correo@ejemplo.cl"
                    value={form.org.contacto_email}
                    onChange={(e) => setOrg('contacto_email', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Teléfono</label>
                  <Input
                    type="tel"
                    className={inputClass}
                    placeholder="+56 9 1234 5678"
                    value={form.org.contacto_telefono}
                    onChange={(e) => setOrg('contacto_telefono', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {orgError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{orgError}</p>
            )}
          </div>
        )}
      </Card>

      {/* ── 4. Participantes ────────────────────────────────────────────── */}
      <Card tone="surface" className="p-5 sm:p-6 space-y-5">
        <SectionTitle n="4" title="Participantes" />
        <ParticipantesFieldArray
          value={form.participantes}
          onChange={(participantes) => set('participantes', participantes)}
        />
      </Card>

      {/* ── 5. Desarrollo ───────────────────────────────────────────────── */}
      <Card tone="surface" className="p-5 sm:p-6 space-y-5">
        <SectionTitle n="5" title="Desarrollo de la reunión" />
        <div>
          <label className={labelClass}>Temas anteriores / seguimiento</label>
          <AutoResizeTextarea
            placeholder="Seguimiento de reuniones previas o compromisos pendientes…"
            value={form.temas_anteriores}
            onChange={(e) => set('temas_anteriores', e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Orden del día / actividad realizada</label>
          <AutoResizeTextarea
            placeholder="Descripción de los temas tratados y actividades realizadas…"
            value={form.actividad_realizada}
            onChange={(e) => set('actividad_realizada', e.target.value)}
          />
        </div>
      </Card>

      {/* ── 6. Acuerdos ─────────────────────────────────────────────────── */}
      <Card tone="surface" className="p-5 sm:p-6 space-y-5">
        <SectionTitle n="6" title="Acuerdos y compromisos" />
        <AcuerdosFieldArray
          value={form.acuerdos}
          onChange={(acuerdos) => set('acuerdos', acuerdos)}
        />
      </Card>

      {/* ── 7. Lista de asistencia ──────────────────────────────────────── */}
      <Card tone="surface" className="p-5 sm:p-6 space-y-4">
        <SectionTitle n="7" title="Lista de asistencia" />
        <p className="text-xs text-slate-500">
          Adjunta la lista de asistencia firmada (PDF o imagen). Opcional.
        </p>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="block text-sm text-slate-600"
          onChange={(e) => setAsistenciaFile(e.target.files?.[0] ?? null)}
        />
        {asistenciaFile && (
          <p className="text-xs text-green-600">Archivo seleccionado: {asistenciaFile.name}</p>
        )}
      </Card>

      {/* ── Acciones ────────────────────────────────────────────────────── */}
      <div className="flex justify-end gap-3 pb-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Guardando…' : 'Guardar reunión'}
        </Button>
      </div>
    </form>
  )
}
