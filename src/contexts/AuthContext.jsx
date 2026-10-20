import { createContext, useContext, useEffect, useState } from 'react'
import { initialAuthParams, supabase } from '../lib/supabase'

const AuthContext = createContext(null)

// Where Supabase sends the user back after clicking an email link. Must match
// Authentication → URL Configuration → Redirect URLs. The trailing slash
// matters: an entry like `https://site/**` doesn't match a bare `https://site`.
export const redirectTo = () => `${window.location.origin}/`

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  // true after the user lands from a "reset password" email link — the app
  // then asks for a new password before letting them continue
  const [passwordRecovery, setPasswordRecovery] = useState(
    () => initialAuthParams.get('type') === 'recovery' && initialAuthParams.has('access_token'),
  )
  // an email link that failed (usually expired / already used), e.g.
  // #error=access_denied&error_code=otp_expired
  const [linkError, setLinkError] = useState(() =>
    initialAuthParams.has('error')
      ? { code: initialAuthParams.get('error_code'), message: initialAuthParams.get('error_description') }
      : null,
  )

  useEffect(() => {
    if (initialAuthParams.has('error')) {
      history.replaceState(null, '', window.location.pathname + window.location.search)
    }


    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true)
      if (event === 'SIGNED_OUT') setPasswordRecovery(false)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo() },
    })
    // With email confirmation on, Supabase doesn't error for an already
    // registered address — it returns a user with no identities instead
    if (!error && data.user && data.user.identities?.length === 0) {
      return { error: { code: 'user_already_exists' } }
    }
    return { error }
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectTo() })
    return { error }
  }

  async function updatePassword(password) {
    const { error } = await supabase.auth.updateUser({ password })
    if (!error) setPasswordRecovery(false)
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        passwordRecovery,
        linkError,
        clearLinkError: () => setLinkError(null),
        signUp,
        signIn,
        resetPassword,
        updatePassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
