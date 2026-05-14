import { useEffect, useMemo, useState } from 'react'

import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { StatusBadge } from '../components/ui/StatusBadge'
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '../components/ui/Table'
import { fetchActas } from '../lib/actasService'
import { supabase } from '../lib/supabase'
import type { ActaVisitaRow } from '../types/actas'

const schoolsTableName = 'BASE DE DATOS ESCUELAS SLEP'

type SchoolValue = string | number | null
type SchoolRecord = Record<string, SchoolValue>

type LoadState = 'loading' | 'ready' | 'empty' | 'error'

const primaryColumns = [
  'N°',
  'RBD',
  'NOMBRE ESTABLECIMIENTO',
  'COMUNA',
  'TIPO',
  'DIRECTOR/A',
  'CORREO ELECTRÓNICO',
] as const

const detailSections: Array<{ title: string; fields: string[] }> = [
  {
    title: 'Identificacion',
    fields: ['N°', 'RBD', 'NOMBRE ESTABLECIMIENTO', 'TIPO', 'RURAL/URBANO'],
  },
  {
    title: 'Ubicacion',
    fields: ['DIRECCIÓN', 'COMUNA', 'COMUNA_1', 'LATITUD', 'LONGITUD', 'ALTITUD'],
  },
  {
    title: 'Direccion y contacto',
    fields: [
      'DIRECTOR/A',
      'RUT',
      'TELEFONO FIJO/ANEXOS',
      'TELEFONO CELULAR',
      'CORREO ELECTRÓNICO',
      'CORREO SUBROGANTE',
      'FUNCIONARIO SUBROGANTE POR LM',
      'CELULAR',
    ],
  },
  {
    title: 'Consejo escolar y CGPMA',
    fields: [
      'REPRESENTANTE CONSEJO ESCOLAR',
      'CORREO REPRESENTANTE',
      'ASESOR UATP',
      'CORREO ASESOR',
      'NOMBRE PRESIDENTE CGPMA',
      'CORREO',
      'TELEFONO',
      'OBSERVACION CGPMA',
    ],
  },
  {
    title: 'Observaciones',
    fields: ['OBSERVACIONES'],
  },
]

const actaTypeLabels: Record<string, string> = {
  asesoria: 'Asesoría',
  observacion: 'Observación',
  reunion: 'Reunión',
  solicitud: 'Solicitud',
}

