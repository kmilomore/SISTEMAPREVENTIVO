import type { ParticipanteActa } from '../../types/actas'

interface ParticipantesFieldArrayProps {
  value: ParticipanteActa[]
  onChange: (value: ParticipanteActa[]) => void
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

function emptyParticipante(): ParticipanteActa {
  return { nombre: '', rol_estamento: '', contacto: '' }
}

export function ParticipantesFieldArray({ value, onChange }: ParticipantesFieldArrayProps) {
  function add() {
    onChange([...value, emptyParticipante()])
  }

  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i))
  }

  function update(i: number, field: keyof ParticipanteActa, val: string) {
    const next = value.map((p, idx) => (idx === i ? { ...p, [field]: val } : p))
    onChange(next)
  }

  const inputClass =
    'h-8 w-full rounded-lg border border-slate-200 px-2.5 text-sm text-slate-800 transition focus:border-[#0057B8] focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 placeholder:text-slate-400'

  return (
    <div className="flex flex-col gap-3">
      {value.length === 0 ? (
        <p className="text-sm text-slate-400">Sin participantes. Agrega al menos uno.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-left">
                <th className="pb-2 pr-3 text-xs font-semibold uppercase tracking-wide text-slate-400 w-5">#</th>
                <th className="pb-2 pr-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Nombre completo</th>
                <th className="pb-2 pr-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Rol / Estamento</th>
                <th className="pb-2 pr-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Contacto (opc.)</th>
                <th className="pb-2 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {value.map((p, i) => (
                <tr key={i} className="group">
                  <td className="py-1.5 pr-3 text-xs text-slate-400">{i + 1}</td>
                  <td className="py-1.5 pr-3">
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Nombre y apellido"
                      value={p.nombre}
                      onChange={(e) => update(i, 'nombre', e.target.value)}
                    />
                  </td>
                  <td className="py-1.5 pr-3">
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Ej: Director/a, Docente, Apoderado…"
                      value={p.rol_estamento}
                      onChange={(e) => update(i, 'rol_estamento', e.target.value)}
                    />
                  </td>
                  <td className="py-1.5 pr-3">
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Teléfono o correo"
                      value={p.contacto ?? ''}
                      onChange={(e) => update(i, 'contacto', e.target.value)}
                    />
                  </td>
                  <td className="py-1.5">
                    <button
                      type="button"
                      aria-label="Eliminar participante"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 transition"
                      onClick={() => remove(i)}
                    >
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        type="button"
        className="btn-secondary w-fit gap-1.5 text-xs"
        onClick={add}
      >
        <PlusIcon />
        Agregar participante
      </button>
    </div>
  )
}
