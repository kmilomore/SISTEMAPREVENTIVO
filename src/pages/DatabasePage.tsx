import { useEffect, useMemo, useState } from 'react'

import { supabase } from '../lib/supabase'

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

export function DatabasePage() {
  const [status, setStatus] = useState<LoadState>('loading')
  const [schools, setSchools] = useState<SchoolRecord[]>([])
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

  return (
    <>
      <section className="panel-card-strong overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-semibold text-slate-800">Escuelas registradas</h3>
              <span className="status-chip status-info whitespace-nowrap">{filteredSchools.length} registros</span>
            </div>

            <label className="relative block">
              <span className="sr-only">Buscar escuela</span>
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <SearchIcon />
              </span>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Nombre, RBD, comuna o director..."
                className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm text-slate-700 placeholder:text-slate-400 sm:w-[320px]"
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
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
              <p className="text-lg font-semibold">No fue posible cargar la base de datos de escuelas.</p>
              <p className="mt-2 text-sm">{errorMessage || 'Revisa la conexion con Supabase y los permisos de lectura de la tabla.'}</p>
            </div>
          </div>
        ) : status === 'empty' ? (
          <div className="px-6 py-12 text-center sm:px-7">
            <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-slate-50 p-8">
              <p className="text-lg font-semibold text-slate-800">No hay escuelas registradas en la tabla.</p>
              <p className="mt-2 text-sm text-slate-500">Cuando existan registros en Supabase, apareceran automaticamente en esta vista.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  {primaryColumns.map((column) => (
                    <th key={column} className="px-4 py-2.5 font-semibold uppercase tracking-wide">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-sm text-slate-700">
                {filteredSchools.length === 0 ? (
                  <tr>
                    <td colSpan={primaryColumns.length} className="px-4 py-8 text-center text-slate-400">
                      No se encontraron resultados.
                    </td>
                  </tr>
                ) : (
                  filteredSchools.map((school) => (
                    <tr
                      key={String(school['N°'])}
                      className="cursor-pointer transition hover:bg-[#f8fbff]"
                      onClick={() => setSelectedSchool(school)}
                    >
                      <td className="px-4 py-2 font-semibold text-slate-800">{formatValue(school['N°'])}</td>
                      <td className="px-4 py-2 text-slate-500">{formatValue(school['RBD'])}</td>
                      <td className="px-4 py-2 font-medium text-slate-800">{formatValue(school['NOMBRE ESTABLECIMIENTO'])}</td>
                      <td className="px-4 py-2 text-slate-600">{formatValue(school['COMUNA'])}</td>
                      <td className="px-4 py-2">
                        <span className="status-chip status-info">{formatValue(school['TIPO'])}</span>
                      </td>
                      <td className="px-4 py-2 text-slate-600">{formatValue(school['DIRECTOR/A'])}</td>
                      <td className="px-4 py-2 text-slate-500">{formatValue(school['CORREO ELECTRÓNICO'])}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedSchool ? <SchoolDetailModal school={selectedSchool} onClose={() => setSelectedSchool(null)} /> : null}
    </>
  )
}

function SchoolDetailModal({ school, onClose }: { school: SchoolRecord; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/50 px-4 py-6 sm:items-center">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#0057B8]">Ficha de establecimiento</p>
            <h4 className="mt-0.5 text-lg font-semibold text-slate-800">{formatValue(school['NOMBRE ESTABLECIMIENTO'])}</h4>
            <p className="text-xs text-slate-500">
              RBD {formatValue(school['RBD'])} · {formatValue(school['COMUNA'])}
            </p>
          </div>

          <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 px-3 py-2 text-slate-600 transition hover:bg-slate-50">
            <CloseIcon />
          </button>
        </div>

        <div className="max-h-[calc(90vh-80px)] overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-4 gap-2">
            <SummaryPill label="N°" value={formatValue(school['N°'])} />
            <SummaryPill label="Tipo" value={formatValue(school['TIPO'])} />
            <SummaryPill label="Comuna" value={formatValue(school['COMUNA'])} />
            <SummaryPill label="Zona" value={formatValue(school['RURAL/URBANO'])} />
          </div>

          <div className="mt-4 space-y-3">
            {detailSections.map((section) => {
              const rows = section.fields.filter((field) => hasValue(school[field]))

              if (rows.length === 0) {
                return null
              }

              return (
                <section key={section.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{section.title}</h5>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    {rows.map((field) => (
                      <article key={field} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{field}</p>
                        <p className="mt-0.5 break-words text-sm text-slate-700">{formatValue(school[field])}</p>
                      </article>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-[#c8dafd] bg-[#f4f8ff] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#0057B8]">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-800">{value}</p>
    </article>
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