export function DatabasePage() {
  const [status, setStatus] = useState<LoadState>('loading')
  const [schools, setSchools] = useState<SchoolRecord[]>([])
  const [actas, setActas] = useState<ActaVisitaRow[]>([])
  const [actasError, setActasError] = useState('')
  const [selectedSchool, setSelectedSchool] = useState<SchoolRecord | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadSchools() {
      if (!supabase) {
        if (!isMounted) {
          return
        }

        setErrorMessage('No fue posible inicializar la conexion con Supabase.')
        setStatus('error')
        return
      }

      setStatus('loading')

      const { data, error } = await supabase.from(schoolsTableName).select('*')

      if (!isMounted) {
        return
      }

      if (error) {
        setErrorMessage(error.message)
        setStatus('error')
        return
      }

      const rows = (data ?? []) as SchoolRecord[]
      const sortedRows = [...rows].sort((left, right) => {
        const leftValue = Number(left['N°'] ?? 0)
        const rightValue = Number(right['N°'] ?? 0)

        return leftValue - rightValue
      })

      setSchools(sortedRows)
      setStatus(sortedRows.length > 0 ? 'ready' : 'empty')
    }

    void loadSchools()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadActas() {
      const { data, error } = await fetchActas()

      if (!isMounted) {
        return
      }

      if (error) {
        setActasError(error)
        setActas([])
        return
      }

      setActas(data)
      setActasError('')
    }

    void loadActas()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!selectedSchool) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedSchool(null)
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => window.removeEventListener('keydown', handleEscape)
  }, [selectedSchool])

  const filteredSchools = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase()

    if (!normalizedQuery) {
      return schools
    }

    return schools.filter((school) => {
      const searchableFields = [
        school['NOMBRE ESTABLECIMIENTO'],
        school['RBD'],
        school['COMUNA'],
        school['DIRECTOR/A'],
        school['TIPO'],
      ]

      return searchableFields.some((value) => String(value ?? '').toLowerCase().includes(normalizedQuery))
    })
  }, [schools, searchTerm])

  const selectedSchoolActas = useMemo(() => {
    if (!selectedSchool) {
      return []
    }

    return actas.filter((acta) => isActaRelatedToSchool(acta, selectedSchool))
  }, [actas, selectedSchool])

  return (
    <>
      <Card tone="strong" padding="none" className="overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-semibold text-slate-800">Escuelas registradas</h3>
              <StatusBadge tone="info" className="whitespace-nowrap">{filteredSchools.length} registros</StatusBadge>
            </div>

            <label className="block">
              <span className="sr-only">Buscar escuela</span>
              <Input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Nombre, RBD, comuna o director..."
                icon={<SearchIcon />}
                containerClassName="sm:w-[320px]"
              />
            </label>
          </div>
        </div>

        {status === 'loading' ? (
          <div className="space-y-2 px-4 py-4">
            <div className="skeleton h-8 rounded-xl" />
            <div className="skeleton h-8 rounded-xl" />
            <div className="skeleton h-8 rounded-xl" />
            <div className="skeleton h-8 rounded-xl" />
            <div className="skeleton h-8 rounded-xl" />
          </div>
        ) : status === 'error' ? (
          <div className="px-6 py-10 sm:px-7">
            <Card tone="danger" className="text-red-700">
              <p className="text-lg font-semibold">No fue posible cargar la base de datos de escuelas.</p>
              <p className="mt-2 text-sm">{errorMessage || 'Revisa la conexion con Supabase y los permisos de lectura de la tabla.'}</p>
            </Card>
          </div>
        ) : status === 'empty' ? (
          <div className="px-6 py-12 text-center sm:px-7">
            <Card tone="soft" className="mx-auto max-w-lg p-8">
              <p className="text-lg font-semibold text-slate-800">No hay escuelas registradas en la tabla.</p>
              <p className="mt-2 text-sm text-slate-500">Cuando existan registros en Supabase, apareceran automaticamente en esta vista.</p>
            </Card>
          </div>
        ) : (
          <DataTable responsive="md">
            <DataTableHead>
              <DataTableRow>
                {primaryColumns.map((column) => (
                  <DataTableHeaderCell key={column}>{column}</DataTableHeaderCell>
                ))}
              </DataTableRow>
            </DataTableHead>
            <DataTableBody>
              {filteredSchools.length === 0 ? (
                <tr>
                  <DataTableCell colSpan={primaryColumns.length} className="py-8 text-center text-slate-400">
                    No se encontraron resultados.
                  </DataTableCell>
                </tr>
              ) : (
                filteredSchools.map((school) => (
                  <DataTableRow
                    key={String(school['N°'])}
                    interactive
                    onClick={() => setSelectedSchool(school)}
                  >
                    <DataTableCell className="font-semibold text-slate-800">{formatValue(school['N°'])}</DataTableCell>
                    <DataTableCell className="text-slate-500">{formatValue(school['RBD'])}</DataTableCell>
                    <DataTableCell className="font-medium text-slate-800">{formatValue(school['NOMBRE ESTABLECIMIENTO'])}</DataTableCell>
                    <DataTableCell className="text-slate-600">{formatValue(school['COMUNA'])}</DataTableCell>
                    <DataTableCell>
                      <StatusBadge tone="info">{formatValue(school['TIPO'])}</StatusBadge>
                    </DataTableCell>
                    <DataTableCell className="text-slate-600">{formatValue(school['DIRECTOR/A'])}</DataTableCell>
                    <DataTableCell className="text-slate-500">{formatValue(school['CORREO ELECTRÓNICO'])}</DataTableCell>
                  </DataTableRow>
                ))
              )}
            </DataTableBody>
          </DataTable>
        )}
      </Card>

      {selectedSchool ? (
        <SchoolDetailModal
          school={selectedSchool}
          relatedActas={selectedSchoolActas}
          actasError={actasError}
          onClose={() => setSelectedSchool(null)}
        />
      ) : null}
    </>
  )
}

