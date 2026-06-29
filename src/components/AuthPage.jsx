import { useState } from 'react'
import { colors } from '../utils/colors'
import { useTranslation } from '../i18n/LanguageContext'
import { useAuth } from '../contexts/AuthContext'

export default function AuthPage() {
  const { t } = useTranslation()
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setSubmitting(true)

    const { error } = mode === 'login' ? await signIn(email, password) : await signUp(email, password)

    if (error) {
      setError(error.message)
    } else if (mode === 'register') {
      setInfo(t('authCheckEmail'))
    }
    setSubmitting(false)
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-8" style={{ background: colors.bg }}>
      <div
        className="w-full max-w-sm rounded-[12px] border p-6"
        style={{ background: colors.surface, borderColor: colors.border }}
      >
        <div className="text-lg font-semibold lowercase text-center mb-1">
          i<span style={{ color: colors.accent }}>n</span>ji
        </div>
        <div className="text-center text-sm mb-5" style={{ color: colors.textSecondary }}>
          {mode === 'login' ? t('authLoginSubtitle') : t('authRegisterSubtitle')}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="email"
            placeholder={t('authEmail')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-3 py-2.5 rounded-[8px] border text-sm outline-none"
            style={{ borderColor: colors.border, color: colors.textPrimary }}
          />
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            placeholder={t('authPassword')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-3 py-2.5 rounded-[8px] border text-sm outline-none"
            style={{ borderColor: colors.border, color: colors.textPrimary }}
          />

          {error && <div className="text-sm" style={{ color: colors.coral }}>{error}</div>}
          {info && <div className="text-sm" style={{ color: colors.accent }}>{info}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 px-3 py-2 rounded-[8px] text-sm font-medium text-white disabled:opacity-60"
            style={{ background: colors.accent }}
          >
            {mode === 'login' ? t('authLoginButton') : t('authRegisterButton')}
          </button>
        </form>

        <div className="text-center text-sm mt-4" style={{ color: colors.textSecondary }}>
          {mode === 'login' ? (
            <>
              {t('authNoAccount')}{' '}
              <button
                type="button"
                className="font-medium underline"
                style={{ color: colors.accent }}
                onClick={() => {
                  setMode('register')
                  setError('')
                  setInfo('')
                }}
              >
                {t('authRegisterButton')}
              </button>
            </>
          ) : (
            <>
              {t('authHaveAccount')}{' '}
              <button
                type="button"
                className="font-medium underline"
                style={{ color: colors.accent }}
                onClick={() => {
                  setMode('login')
                  setError('')
                  setInfo('')
                }}
              >
                {t('authLoginButton')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
