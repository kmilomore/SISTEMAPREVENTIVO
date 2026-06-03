import { createClient, type Session } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    })
  : null

export async function getSession(): Promise<Session | null> {
  if (!supabase) {
    return null
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  return session
}

export function onAuthStateChange(callback: (session: Session | null) => void) {
  if (!supabase) {
    return () => undefined
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })

  return () => {
    subscription.unsubscribe()
  }
}

export async function signInWithGoogle(): Promise<{ error: string | null }> {
  if (!supabase) {
    return { error: 'Supabase no inicializado.' }
  }

  const redirectTo = `${window.location.origin}${window.location.pathname}${window.location.search}`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: {
        prompt: 'select_account',
      },
    },
  })

  if (error) {
    return { error: error.message ?? null }
  }

  const authUrl = data?.url
  if (!authUrl) {
    return { error: 'No se pudo iniciar el flujo de autenticacion OAuth.' }
  }

  const isEmbeddedContext = window.self !== window.top
  if (isEmbeddedContext) {
    const popup = window.open(authUrl, '_blank', 'noopener,noreferrer')
    if (!popup) {
      return {
        error:
          'El navegador bloqueo la ventana de autenticacion. Habilita popups para este sitio e intenta nuevamente.',
      }
    }
    return { error: null }
  }

  window.location.assign(authUrl)

  return { error: null }
}

export async function signOut(): Promise<{ error: string | null }> {
  if (!supabase) {
    return { error: 'Supabase no inicializado.' }
  }

  const { error } = await supabase.auth.signOut()
  return { error: error?.message ?? null }
}