function SchoolDetailModal({
  school,
  relatedActas,
  actasError,
  onClose,
}: {
  school: SchoolRecord
  relatedActas: ActaVisitaRow[]
  actasError: string
  onClose: () => void
}) {
  const totalCompromisos = relatedActas.reduce((sum, acta) => sum + acta.acuerdos.length, 0)
  const compromisosPendientes = relatedActas.reduce(
    (sum, acta) => sum + countAcuerdosByEstado(acta, 'Pendiente'),
    0,
  )
  const compromisosEnProceso = relatedActas.reduce(
    (sum, acta) => sum + countAcuerdosByEstado(acta, 'En proceso'),
    0,
  )
  const compromisosCumplidos = relatedActas.reduce(
    (sum, acta) => sum + countAcuerdosByEstado(acta, 'Cumplido'),
    0,
  )
  const ultimaActa = relatedActas[0]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/50 px-4 py-6 sm:items-center">
      <div className="absolute inset-0" onClick={onClose} />

      <Card as="div" tone="strong" padding="none" className="relative z-10 max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#0057B8]">Ficha de establecimiento</p>
            <h4 className="mt-0.5 text-lg font-semibold text-slate-800">{formatValue(school['NOMBRE ESTABLECIMIENTO'])}</h4>
            <p className="text-xs text-slate-500">
              RBD {formatValue(school['RBD'])} · {formatValue(school['COMUNA'])}
            </p>
          </div>

          <Button variant="secondary" size="sm" onClick={onClose} className="rounded-2xl border-slate-200 text-slate-600 hover:bg-slate-50">
            <CloseIcon />
          </Button>
        </div>

        <div className="max-h-[calc(90vh-80px)] overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-4 gap-2">
            <SummaryPill label="N°" value={formatValue(school['N°'])} />
            <SummaryPill label="Tipo" value={formatValue(school['TIPO'])} />
            <SummaryPill label="Comuna" value={formatValue(school['COMUNA'])} />
            <SummaryPill label="Zona" value={formatValue(school['RURAL/URBANO'])} />
          </div>

          <div className="mt-4 space-y-3">
            <Card tone="soft">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trazabilidad de actas</h5>
                  <p className="mt-1 text-sm text-slate-500">
                    Resumen de visitas y compromisos asociados a este establecimiento.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    onClose()
                    window.location.hash = '/acta'
                  }}
                >
                  Ir al gestor de actas
                </Button>
              </div>

              <div className="mt-3 grid gap-2 md:grid-cols-3">
                <SummaryMetricCard label="Visitas registradas" value={String(relatedActas.length)} />
                <SummaryMetricCard label="Compromisos asociados" value={String(totalCompromisos)} />
                <SummaryMetricCard
                  label="Ultima visita"
                  value={ultimaActa ? formatActaDate(ultimaActa.fecha_visita) : 'Sin visitas'}
                />
              </div>

              <div className="mt-2 grid gap-2 md:grid-cols-3">
                <SummaryMetricCard label="Pendientes" value={String(compromisosPendientes)} tone="warning" />
                <SummaryMetricCard label="En proceso" value={String(compromisosEnProceso)} tone="info" />
                <SummaryMetricCard label="Cumplidos" value={String(compromisosCumplidos)} tone="success" />
              </div>

              {actasError ? (
                <Card tone="warning" padding="sm" className="mt-3 rounded-xl text-sm text-amber-800">
                  No fue posible cargar las actas relacionadas: {actasError}
                </Card>
              ) : relatedActas.length === 0 ? (
                <Card tone="neutral" className="mt-3 rounded-xl text-sm text-slate-500">
                  Este establecimiento aun no tiene actas registradas.
                </Card>
              ) : (
                <div className="mt-3 space-y-2">
                  {relatedActas.map((acta) => (
                    <Card
                      key={acta.id}
                      as="article"
                      tone="surface"
                      padding="sm"
                      className="flex flex-col gap-3 rounded-xl md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800">{acta.folio}</span>
                          <StatusBadge tone="info" className="text-xs">
                            {actaTypeLabels[acta.tipo_acta] ?? acta.tipo_acta}
                          </StatusBadge>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatActaDate(acta.fecha_visita)} · {acta.hora_inicio} - {acta.hora_termino}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {acta.participantes.length} participante{acta.participantes.length === 1 ? '' : 's'} · {acta.acuerdos.length} compromiso{acta.acuerdos.length === 1 ? '' : 's'}
                        </p>
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          onClose()
                          window.location.hash = `/acta?actaId=${encodeURIComponent(acta.id)}`
                        }}
                      >
                        Abrir acta
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </Card>

            {detailSections.map((section) => {
              const rows = section.fields.filter((field) => hasValue(school[field]))

              if (rows.length === 0) {
                return null
              }

              return (
                <Card key={section.title} tone="soft">
                  <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{section.title}</h5>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    {rows.map((field) => (
                      <Card key={field} as="article" tone="surface" padding="sm" className="rounded-xl">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{field}</p>
                        <p className="mt-0.5 break-words text-sm text-slate-700">{formatValue(school[field])}</p>
                      </Card>
                    ))}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </Card>
    </div>
  )
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <Card as="article" tone="tint" padding="sm" className="rounded-xl">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#0057B8]">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-800">{value}</p>
    </Card>
  )
}

function SummaryMetricCard({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'info' | 'warning' | 'success'
}) {
  const toneName = {
    default: 'surface',
    info: 'tint',
    warning: 'warning',
    success: 'soft',
  }[tone] as 'surface' | 'tint' | 'warning' | 'soft'

  const valueClassName = {
    default: 'text-slate-800',
    info: 'text-[#0033A0]',
    warning: 'text-amber-800',
    success: 'text-emerald-800',
  }[tone]

  return (
    <Card as="article" tone={toneName} padding="sm" className="rounded-xl">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${valueClassName}`}>{value}</p>
    </Card>
  )
}

function formatValue(value: SchoolValue) {
  if (value === null || value === '') {
    return 'Sin dato'
  }

  return String(value)
}

function hasValue(value: SchoolValue) {
  return value !== null && value !== ''
}

function normalizeComparableValue(value: SchoolValue | undefined) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function normalizeComparableIdentifier(value: SchoolValue | undefined) {
  return normalizeComparableValue(value).replace(/[^a-z0-9]/g, '')
}

function isActaRelatedToSchool(acta: ActaVisitaRow, school: SchoolRecord) {
  const schoolId = normalizeComparableValue(school['N°'])
  const schoolRbd = normalizeComparableValue(school['RBD'])
  const schoolName = normalizeComparableValue(school['NOMBRE ESTABLECIMIENTO'])
  const schoolIdCompact = normalizeComparableIdentifier(school['N°'])
  const schoolRbdCompact = normalizeComparableIdentifier(school['RBD'])
  const schoolNameCompact = normalizeComparableIdentifier(school['NOMBRE ESTABLECIMIENTO'])

  const actaValues = [
    normalizeComparableValue(acta.establecimiento_id),
    normalizeComparableValue(acta.establecimiento_rbd),
    normalizeComparableValue(acta.establecimiento_nombre),
  ]

  const actaCompactValues = [
    normalizeComparableIdentifier(acta.establecimiento_id),
    normalizeComparableIdentifier(acta.establecimiento_rbd),
    normalizeComparableIdentifier(acta.establecimiento_nombre),
  ]

  return actaValues.some((value) => value !== '' && [schoolId, schoolRbd, schoolName].includes(value))
    || actaCompactValues.some(
      (value) => value !== '' && [schoolIdCompact, schoolRbdCompact, schoolNameCompact].includes(value),
    )
}

function countAcuerdosByEstado(acta: ActaVisitaRow, estado: string) {
  return acta.acuerdos.filter((acuerdo) => normalizeComparableValue(acuerdo.estado) === normalizeComparableValue(estado)).length
}

function formatActaDate(dateStr?: string) {
  if (!dateStr) {
    return 'Sin fecha'
  }

  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}