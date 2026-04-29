import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import type { EscuelaSLEP } from '../../types/actas'

interface EstablecimientoSelectProps {
  value: string
  onChange: (escuela: EscuelaSLEP | null) => void
  error?: string
}

export function EstablecimientoSelect({
  value,
  onChange,
  error,
}: EstablecimientoSelectProps) {
  const [query, setQuery] = useState('')
  const [escuelas, setEscuelas] = useState<EscuelaSLEP[]>([])
  const [filtered, setFiltered] = useState<EscuelaSLEP[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      if (!supabase) return
      setLoading(true)
      const { data } = await supabase
        .from('BASE DE DATOS ESCUELAS SLEP')
        .select('"N°", RBD, "NOMBRE ESTABLECIMIENTO", COMUNA, TIPO, "DIRECTOR/A", "CORREO ELECTRÓNICO"')
        .order('"NOMBRE ESTABLECIMIENTO"', { ascending: true })
      setEscuelas((data ?? []) as EscuelaSLEP[])
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setFiltered(escuelas.slice(0, 60))
    } else {
      const q = query.toLowerCase()
      setFiltered(
        escuelas
          .filter(
            (e) =>
              (e['NOMBRE ESTABLECIMIENTO'] as string)?.toLowerCase().includes(q) ||
              (e['COMUNA'] as string)?.toLowerCase().includes(q) ||
              (e['RBD'] as string)?.toLowerCase().includes(q),
          )
          .slice(0, 40),
      )
    }
  }, [query, escuelas])

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Mostrar nombre del establecimiento seleccionado en el input
  useEffect(() => {
    if (!value) {
      setQuery('')
      return
    }
    const found = escuelas.find((e) => String(e['N°']) === value)
    if (found) setQuery(String(found['NOMBRE ESTABLECIMIENTO']))
  }, [value, escuelas])

  function handleSelect(escuela: EscuelaSLEP) {
    onChange(escuela)
    setQuery(String(escuela['NOMBRE ESTABLECIMIENTO']))
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

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input
          type="text"
          className={inputClass}
          placeholder={loading ? 'Cargando establecimientos…' : 'Buscar por nombre, RBD o comuna…'}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            if (!e.target.value) onChange(null)
          }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
        {value && (
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
        )}
        {!value && (
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
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-500">Sin resultados para "{query}"</div>
          ) : (
            filtered.map((e) => (
              <button
                key={e['N°']}
                type="button"
                className="flex w-full flex-col px-4 py-2 text-left hover:bg-blue-50"
                onClick={() => handleSelect(e)}
              >
                <span className="text-sm font-medium text-slate-800">
                  {String(e['NOMBRE ESTABLECIMIENTO'])}
                </span>
                <span className="text-xs text-slate-500">
                  RBD {e['RBD']} · {e['COMUNA']} · {e['TIPO']}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
