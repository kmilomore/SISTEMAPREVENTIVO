const brandLogo = '/SLEPCOLCHAGUA.webp'

type LoginPageMode = 'loading' | 'setup' | 'login'

type LoginPageProps = {
  mode: LoginPageMode
  authError?: string
  onLogin?: () => Promise<void>
}

export function LoginPage({ mode, authError = '', onLogin }: LoginPageProps) {
  const title =
    mode === 'loading'
      ? 'Validando sesion institucional'
      : mode === 'setup'
        ? 'Configura la conexion con Supabase'
        : 'Accede al portal con tu cuenta Google'

  const description =
    mode === 'loading'
      ? 'Estamos verificando la sesion actual y la autorizacion del portal.'
      : mode === 'setup'
        ? 'Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para habilitar autenticacion y acceso a los modulos.'
        : 'El acceso al portal de Prevencion se realiza con Google Workspace. La autorizacion final se valida en Supabase mediante RLS.'

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(0,111,179,0.16),_transparent_36%),linear-gradient(180deg,_#f4f8fb_0%,_#eef4f8_45%,_#f9fbfd_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute left-[-8%] top-12 h-44 w-44 rounded-full bg-[#006fb3]/10 blur-3xl" />
        <div className="absolute bottom-10 right-[-5%] h-56 w-56 rounded-full bg-[#00a3ad]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[34px] border border-white/70 bg-white/75 p-7 shadow-[0_30px_80px_rgba(15,23,42,0.10)] backdrop-blur sm:p-10">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-2 shadow-sm">
                <img src={brandLogo} alt="SLEP Colchagua" className="h-full w-full rounded-xl object-contain" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#006fb3]">
                  Gobierno de Chile
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  Portal de Prevencion
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Monitoreo territorial, actas y compromisos del SLEP Colchagua.
                </p>
              </div>
            </div>

            <div className="mt-10 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#006fb3]">Ingreso seguro</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight text-slate-900 sm:text-5xl">{title}</h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">{description}</p>

              {mode === 'login' ? (
                <button
                  type="button"
                  onClick={() => void onLogin?.()}
                  className="mt-8 inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#006fb3] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(0,111,179,0.25)] transition hover:bg-[#005b93]"
                >
                  Continuar con Google
                </button>
              ) : null}

              {mode === 'loading' ? (
                <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#006fb3]" />
                  Sincronizando autenticacion...
                </div>
              ) : null}

              {authError ? <p className="mt-5 text-sm text-red-600">{authError}</p> : null}
            </div>
          </section>

          <aside className="rounded-[34px] bg-[#0b2f47] p-7 text-white shadow-[0_30px_80px_rgba(11,47,71,0.25)] sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8fd3ff]">Acceso institucional</p>
            <h3 className="mt-4 text-2xl font-semibold">Control de acceso y trazabilidad</h3>
            <p className="mt-4 text-sm leading-7 text-blue-50/80">
              El portal opera con autenticacion Google y seguridad RLS en Supabase. Toda lectura y escritura depende del usuario autenticado y autorizado.
            </p>

            <div className="mt-8 grid gap-4">
              <InfoCard
                title="Autorizacion centralizada"
                description="El frontend autentica con Google y Supabase decide el acceso real a datos mediante RLS y politicas del proyecto."
                items={['Supabase Auth', 'Row Level Security', 'OAuth Google']}
              />
              <InfoCard
                title="Modulos protegidos"
                description="Base de datos, actas, compromisos y almacenamiento seguro."
                items={['Base de Datos', 'Actas de visita', 'Compromisos', 'Archivos PDF']}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function InfoCard({
  title,
  description,
  items,
}: {
  title: string
  description: string
  items: string[]
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/8 p-5 backdrop-blur">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-blue-50/70">{description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-50"
          >
            {item}
          </span>
        ))}
      </div>
    </section>
  )
}