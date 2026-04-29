import type { TipoActa } from '../../types/actas'

interface TipoOption {
  id: TipoActa
  label: string
  description: string
  available: boolean
  icon: React.ReactNode
}

const CheckSquareIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <polyline points="9 11 12 14 22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
)
const EyeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)
const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)
const ClipboardIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
)

const TIPOS: TipoOption[] = [
  {
    id: 'asesoria',
    label: 'Asesoría',
    description: 'Visita de asesoría técnica en prevención de riesgos al establecimiento.',
    available: true,
    icon: <CheckSquareIcon />,
  },
  {
    id: 'observacion',
    label: 'Observación',
    description: 'Inspección y observación de condiciones de riesgo en terreno.',
    available: false,
    icon: <EyeIcon />,
  },
  {
    id: 'reunion',
    label: 'Reunión',
    description: 'Reunión de coordinación, comité o consejo escolar.',
    available: false,
    icon: <UsersIcon />,
  },
  {
    id: 'solicitud',
    label: 'Solicitud',
    description: 'Gestión de solicitud formal recibida del establecimiento.',
    available: false,
    icon: <ClipboardIcon />,
  },
]

interface ActaTipoSelectorProps {
  onSelect: (tipo: TipoActa) => void
  onCancel: () => void
}

export function ActaTipoSelector({ onSelect, onCancel }: ActaTipoSelectorProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0057B8]">Nueva acta</p>
        <h2 className="mt-1 text-2xl font-light text-slate-800">Selecciona el tipo de acta</h2>
        <p className="mt-1 text-sm text-slate-500">
          Elige la modalidad que corresponde a la actividad que deseas registrar.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {TIPOS.map((tipo) => {
          const base =
            'relative flex flex-col gap-3 rounded-2xl border p-5 text-left transition'
          const available =
            `${base} cursor-pointer border-[rgba(0,51,160,0.15)] bg-white shadow-sm hover:border-[#0033A0] hover:shadow-md`
          const disabled =
            `${base} cursor-not-allowed border-slate-100 bg-slate-50 opacity-60`

          return (
            <button
              key={tipo.id}
              type="button"
              className={tipo.available ? available : disabled}
              onClick={() => tipo.available && onSelect(tipo.id)}
              disabled={!tipo.available}
            >
              {!tipo.available && (
                <span className="absolute right-3 top-3 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                  Próximamente
                </span>
              )}
              <span className={tipo.available ? 'text-[#0033A0]' : 'text-slate-300'}>
                {tipo.icon}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">{tipo.label}</p>
                <p className="mt-0.5 text-xs leading-5 text-slate-500">{tipo.description}</p>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex justify-end">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
