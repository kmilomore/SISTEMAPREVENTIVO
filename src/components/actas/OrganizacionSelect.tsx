import { useState, useEffect, useMemo, useRef } from 'react'
import type { Organizacion, TipoReunion } from '../../types/actas'
import { fetchOrganizaciones } from '../../lib/organizacionesService'

const TIPO_LABELS: Record<TipoReunion, string> = {
  establecimiento: 'Establecimiento',
  organismo_publico: 'Org. pública',
  empresa_privada: 'Empresa',
  ong: 'ONG',
  equipo_interno: 'Equipo interno',
  otro: 'Otro',
}

interface OrganizacionSelectProps {
  value: Organizacion | null
  onChange: (org: Organizacion | null) => void
  onCreateNew: (nombre: string) => void
  error?: string
}

export function OrganizacionSelect({
  value,
  onChange,
  onCreateNew,
  error,
}: OrganizacionSelectProps) {
  const [query, setQuery] = useState('')
  const [orgs, setOrgs] = useState<Organizacion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchOrganizaciones().then(({ data }) => {
      setOrgs(data)
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return orgs.slice(0, 50)
    return orgs
      .filter((o) => o.nombre.toLowerCase().includes(q))
      .slice(0, 40)
  }, [query, orgs])

  const showCreateNew =
    query.trim().length > 1 &&
    !orgs.some((o) => o.nombre.toLowerCase() === query.trim().toLowerCase())

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelect(org: Organizacion) {
    onChange(org)
    setQuery(org.nombre)
    setOpen(false)
  }

  function handleClear() {
    onChange(null)
    setQuery('')
    setOpen(true)
  }

  const inputClass = `w-full h-9 rounded-xl border px-3 pr-9 text-sm transition focus:outline-none focus:ring-2 ${
    error
      ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
      : 'border-slate-200 focus:border-[#0057B8] focus:ring-[#0057B8]/20'
  }`

  const inputValue = open ? query : query || (value?.nombre ?? '')

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input
          type="text"
          className={inputClass}
          placeholder={loading ? 'Cargando organizaciones…' : 'Buscar organización existente…'}
          value={inputValue}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            if (!e.target.value) onChange(null)
          }}
          onFocus={() => {
            setQuery(value?.nombre ?? query)
            setOpen(true)
          }}
          autoComplete="off"
        />
        {value ? (
          <button
            type="button"
            aria-label="Limpiar"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            onClick={handleClear}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        ) : (
          <svg
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        )}
      </div>

      {open && !loading && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
          {filtered.map((org) => (
            <button
              key={org.id}
              type="button"
              className="flex w-full flex-col px-4 py-2.5 text-left hover:bg-blue-50"
              onClick={() => handleSelect(org)}
            >
              <span className="text-sm font-medium text-slate-800">{org.nombre}</span>
              <span className="text-xs text-slate-500">
                {TIPO_LABELS[org.tipo]}
                {org.contacto_nombre ? ` · ${org.contacto_nombre}` : ''}
              </span>
            </button>
          ))}

          {showCreateNew && (
            <button
              type="button"
              className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-2.5 text-left hover:bg-[#f0f4ff]"
              onClick={() => {
                onCreateNew(query.trim())
                setOpen(false)
              }}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0033A0] text-[10px] font-bold text-white">+</span>
              <span className="text-sm text-[#0033A0]">
                Crear &ldquo;<span className="font-semibold">{query.trim()}</span>&rdquo; como nueva organización
              </span>
            </button>
          )}

          {filtered.length === 0 && !showCreateNew && (
            <div className="px-4 py-3 text-sm text-slate-500">Sin resultados</div>
          )}
        </div>
      )}

      {value && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#0033A0]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Organización del catálogo seleccionada — los campos se pre-rellenaron
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
