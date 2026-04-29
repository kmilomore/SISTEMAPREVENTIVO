import type { AcuerdoActa, EstadoAcuerdo } from '../../types/actas'

interface AcuerdosFieldArrayProps {
  value: AcuerdoActa[]
  onChange: (value: AcuerdoActa[]) => void
}

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
)

const ESTADOS: EstadoAcuerdo[] = ['Pendiente', 'En proceso', 'Cumplido']

function emptyAcuerdo(): AcuerdoActa {
  return { descripcion: '', responsable: '', plazo: '', estado: 'Pendiente' }
}

export function AcuerdosFieldArray({ value, onChange }: AcuerdosFieldArrayProps) {
  function add() {
    onChange([...value, emptyAcuerdo()])
  }

  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i))
  }

  function update<K extends keyof AcuerdoActa>(i: number, field: K, val: AcuerdoActa[K]) {
    const next = value.map((a, idx) => (idx === i ? { ...a, [field]: val } : a))
    onChange(next)
  }

  const inputClass =
    'h-8 w-full rounded-lg border border-slate-200 px-2.5 text-sm text-slate-800 transition focus:border-[#0057B8] focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 placeholder:text-slate-400'

  const selectClass =
    'h-8 rounded-lg border border-slate-200 px-2 text-sm text-slate-800 transition focus:border-[#0057B8] focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20'

  return (
    <div className="flex flex-col gap-3">
      {value.length === 0 ? (
        <p className="text-sm text-slate-400">Sin acuerdos. Agrega al menos uno.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {value.map((a, i) => (
            <div
              key={i}
              className="grid gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3"
              style={{ gridTemplateColumns: '1.8rem 1fr' }}
            >
              <span className="pt-2 text-xs font-bold text-slate-400">{i + 1}</span>
              <div className="flex flex-col gap-2">
                {/* Descripción */}
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Descripción del acuerdo / medida
                  </label>
                  <textarea
                    rows={2}
                    className="w-full resize-none rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-800 transition focus:border-[#0057B8] focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 placeholder:text-slate-400"
                    placeholder="Describir el acuerdo, medida o compromiso…"
                    value={a.descripcion}
                    onChange={(e) => update(i, 'descripcion', e.target.value)}
                  />
                </div>

                {/* Row: responsable / plazo / estado / eliminar */}
                <div className="grid grid-cols-[1fr_1fr_auto_2rem] gap-2 items-center">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Responsable
                    </label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Nombre o cargo"
                      value={a.responsable ?? ''}
                      onChange={(e) => update(i, 'responsable', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Plazo
                    </label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Ej: 30/08/2025"
                      value={a.plazo ?? ''}
                      onChange={(e) => update(i, 'plazo', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Estado
                    </label>
                    <select
                      className={selectClass}
                      value={a.estado}
                      onChange={(e) => update(i, 'estado', e.target.value as EstadoAcuerdo)}
                    >
                      {ESTADOS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    aria-label="Eliminar acuerdo"
                    className="mt-5 flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 transition"
                    onClick={() => remove(i)}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        className="btn-secondary w-fit gap-1.5 text-xs"
        onClick={add}
      >
        <PlusIcon />
        Agregar acuerdo
      </button>
    </div>
  )
}
